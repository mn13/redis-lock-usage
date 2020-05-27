# redis-lock-usage
Only one generator and multiple listeneners at the time in the single app.

Messages are pushed to "errors" list with 5% probability. Run with ```getErrors``` arg to check and clear errors.

1. ```npm install``` (installs only [node-redis](https://github.com/NodeRedis/node-redis))
2. ```make redis``` for starting redis in docker OR provide ```REDIS_HOST``` and ```REDIS_PORT``` enviroments
3. ```npm start``` to start
4. ```npm start getErrors``` to get and clear "errors".

Build-in sample:
1. ```make redis```
2. ```node usage.js```
