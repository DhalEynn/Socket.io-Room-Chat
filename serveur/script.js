const io = require('socket.io')(3000);
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0";

const redis = require('redis'),
redisClient = redis.createClient({
  port : 6379,
  host : '127.0.0.1',
});

//stats
let numUsers = 0;
let idRoom = 2;
let idUser = 1;

let users = [];
/*[{
          "id" : 1
          "username" : "michel",
          "myRooms" : [1, 2, 3, 4]

}]*/

// Executed only at startup
(async function() {
    const client = new MongoClient(url);
  
    try {
        await client.connect();
    
        const db = client.db("SocketIO_Users");
        const docs = await db.collection("Users").find({}).sort({user_id : 1}).toArray();
        await redisClient.flushdb();
        docs.forEach(doc => {
            let user =  {
                "id" : doc.user_id,
                "username" : doc.username,
                "myRooms" : []
            };
            users.push(user);
            idUser++;
            redisClient.hset('users', doc.username, "0", function (error, result) {
                if (error) {
                    console.log(error);
                    throw error;
                }
            });
        });

    } catch (err) {
      console.log(err.stack);
    }
    
    // Close connection
    client.close();
})();

redisClient.hkeys('users', function (err, users) {
    if (err) return console.log(err);
  
    users.forEach(function (user) {
        redisClient.hset("users", user,"0");
    });
});
console.log("Users added.")

let rooms = [{
    'id':1,
    'name':'test',
    'numUsers':0,
    'users':[]
}];
/*[{
    "id": 1,
    "name": "hello",
   "numUsers": 1,
    "users" : [1, 2, 3, 4],
}]*/

let messages = {'1':[]};
/*{
    "1": [{
         "message" : "hello",
         "user_id" : 1, //if 0 is server send message type
          }]
}*/

(async function() {
    const client = new MongoClient(url);
  
    try {
        await client.connect();
        console.log("Connected correctly to server");
    
        const db = client.db("SocketIO_Chat");
    
        // Get the collections
        const col = await db.listCollections().toArray();

        await col.forEach(element => {
            if (element.name != "test") {
                rooms.push({
                    'id' : idRoom,
                    'name' : element.name,
                    'numUsers' : 0,
                    'users' : []
                });
                messages[idRoom] = [];
                idRoom++;
            }
        });

        await rooms.forEach(async element => {
            // Get first two documents that match the query
            const docs = await db.collection(element.name).find({}).toArray();
            docs.forEach(doc => {
                let message =  {
                    'user_id': doc.user_id,
                    'username': doc.username,
                    'message': doc.message
                };
                messages[element.id].push(message);
            });
        });

        console.log("Rooms and messages added to server");

    } catch (err) {
      console.log(err.stack);
    }
    
    // Close connection
    client.close();
})();

function insertMessageInDB (message, roomName) {
    let document = {
        'user_id': message.user_id,
        'username': message.username,
        'message': message.message,
        'date': new Date(Date.now()).toISOString()
    }
    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
        var dbo = db.db("SocketIO_Chat");
        dbo.collection(roomName).insertOne(document, function(err, res) {
            if (err) throw err;
            db.close();
        });
    });
}

function addUsers (users) {
    let document = {
        'user_id': users.id,
        'username': users.username
    }
    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
        var dbo = db.db("SocketIO_Users");
        dbo.collection("Users").updateOne({username : users.username}, {$set : document}, {upsert : true}, function(err, res) {
            if (err) throw err;
            db.close();
        });
    });
}

function getUserId(user_name) {
    for (let i = 0; i < users.length; i++) {
        element = users[i];
        if (element.username == user_name) {
            return element.id;
        }
    }
    return -1;
};

function getUsername(user_id) {
    for (let i = 0; i < users.length; i++) {
        element = users[i];
        if (element.id == user_id) {
            return element.username;
        }
    }
    return "";
};

function cleanAllChats () {
    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
        var dbo = db.db("SocketIO_Chat");
        dbo.dropDatabase(function(err, res) {
            if (err) throw err;
            db.close();
        });
    });
}

function cleanOneChat (roomName) {
    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
        var dbo = db.db("SocketIO_Chat");
        dbo.collection(roomName).drop(function(err, res) {
            if (err) throw err;
            db.close();
        });
    });
}

const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

//cleanAllChats();

console.log("Script started up !");

