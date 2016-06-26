'use strict';

const ServerGame = require('./ServerGame');
const Room = require('./Room');

const debug = require('debug');
const log = debug('game:server/server');

function Lobby ({ config }) {
    const rooms = new Map();
    const clients = new Map();

    function startGame (room) {
        room.startGame();
    }

    function createGame (client) {
        const room = Room.create({
            owner: client,
            game: ServerGame.create({ options: config })
        });

        rooms.set(room.getId(), room);
        client.setCurrentRoom(room);

        client.emit('onJoinedRoom', { room: room.toJSON() });

        startGame(room);

        log('player ' + client.getId() + ' created a room with id ' + room.getId());

        for (const lobbyClient of clients.values()) {
            lobbyClient.emit('roomCreated', { room: room.toJSON() });
        }
    }

    // we are requesting to kill a game in progress.
    function endGame (roomId) {
        const room = rooms.get(roomId);

        if (room) {
            // stop the game updates immediate
            room.endGame();

            for (const lobbyClient of clients.values()) {
                lobbyClient.emit('roomDeleted', { roomId });
                lobbyClient.send('s.e');
            }

            rooms.delete(roomId);

            log('game removed. there are now ' + rooms.size + ' rooms');
        } else {
            log('that game was not found!');
        }
    }

    function listenToClient (client) {
        client.on('clientPing', (data) => {
            client.emit('serverPing', data);
        });

        client.emit('onConnected', {
            user: client.toJSON(),
            rooms: Array.from(rooms.values()).map(room => {
                return room.toJSON();
            })
        });

        client.on('joinRoom', (data) => {
            const room = rooms.get(data.roomId);

            if (room && !client.isInRoom()) {
                room.join(client);
                client.setCurrentRoom(room);

                client.emit('onJoinedRoom', { room: room.toJSON() });

                log('client joined room');
            }
        });

        client.on('leaveRoom', (data) => {
            const room = rooms.get(data.roomId);

            if (room) {
                room.leave(client);
                client.setCurrentRoom(null);

                if (room.getSize() === 0) {
                    endGame(room.getId());
                }

                client.emit('onLeftRoom', { room: room.toJSON() });
            }
        });

        client.on('createRoom', () => {
            createGame(client);
        });

        log('\t socket.io:: player ' + client.getId() + ' connected');

        client.on('message', (message) => {
            const parts = message.split('.');

            const inputCommands = parts[0].split('-');
            const inputTime = parts[1].replace('-', '.');
            const inputSeq = parts[2];

            const room = client.getCurrentRoom();

            if (room && room.isGameStarted()) {
                room.receiveClientInput(client, inputCommands, inputTime, inputSeq);
            } else {
                log('no room to receive input');
            }
        });

        client.on('disconnect', function () {
            log('\t socket.io:: client disconnected ' + client.getId());

            const room = client.getCurrentRoom();

            if (room) {
                if (room.size === 1) {
                    endGame(room.getId());
                }

                client.emit('onLeftRoom', { room: room.toJSON() });

                room.leave(client);
                client.setCurrentRoom(null);
            }

            clients.delete(client.getId());
        });
    }

    function addClient (client) {
        clients.set(client.getId(), client);

        listenToClient(client);
    }

    function removeClient (clientId) {
        clients.delete(clientId);
    }

    return {
        addClient,
        removeClient
    };
}

module.exports = { create: Lobby };
