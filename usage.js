const cluster = require('cluster');

if(cluster.isMaster) {
  let i = 0;
  require('os').cpus().forEach(() => cluster.fork({ID: i++}));
} else {
  const app = require('./app');
  app();
}

