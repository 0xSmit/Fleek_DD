const functions = require('@google-cloud/functions-framework');

function calculatePrimes(limit) {
  const primes = [];
  const isPrime = new Array(limit + 1).fill(true);
  isPrime[0] = isPrime[1] = false;

  for (let i = 2; i <= limit; i++) {
    if (isPrime[i]) {
      primes.push(i);
      for (let j = i * i; j <= limit; j += i) {
        isPrime[j] = false;
      }
    }
  }

  return primes;
}

functions.http('benchmarkFunction', (req, res) => {
  const startTime = Date.now();
  const PRIME_LIMIT = 10000000;
  const primes = calculatePrimes(PRIME_LIMIT);
  const executionTime = Date.now() - startTime;

  res.status(200).json({
    message: 'Hello from Serverless Function',
    primeCount: primes.length,
    lastPrime: primes[primes.length - 1],
    executionTime: executionTime,
  });
});
