import fetch from 'node-fetch';

/**
 * Fetches the public IP address from an external service.
 * @returns {Promise<string>} A promise that resolves to the public IP address.
 * @throws {Error} If there's an error fetching the IP address.
 */
async function getPublicIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching IP address:', error);
    throw error;
  }
}

/**
 * Handles the IP address request.
 * @returns {Promise<Object>} A promise that resolves to the response object.
 */
export const handleIPRequest = async () => {
  try {
    const startTime = Date.now();
    const ipAddress = await getPublicIP();
    const executionTime = Date.now() - startTime;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'IP Address Fetched Successfully',
        ipAddress: ipAddress,
        executionTime: executionTime,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error fetching IP address',
        error: error.message,
      }),
    };
  }
};
