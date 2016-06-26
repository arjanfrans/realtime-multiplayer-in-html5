'use strict';

const SocketServer = require('socket.io');
const Lobby = require('./Lobby');

const serverConfig = require('./server-config');
const gameConfig = require('../lib/game-config');

const http = require('http');
const Client = require('./Client');
const debug = require('debug');
const log = debug('game:server/index');

function start () {
    const config = Object.assign({}, gameConfig, serverConfig);
    const server = http.createServer();

    server.listen(config.port);

    const io = SocketServer(server);
    const lobby = Lobby.create({ config });

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
