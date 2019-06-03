var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});


var allPlayer = [];
var rooms = [{NAME: "ROOM1", PLAYERS: 0, STATUS: "JOINABLE"},
    {NAME: "ROOM2", PLAYERS: 0, STATUS: "JOINABLE"},
    {NAME: "ROOM3", PLAYERS: 3, STATUS: "JOINABLE"},
    {NAME: "ROOM4", PLAYERS: 4, STATUS: "FULL"}];

io.on('connection', function (socket) {
    socket.on('Iam', function (msg) {
        var player = {ID: socket.id, NAME: msg, ROOM: null};
        allPlayer.push(player);
        socket.emit("HI", "Hallo: " + msg + " du hast die ID: " + socket.id);
        socket.emit("DaR00ms", rooms);
    });

    socket.on('JOIN', function (msg) {
        var ro = 0;
        switch (msg) {
            case "ROOM1":
                ro = 0;
                break;
            case "ROOM2":
                ro = 1;
                break;
            case "ROOM3":
                ro = 2;
                break;
            case "ROOM4":
                ro = 3;
                break;
        }
        if (rooms[ro]['PLAYERS'] < 4) {
            Object.keys(allPlayer).forEach(key => {
                if (allPlayer[key]['ID'] === socket.id) {
                    if (allPlayer[key]['ROOM'] !== null) {
                        socket.emit("ERROR", "You are already in a Room!");
                    } else {
                        allPlayer[key]['ROOM'] = "ROOM" + (ro + 1);
                        socket.join("ROOM" + (ro + 1));
                        rooms[ro]['PLAYERS'] += 1;
                        socket.emit("JOINED", "JOINED ROOM" + (ro + 1));
                        if (rooms[ro]['PLAYERS'] > 1) {
                            io.in("ROOM" + (ro + 1)).emit('StartButton', "YES");
                        }
                        if (rooms[ro]['PLAYERS'] === 4) {
                            rooms[ro]['STATUS'] = "FULL";
                        }
                        var players = [];
                        Object.keys(allPlayer).forEach(key => {
                            if (allPlayer[key]['ROOM'] === "ROOM" + (ro + 1)) {
                                players.push(allPlayer[key]);
                            }
                        });
                        socket.to("ROOM" + (ro + 1)).emit('AddPlayer', allPlayer);
                        socket.broadcast.emit("DaR00ms", rooms);
                    }
                }
            });
        } else {
            socket.emit("ERROR", "ROOM" + (ro + 1) + " is currently Full!");
        }
    });
});


module.exports = app;
