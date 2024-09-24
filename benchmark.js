const axios = require('axios');
const { performance } = require('perf_hooks');

/**
 * Runs a benchmark for a given URL
 * @param {string} url - The URL to benchmark
 * @param {number} numRequests - Number of requests to make (default: 10)
 * @returns {Promise<Object>} Benchmark results
 */
const runBenchmark = async (url, numRequests = 10) => {
  const ttfbTimes = [];
  const totalTimes = [];
  let coldStartTime;

  for (let i = 0; i < numRequests; i++) {
    const start = performance.now();
    try {
      const response = await axios.get(url);
      const end = performance.now();

      const ttfb = response.headers['x-request-start']
        ? Number(response.headers['x-request-start']) - start
        : end - start; // Fallback if x-request-start is not available

      const totalTime = end - start;

      ttfbTimes.push(ttfb);
      totalTimes.push(totalTime);

      if (i === 0) {
        coldStartTime = totalTime;
      }
    } catch (error) {
      console.error(`Request ${i + 1} failed:`, error.message);
    }
  }

  const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const percentile = (arr, p) => {
    const sorted = arr.slice().sort((a, b) => a - b);
    const pos = (sorted.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  };

  return {
    coldStartTime,
    avgTtfb: average(ttfbTimes),
    avgTotalTime: average(totalTimes),
    minTotalTime: Math.min(...totalTimes),
    maxTotalTime: Math.max(...totalTimes),
    p95TotalTime: percentile(totalTimes, 0.95),
  };
};

module.exports = { runBenchmark };
