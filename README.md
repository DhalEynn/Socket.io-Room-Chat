# Socket.io-Room-Chat

Made to "Projet Tuteuré" in LP IRM.

Ionic App Chat app with rooms work thanks to websocket server in Node JS and Socket.io.


## How to use it

### Server

1. Do the `npm i` command to install project dependencies.
2. Launch websocket server with `npm run start` command.
3. The server will be available to localhost:3000 (yourip:3000)

### Ionic Application

1. Do the `npm i` to install project dependencies.
2. Use `ionic serve --lab` to test magic of websocket
3. Modify the socket adress server in SocketIoConfig in [client/src/app/app.module.ts](client/src/app/app.module.ts) file
3. And use `ionic cordova run android` or `ionic cordova run ios` to test on your mobile.

### Redis (using Docker)

1. Install Docker on your computer.
2. Start Docker.
3. In a shell in the "TP_Final" folder, use `docker-compose up -d`.
4. When finished, use then `docker-compose down`.

### Mongo Database

1. Create a folder "data" somewhere with the folders "db0", "db1", "db2" and "arbitre" inside.
2. Use `mongod --port 27017 --replSet rs0 --dbpath "*Your path*\data\db0"` to create the primary
3. Open a shell [we shall name it client for this] and use `mongo --port 27017`, then use `rs.initiate()`
4. Use in other shells `mongod --port 27018 --replSet rs0 --dbpath "*Your path*\data\db1"` and `mongod --port 27019 --replSet rs0 --dbpath "*Your path*\data\db2"`
5. In 'client', use then `rs.add("localhost:27018")` and `rs.add("localhost:27019")`
6. In a fifth shell, use `mongod --port 27020 --replSet rs0 --dbpath "*Your path*\data\arbitre"`
7. In 'client', use `rs.addArb("localhost:27020")`
* To connect to see the database (via software like MongoDB Compass), use `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`

## Librairies

* Ionic
* NodeJS
* Socket.io
* ng-socket-io
* mongodb
* redis


