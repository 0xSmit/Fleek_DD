exports.handler = async (event, context) => {
  const startTime = Date.now();

  // Perform heavy computation
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    for (let j = 0; j < 100; j++) {
      result += Math.pow(i, j % 5) / (j + 1);
    }
  }

  // Simulate some memory-intensive work
  let largeArray = new Array(1000000).fill(0).map(() => Math.random());
  largeArray.sort((a, b) => a - b);

  // Perform some string operations
  let longString = 'a'.repeat(1000000);
  longString = longString.split('').reverse().join('');

  console.log('Hey');

  const endTime = Date.now();
  const executionTime = endTime - startTime;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from AWS Lambda!',
      result: result,
      arraySum: largeArray.reduce((sum, num) => sum + num, 0),
      stringLength: longString.length,
      startTime: startTime,
      endTime: endTime,
      executionTime: executionTime,
    }),
  };
};
