const axios = require('axios');
const fs = require('fs');

async function deployToDigitalOceanRegions(regions, functionName, sourceCodePath) {
  const results = [];
  for (const region of regions) {
    try {
      const response = await axios.post(
        'https://api.digitalocean.com/v2/functions',
        {
          name: functionName,
          region: region,
          source_code: fs.readFileSync(sourceCodePath, 'utf8'),
          memory: 1024, // Increase memory to 1024 MB
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DIGITALOCEAN_API_TOKEN}`,
          },
        }
      );
      results.push({ name: region, url: response.data.function.endpoint });
    } catch (error) {
      console.error(`Error deploying to ${region}:`, error);
    }
  }
  return { regions: results };
}

module.exports = { deployToDigitalOceanRegions };
