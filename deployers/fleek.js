const axios = require('axios');
const fs = require('fs');

async function deployToFleek(teamId, siteId, sourceCodePath) {
  try {
    const response = await axios.post(
      'https://api.fleek.co/v1/sites/deploy',
      {
        teamId,
        siteId,
        source: fs.readFileSync(sourceCodePath, 'utf8'),
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLEEK_API_KEY}`,
        },
      }
    );
    return { name: 'global', url: response.data.deployUrl };
  } catch (error) {
    console.error('Error deploying to Fleek:', error);
  }
}

module.exports = { deployToFleek };
