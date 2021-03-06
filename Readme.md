## Raspberry

### Installation for dev

Clone the repo

```
git clone https://github.com/evaneos/raspberry.git
```

Create data.json

```
{"room1":{"name":"TV room 1","mac":"adresse Mac...","url":""}}}
```

Create web/config.js

```
module.exports = {
    basicauth: {
        username: 'user',
        password: 'pass',
    },

    cookieSecret: 'secret key',
};
```


Install dependencies

```
cd web
npm install
cd ..
cd server
npm install
```

Watch web and run webserver

```
make watch
```

Watch TCP server

```
make clean build watch
```

Run TCP server

```
npm start
```


Watch client

```
make watch
```

Run client

```
npm start
```

### Installation for production

#### Server

Clone the repo

```
git clone https://github.com/evaneos/raspberry.git
```

Create data.json

```
{"room1":{"name":"TV room 1","mac":"adresse Mac...","url":""}}}
```

Create web/config.js

```
module.exports = {
    basicauth: {
        username: 'user',
        password: 'pass',
    },

    cookieSecret: 'secret key',
};
```

Create supervisor config file

```
[program:node-raspberry-web]
command=node --harmony /home/raspberry/prod/current/web/lib/index.js --production --port=3000 --webSocketPort=3001 --socketWebserver=/tmp/socketWebserver.socket
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/raspberry/prod/logs/web.log
user=evaneos

[program:node-raspberry-tcp-server]
command=node --harmony /home/raspberry/prod/current/server/lib/index.js --production --port=3002 --socketWebserver=/tmp/socketWebserver.socket
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/raspberry/prod/logs/tcp-server.log
user=evaneos

[group:raspberry]
programs=node-raspberry-web,node-raspberry-tcp-server
```

Install dependencies

```
cd web
npm install
./node_modules/.bin/jspm install
cd ..
cd server
npm install --production
```

Build web

```
make build
```

Start the servers

```
sudo supervisorctl reread && sudo supervisorctl reload
```

#### Client on a raspberry

Clone the repo

```
git clone https://github.com/evaneos/raspberry.git
```

Create supervisor config file

```
[program:node-raspberry-client]
command=node --harmony .../client/lib/index.js --port=3002 --host=myhostname
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=..../logs/client.log
user=evaneos
```

Install dependencies

```
cd client
npm install --production
```

Start the client

```
sudo supervisorctl reread && sudo supervisorctl reload
```
