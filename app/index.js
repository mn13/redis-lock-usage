const app = async (timeout=100, maxCount=250000) => {
  const isGetErrors = process.argv.slice(2).includes('getErrors');
  const { ID, REDIS_HOST, REDIS_PORT } = process.env;
  const redis = require('redis').createClient(REDIS_PORT || 6379, REDIS_HOST || '127.0.0.1');

  if (isGetErrors) {
    const getErrors = () => new Promise((resolve, reject) => {
      redis
        .multi()
        .lrange('errors', 0, -1)
        .del('errors')
        .exec((err, replies) => {
          if (err) {
            reject(err);
          }
          resolve(replies && replies[0] || []);
        });
    })
    
    const errors = await getErrors();

    errors.forEach(console.log);

    redis.quit();

    return;
  }

  const { promisify } = require('util');

  const set = promisify(redis.set).bind(redis);
  const setLockReply = await set('lock:generator', '1', 'PX', timeout * 2, 'NX');
  const isGenerator = setLockReply === 'OK';
  const runGenerator = require('./generator');

  if (isGenerator) {
    runGenerator(redis, timeout, maxCount, ID);
  } else {
    const runListener = require('./listener');
    const changeRole = await runListener(redis, timeout, ID);
    changeRole && runGenerator(redis, timeout, maxCount, ID);
  }
}

if(require.main === module) {
  app();
} else {
  module.exports = app;
}
