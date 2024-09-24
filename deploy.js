require('dotenv').config();

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { deployToAwsRegions, deleteAwsFunction } = require('./deployers/aws');
const { deployToGoogleCloudRegions, deleteGcpFunction } = require('./deployers/gcp');
const { deployToDigitalOceanRegions, deleteDoFunction } = require('./deployers/digitalocean');
const deployConfig = require('./deploy-config.json');
const { execSync } = require('child_process');
const archiver = require('archiver');

async function deployToProvider(provider) {
  let results;
  let deploymentData;
  switch (provider) {
    case 'aws':
      ({ regions: results, deploymentData } = await deployToAwsRegions(
        deployConfig.aws.regions,
        deployConfig.aws.functionName,
        deployConfig.aws.sourceFilePath
      ));
      break;
    // ... (other cases)
  }

  if (results && results.length > 0) {
    await updateServicesFile(results, provider);
    await saveDeploymentData(deploymentData, provider);
    console.log(`Deployment to ${provider} completed. ${results.length} regions successfully deployed.`);
  } else {
    console.log(`No successful deployments for ${provider}. Check the logs for details.`);
  }
}

async function updateServicesFile(newResults, provider) {
  let services = {};
  if (fs.existsSync('services.js')) {
    services = require('./services.js');
  }
  services[provider] = { regions: newResults };
  const servicesContent = `module.exports = ${JSON.stringify(services, null, 2)};`;
  await fsPromises.writeFile('services.js', servicesContent);
}

async function saveDeploymentData(data, provider) {
  const fileName = `${provider}_deployment_data.json`;
  await fsPromises.writeFile(fileName, JSON.stringify(data, null, 2));
  console.log(`Deployment data saved to ${fileName}`);
}

async function deployToGoogleCloud() {
  const project = process.env.GCP_PROJECT_ID;
  const runtime = process.env.GCP_RUNTIME;
  const memory = '3000MB';
  const timeout = '60s';

  if (!project || !runtime) {
    console.error('Missing Google Cloud configuration in environment variables');
    return;
  }

  const { regions, functionName, sourceCodePath } = deployConfig.gcp;
  let results = [];

  const sourcePath = path.resolve(sourceCodePath);
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
    console.error(`Source path ${sourcePath} does not exist or is not a directory`);
    return;
  }

  // Create a temporary directory for the build
  const tempDir = path.join(__dirname, 'temp_gcp_function');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);

  // Copy function files to temp directory
  execSync(`cp -R ${sourcePath}/* ${tempDir}`);

  // Build the function locally
  console.log('Building function locally...');
  execSync('npm run build', { cwd: tempDir, stdio: 'inherit' });

  for (const region of regions) {
    console.log(`Deploying ${functionName} to ${region}...`);

    let command = `gcloud functions deploy ${functionName} \
      --project=${project} \
      --region=${region} \
      --runtime=${runtime} \
      --trigger-http \
      --allow-unauthenticated \
      --memory=${memory} \
      --timeout=${timeout} \
      --source=${tempDir}`;

    console.log(command);

    try {
      const { stdout } = await execPromise(command);
      console.log(`Successfully deployed ${functionName} to ${region}`);

      const urlMatch = stdout.match(/URL: (https:\/\/[^\s]+)/);
      if (urlMatch && urlMatch[1]) {
        results.push({ name: region, url: urlMatch[1] });
      }
    } catch (error) {
      console.error(`Failed to deploy ${functionName} to ${region}:`, error.message);
    }
  }

  // Clean up the temporary directory
  fs.rmSync(tempDir, { recursive: true, force: true });

  return { regions: results, deploymentData: { functionName, regions: results } };
}

function createZipArchive(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function deployAllFunctions() {
  const providers = process.argv.slice(2);
  if (providers.length === 0) {
    console.log('Please specify one or more providers: aws, gcp, do');
    return;
  }

  for (const provider of providers) {
    if (provider === 'gcp') {
      const { regions, deploymentData } = await deployToGoogleCloud();
      await updateServicesFile(regions, 'gcp');
      await saveDeploymentData(deploymentData, 'gcp');
    } else {
      await deployToProvider(provider);
    }
  }
}

async function deploy() {
  await deployAllFunctions();
}

deploy().catch((error) => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
