const fs = require('fs');

/**
 * Formats benchmark results for console output
 * @param {Object} results - Benchmark results
 * @returns {string} Formatted results
 */
const formatResults = (results) => {
  return Object.entries(results)
    .map(([key, value]) => `${key}: ${value.toFixed(6)} ms`)
    .join('\n');
};

/**
 * Appends benchmark results to a CSV file
 * @param {Object} results - Benchmark results
 * @param {string} service - Service name
 * @param {string} region - Region name
 */
const appendToCsv = (results, service, region) => {
  const timestamp = new Date().toISOString();
  const data = `${service},${region},${timestamp},${Object.values(results).join(',')}\n`;
  fs.appendFileSync('benchmark_results.csv', data);
};

module.exports = { formatResults, appendToCsv };
