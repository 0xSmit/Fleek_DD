const { runBenchmark } = require('./benchmark');
const { formatResults, appendToCsv } = require('./utils');
const services = require('./services');
const fs = require('fs');

/**
 * Runs benchmarks for all services and regions
 */
const runAllBenchmarks = async () => {
  // Create CSV header if file doesn't exist
  if (!fs.existsSync('benchmark_results.csv')) {
    const header =
      'Service,Region,Timestamp,Cold Start Time,Avg TTFB,Avg Total Time,Min Total Time,Max Total Time,P95 Total Time\n';
    fs.writeFileSync('benchmark_results.csv', header);
  }

  for (const [serviceName, service] of Object.entries(services)) {
    console.log(`\nRunning benchmarks for ${serviceName}...`);

    for (const region of service.regions) {
      console.log(`\nBenchmarking ${serviceName} in ${region.name}...`);
      const results = await runBenchmark(region.url, 20);
      console.log(`${serviceName} (${region.name}) Results:\n`, formatResults(results));
      appendToCsv(results, serviceName, region.name);
    }
  }

  console.log('\nAll benchmarks completed. Results have been appended to benchmark_results.csv');
};

// Run all benchmarks
runAllBenchmarks();
