const randomInteger = require('./randomInteger');

module.exports = async (redis, timeout, id=null) => {
  console.log(id, 'listener started!');
  const { promisify } = require('util');
  const blpop = promisify(redis.blpop).bind(redis);
  const rpush = promisify(redis.rpush).bind(redis);
  const set = promisify(redis.set).bind(redis);
  let listen = true;

  while(listen) {
    const blpopReply = await blpop('queue', Math.ceil((timeout * 2) / 1000));
    const message = blpopReply && blpopReply[1];
    if (message) {
      const rand = randomInteger(0, 100);
      if(rand < 6) {
        rpush('errors', message);
        console.log(id, 'pushed to error!', message.length)
      } else {
        // process message
      }
    }
    const setLockReply = await set('lock:generator', '1', 'PX', timeout * 2, 'NX');
    const iAmGenerator = setLockReply === 'OK';
    if (iAmGenerator) {
      listen = false;
    }
  }
  console.log(id, 'stop listen and start generate');

  return true;
}
