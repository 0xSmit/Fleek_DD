const fs = require('fs');
const { deleteAwsFunction } = require('./deployers/aws');
const { deleteGcpFunction } = require('./deployers/gcp');
const { deleteDoFunction } = require('./deployers/digitalocean');

async function deleteProviderFunctions(provider) {
  const fileName = `${provider}_deployment_data.json`;
  if (!fs.existsSync(fileName)) {
    console.log(`No deployment data found for ${provider}`);
    return;
  }

  const deploymentData = JSON.parse(fs.readFileSync(fileName, 'utf8'));

  switch (provider) {
    case 'aws':
      for (const data of deploymentData) {
        await deleteAwsFunction(data.region, data.functionName);
      }
      break;
    case 'gcp':
      for (const data of deploymentData) {
        await deleteGcpFunction(data.region, data.functionName);
      }
      break;
    case 'do':
      for (const data of deploymentData) {
        await deleteDoFunction(data.functionName);
      }
      break;
    default:
      console.error(`Unknown provider: ${provider}`);
      return;
  }

  fs.unlinkSync(fileName);
  console.log(`All functions for ${provider} have been deleted and deployment data removed.`);
}

async function deleteAllFunctions() {
  const providers = process.argv.slice(2);
  if (providers.length === 0) {
    console.log('Please specify one or more providers: aws, gcp, do');
    return;
  }

  for (const provider of providers) {
    await deleteProviderFunctions(provider);
  }
}

deleteAllFunctions();
