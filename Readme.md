## Rasberry

### Installation

#### Server

Clone the repo

```
git clone https://github.com/christophehurpeau/rasberry.git
```

Create data.json

```
{"room1":{"name":"TV room 1","mac":"adresse Mac...","url":""}}}
```

Create web/config.json

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
[program:node-rasberry-web]
command=node --harmony /home/rasberry/prod/current/web/lib/index.js --production --port=3000 --webSocketPort=3001 --socketWebserver=/tmp/socketWebserver.socket
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/rasberry/prod/logs/web.log
user=evaneos

[program:node-rasberry-tcp-server]
command=node --harmony /home/rasberry/prod/current/server/lib/index.js --production --port=3002 --socketWebserver=/tmp/socketWebserver.socket
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/rasberry/prod/logs/tcp-server.log
user=evaneos

[group:rasberry]
programs=node-rasberry-web,node-rasberry-tcp-server
```

Install dependencies

```
cd web
npm install
cd ..
cd server
npm install
```

Start the servers

```
sudo supervisorctl reread && sudo supervisorctl reload
```

#### Client on a rasberry

Clone the repo

```
git clone https://github.com/christophehurpeau/rasberry.git
```

Create supervisor config file

```
[program:node-rasberry-client]
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
npm install
```

Start the client

```
sudo supervisorctl reread && sudo supervisorctl reload
```
