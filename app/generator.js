const randomInteger = require('./randomInteger');

const generateMessage = () => {
  const length = randomInteger(80, 100);
  const randomCharCodes = (len) => {
    const iter = (acc, i) => i === len ? acc : iter([...acc, randomInteger(32, 127)], i + 1);

    return iter([], 0);
  }

  return String.fromCharCode(...randomCharCodes(length));
}

const { promisify } = require('util');

const runGenerator = async (redis, timeout, maxCount, id, maxTTL) => {
  console.log(id, 'generator started!');
  const startTime = Date.now();
  const setnx = promisify(redis.setnx).bind(redis);
  await setnx('counter', 0);

  const sendMessage = (message) => new Promise((resolve, reject) => {
    redis
      .multi()
      .rpush('queue', message)
      .incr('counter')
      .pexpire('lock:generator', timeout * 2)
      .exec((err, [length, count, expire]) => {
        if (err) {
          reject(err);
        }
        resolve(count);
      });
  })

  const isTimeToKillMySelf = () => (Date.now() - startTime) >= maxTTL

  const iter = async () => {
    const message = generateMessage();
    const count = await sendMessage(message);
    console.log(id, count, 'pushed', message.length);
    if (count >= maxCount || isTimeToKillMySelf()) {
      redis.quit();

      return;
    }
    setTimeout(iter, timeout);
  }

  iter();
}

module.exports = (redis, timeout, maxCount, id=null, maxTTL=Number.POSITIVE_INFINITY) => {
  runGenerator(redis, timeout, maxCount, id, maxTTL);
}