io.on('connection', socket => {

    socket.on('add user', username => {
        console.log('connection ' + username);

        redisClient.hexists('users', username, function(err, reply) {
            if (reply === 1) {
                redisClient.hget('users', username, async function (error, result) {
                    if (error) {
                        console.log(error);
                        throw error;
                    }

                    if (result != "0") {
                        console.log(username + ' is already connected.');
                    }

                    else {
                        console.log(username + " is logging in");
                        redisClient.hset('users', username, "1", function (error, result) {
                            if (error) {
                                console.log(error);
                                throw error;
                            }
                        });
                        socket.user_id = getUserId(username);
                        numUsers++;

                        io.sockets.emit('update users', users);//emit to all people
                        socket.emit('update rooms', rooms);//emit only for client
                        socket.emit('login', socket.user_id);
                    }
                });
            } 
            else {
                console.log('Added ' + username + ' to user list.');
                redisClient.hset('users', username, "1", function (error, result) {
                    if (error) {
                        console.log(error);
                        throw error;
                    }
                    socket.user_id = idUser;
                    users.push({
                        id: idUser,
                        username: username,
                        myRooms: []
                    });
                    addUsers(users[idUser - 1]);
                    idUser++;
                    numUsers++;

                    io.sockets.emit('update users', users);//emit to all people
                    socket.emit('update rooms', rooms);//emit only for client
                    socket.emit('login', socket.user_id);
                });
            }
        });
    });

    socket.on('add room', roomName => {
        let room = {
            id: idRoom,
            name:roomName,
            numUsers: 0,
            users: []
        };

        rooms.push(room);
        io.sockets.emit('update rooms', rooms);//emit to all people

        messages[idRoom] = [];
        idRoom++;

        socket.emit('room created', room);//emit only to client
    });

    socket.on('connect room', room => {
        socket.join(room.id);
        let message = {
            'user_id':0,
            'message': users.find(x => x.id === socket.user_id).username + ' join the room ' + room.name
        };
        socket.broadcast.in(room.id).emit('new message', message);
        messages[room.id].push(message);

        rooms.find(x => x.id === room.id).users.push(socket.user_id);
        rooms.find(x => x.id === room.id).numUsers++;
        io.sockets.emit('update rooms', rooms);//emit to all people

        users.find(x => x.id === socket.user_id).myRooms.push(room.id);
        io.sockets.emit('update users', users);//emit to all people

        socket.emit('go room',
            {
                room,
                messages:messages[room.id]
            });//emit only to client
    });

    socket.on('join room', room => {
        let message = {
            'user_id':0,
            'message': users.find(x => x.id === socket.user_id).username + ' join the room ' + room.name
        };
        socket.broadcast.in(room.id).emit('new message', message);
        messages[room.id].push(message);
        rooms.find(x => x.id === room.id).numUsers++;

        io.sockets.emit('update rooms', rooms);//emit to all people

        socket.emit('go room',
            {
                room,
                messages:messages[room.id]
            });//emit only to client
    });

    socket.on('leave room', room => {
        let message =  {
            'user_id'   :   0,
            'username'  :   'server',
            'message'   :   users.find(x => x.id === socket.user_id).username + ' leave the room ' + room.name
        };
        socket.broadcast.in(room.id).emit('new message', message);
        messages[room.id].push(message);
        rooms.find(x => x.id === room.id).numUsers = (rooms.find(x => x.id === room.id).numUsers === 0) ? 0 : rooms.find(x => x.id === room.id).numUsers - 1;
        io.sockets.emit('update rooms', rooms);//emit to all people
        socket.emit('go leave room');
    });

    socket.on('quit room', room => {
        socket.leave(room.id);
        let message =  {
            'user_id'   :   0,
            'username'  :   'server',
            'message'   :   users.find(x => x.id === socket.user_id).username + ' quit the room ' + room.name
        };
        socket.broadcast.in(room.id).emit('new message', message);

        let myRooms = users.find(x => x.id === socket.user_id).myRooms;
        myRooms = myRooms.filter(item => item !== room.id);
        users.find(x => x.id === socket.user_id).myRooms = myRooms;
        io.sockets.emit('update users', users);//emit to all people

        let idUsers = rooms.find(x => x.id === room.id).users;
        idUsers = idUsers.filter(item => item !== socket.user_id);
        rooms.find(x => x.id === room.id).users = idUsers;
        io.sockets.emit('update rooms', rooms);//emit to all people

        socket.emit('go quit room');
    });

    socket.on('send message', data => {
        let message =  {
            'user_id': socket.user_id,
            'username': users.find(x => x.id === socket.user_id).username,
            'message': data.message
        };
        insertMessageInDB(message, data.room.name);
        messages[data.room.id].push(message);
        socket.nsp.to(data.room.id).emit('new message', message);
    });

    socket.on('start typing', roomId => {
        socket.broadcast.to(roomId).emit('new typing', socket.user_id);
    });

    socket.on('stop typing', roomId => {
        socket.broadcast.to(roomId).emit('end typing', socket.user_id);
    });

    socket.on('need update rooms', () => {
        socket.emit('update rooms', rooms);
    });

    socket.on('need update users', () => {
        socket.emit('update users', users);
    });

    socket.on('update user list', () => {
        redisClient.hkeys('users', async function (err, result) {
            if (err) return console.log(err);
            online_users = [];
            offline_users = [];
            let promises = [];

            for (let username of result) {
                let promise = new Promise((resolve, reject) => { 
                    redisClient.hget('users', username, function (error, result) {
                        if (error) {
                            console.log(error);
                            throw error;
                        }
                        if (result == "1") {
                            // console.log("Ajout online");
                            online_users.push(username);
                        }
                        else {
                            // console.log("Ajout offline");
                            offline_users.push(username);
                        }
                        resolve("1");
                    });
                });
                promises.push(promise);
            }
            Promise.all(promises).then(function(values) {
                // console.log(values);
                // console.log(online_users);
                // console.log(offline_users);
                // console.log("fin");
                socket.emit('updated list of user', online_users, offline_users);
            })
        });
    });

    // when the user disconnects.. perform this
    socket.on('shutdown', user_id => {
        redisClient.hset('users', getUsername(user_id), "0", function (error, result) {
            if (error) {
                console.log(error);
                throw error;
            }
        });
    }); 

    socket.on('disconnect', () => {
        console.log('logout');
        numUsers--;
    });
});

function maFonctionAsynchrone(username) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url);
      xhr.onload = () => resolve(xhr.responseText);
      xhr.onerror = () => reject(xhr.statusText);
      xhr.send();
    });
  }