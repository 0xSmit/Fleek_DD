const { CloudFunctionsServiceClient } = require('@google-cloud/functions');

async function deployToGoogleCloudRegions(regions, functionName, sourceCodePath) {
  // GCP uses application default credentials, which can be set via the
  // GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to a JSON key file
  const client = new CloudFunctionsServiceClient();
  const results = [];
  for (const region of regions) {
    const request = {
      parent: `projects/${process.env.GCP_PROJECT_ID}/locations/${region}`,
      function: {
        name: `projects/${process.env.GCP_PROJECT_ID}/locations/${region}/functions/${functionName}`,
        entryPoint: 'benchmarkFunction',
        runtime: 'nodejs20', // Update to latest Node.js version
        sourceArchiveUrl: sourceCodePath,
        availableMemoryMb: 1024, // Increase memory to 1024 MB
        timeout: '60s', // Increase timeout to 60 seconds
      },
    };

    try {
      const [operation] = await client.createFunction(request);
      const [response] = await operation.promise();
      results.push({ name: region, url: response.httpsTrigger.url });
    } catch (error) {
      console.error(`Error deploying to ${region}:`, error);
    }
  }
  return { regions: results };
}

module.exports = { deployToGoogleCloudRegions };
