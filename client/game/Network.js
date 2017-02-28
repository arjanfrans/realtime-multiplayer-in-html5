'use strict';

const Player = require('./ClientPlayer');
const NetworkPackets = require('../../lib/NetworkPackets');

function Network ({ game, socket, pingTimeout }) {
    const networkPackets = NetworkPackets.create();
    let previousPing = 0;
    let netPing = 0;
    let netLatency = 0;

    function onPlayerJoined (playerData) {
        const player = Player.create({
            id: playerData.id,
            name: playerData.name,
            x: playerData.position.x,
            y: playerData.position.y
        });

        game.addPlayer(player);
    }

    function onPlayerLeft (playerId) {
        game.removePlayer(playerId);
        console.log('player left with id', playerId);
    }

    function onDisconnect () {
        for (const player of game.getPlayers()) {
            if (player !== game.getLocalPlayer()) {
                game.removePlayer(player.getId());
            }
        }

        game.stop();
    }

    function onStartGame (data) {
        const serverTime = data.serverTime;

        game.setTime(serverTime + netLatency);

        console.log('server time is about ' + game.getServerTime());

        game.clearPlayers();

        for (const playerData of data.players) {
            onPlayerJoined(playerData);
        }

        const localPlayer = Player.create({
            id: data.ownPlayer.id,
            name: data.ownPlayer.name,
            x: data.ownPlayer.position.x,
            y: data.ownPlayer.position.y
        });

        game.addPlayer(localPlayer);
        game.setLocalPlayer(localPlayer);
    }

    function getNetLatency () {
        return netLatency;
    }

    function getNetPing () {
        return netPing;
    }

    function send (data) {
        socket.send(data);
    }

    function onServerUpdate (diff) {
        const data = networkPackets.unpack(diff);

        game.receiveNetworkUpdates(data);
    }

    /**
     * Ping the server.
     */
    const pingInterval = setInterval(() => {
        previousPing = new Date().getTime();
        socket.emit('clientPing', previousPing);
    }, pingTimeout);

    socket.on('disconnect', () => {
        clearInterval(pingInterval);
    });

    socket.on('serverPing', (data) => {
        netPing = new Date().getTime() - data;
        netLatency = netPing / 2;
    });

    socket.on('playerJoined', onPlayerJoined);
    socket.on('playerLeft', onPlayerLeft);
    socket.on('onLeftRoom', onDisconnect);
    socket.on('onServerUpdate', onServerUpdate);

    socket.on('startGame', onStartGame);
    socket.on('error', onDisconnect);

    return Object.freeze({
        getNetLatency,
        getNetPing,
        send
    });
}

module.exports = { create: Network };
