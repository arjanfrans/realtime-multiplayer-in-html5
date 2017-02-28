'use strict';

const SocketServer = require('socket.io');
const Client = require('./Client');
const Lobby = require('./Lobby');
const ServerGame = require('./ServerGame');
const AbstractGame = require('../lib/AbstractGame');
const config = require('./server-config');
const gameConfig = require('../lib/game-config');
const http = require('http');
const debug = require('debug');
const log = debug('game:server/index');

function start () {
    const server = http.createServer();
    const io = SocketServer(server);

    server.listen(config.port);

    const lobby = Lobby.create(function (/* client */) {
        return ServerGame.create(AbstractGame, {
            options: gameConfig,
            networkTimestep: config.networkTimestep
        });
    });

    log('Listening on port ' + config.port);

    io.sockets.on('connection', function (socket) {
        socket.on('register', (data) => {
            const client = Client.create({
                name: data.name,
                socket
            });

            lobby.addClient(client);
        });

        socket.on('error', (err) => {
            log('Client error', err);
        });
    });
}

start();
