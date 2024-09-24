const {
  LambdaClient,
  CreateFunctionCommand,
  CreateFunctionUrlConfigCommand,
  DeleteFunctionCommand,
  AddPermissionCommand, // Add this import
} = require('@aws-sdk/client-lambda');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

async function createZipFile(sourceFilePath, zipFilePath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', reject);

    archive.pipe(output);
    archive.file(sourceFilePath, { name: path.basename(sourceFilePath) });
    archive.finalize();
  });
}

async function deployToAwsRegions(regions, functionName, sourceFilePath) {
  const results = [];
  const deploymentData = [];
  const zipFilePath = './aws-function.zip';

  // Create zip file
  await createZipFile(sourceFilePath, zipFilePath);

  console.log('AWS Lambda Role ARN:', process.env.AWS_LAMBDA_ROLE_ARN);

  for (const region of regions) {
    const client = new LambdaClient({ region });

    const params = {
      FunctionName: functionName,
      Code: { ZipFile: fs.readFileSync(zipFilePath) },
      Handler: 'index.handler',
      Role: process.env.AWS_LAMBDA_ROLE_ARN,
      Runtime: 'nodejs20.x',
      MemorySize: 3000, // Increase memory to 1024 MB
      Timeout: 60, // Increase timeout to 60 seconds
    };

    try {
      console.log(`Deploying to ${region}...`);
      const createFunctionCommand = new CreateFunctionCommand(params);
      await client.send(createFunctionCommand);

      const urlCommand = new CreateFunctionUrlConfigCommand({
        FunctionName: functionName,
        AuthType: 'NONE',
      });
      const urlResponse = await client.send(urlCommand);

      const addPermissionCommand = new AddPermissionCommand({
        FunctionName: functionName,
        StatementId: 'FunctionURLAllowPublicAccess',
        Action: 'lambda:InvokeFunctionUrl',
        Principal: '*',
        FunctionUrlAuthType: 'NONE',
      });
      await client.send(addPermissionCommand);

      results.push({ name: region, url: urlResponse.FunctionUrl });
      deploymentData.push({
        region,
        functionName,
        url: urlResponse.FunctionUrl,
      });
      console.log(`Successfully deployed to ${region}`);
    } catch (error) {
      console.error(`Error deploying to ${region}:`, error.message);
      if (error.name === 'ResourceNotFoundException') {
        console.warn(`Region ${region} might not be available for your account. Skipping.`);
      } else {
        console.error('Full error:', JSON.stringify(error, null, 2));
      }
      // Continue with the next region
    }
  }

  // Clean up the zip file
  fs.unlinkSync(zipFilePath);

  return { regions: results, deploymentData };
}

async function deleteAwsFunction(region, functionName) {
  const client = new LambdaClient({ region });
  try {
    const command = new DeleteFunctionCommand({ FunctionName: functionName });
    await client.send(command);
    console.log(`Deleted function ${functionName} in ${region}`);
  } catch (error) {
    console.error(`Error deleting function in ${region}:`, error);
  }
}

module.exports = { deployToAwsRegions, deleteAwsFunction };
