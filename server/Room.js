'use strict';

const uuid = require('node-uuid');
const debug = require('debug');
const log = debug('game:server/Room');

function Room ({ owner, game }) {
    const id = uuid.v4();
    const clients = new Set();

    function getId () {
        return id;
    }

    function getOwner () {
        return owner;
    }

    function getSize () {
        return clients.size;
    }

    function isGameStarted () {
        return game.isStarted();
    }

    function send (message) {
        for (const client of clients) {
            client.send(message);
        }
    }

    function emit (event, data) {
        for (const client of clients) {
            client.emit(event, data);
        }
    }

    function receiveClientInput (...args) {
        game.getNetwork().receiveClientInput(...args);
    }

    function join (client) {
        clients.add(client);

        if (game.isStarted()) {
            const player = game.createPlayer(client);

            game.getNetwork().addClientPlayer(client, player);

            log('joining game');

            client.emit('startGame', game.getStateForPlayer(player));

            for (const roomClient of clients) {
                if (roomClient !== client) {
                    roomClient.emit('playerJoined', player.toJSON());
                }
            }
        }
    }

    function leave (client) {
        if (game.isStarted) {
            const player = game.getNetwork().getPlayerByClient(client);

            for (const roomClient of clients) {
                if (roomClient !== client) {
                    roomClient.emit('playerLeft', player.getId());
                }
            }

            game.removePlayer(player.getId());
            game.getNetwork().removeClientPlayer(client);
        }

        clients.delete(client);
    }

    function startGame () {
        for (const client of clients) {
            game.getNetwork().addClientPlayer(client, game.createPlayer(client));
        }

        for (const client of clients) {
            const player = game.getNetwork().getPlayerByClient(client);

            client.emit('startGame', game.getStateForPlayer(player));
        }

        log('game started');

        game.start();
    }

    function endGame () {
        if (game) {
            game.stop();
        }

        clients.clear();
    }

    function toJSON () {
        return {
            id,
            clients: Array.from(clients).map(client => {
                return {
                    id: client.getId(),
                    name: client.getName()
                };
            })
        };
    }

    join(owner);

    return Object.freeze({
        getId,
        getOwner,
        getSize,
        isGameStarted,
        send,
        emit,
        receiveClientInput,
        join,
        leave,
        startGame,
        endGame,
        toJSON
    });
}

module.exports = { create: Room };
