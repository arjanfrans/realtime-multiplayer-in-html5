'use strict';

const Timer = require('../lib/Timer');
const GameNetwork = require('./Network');
const Player = require('./ServerPlayer');

function ServerGame (Game, { options, networkTimestep }) {
    const game = Game.create({ options: JSON.parse(JSON.stringify(options)) });
    const network = GameNetwork();
    const networkLoop = Timer.create({
        interval: networkTimestep,
        onUpdate () {
            network.sendUpdates(game.getStateForPlayer);

            game.clearEvents();
        }
    });

    function getNetwork () {
        return network;
    }

    function createPlayer (client) {
        const { x, y } = options.playerPositions[0];
        const player = Player.create({
            name: client.getName()
        });

        player.setPosition(x, y);

        game.addPlayer(player);

        return player;
    }

    function start () {
        networkLoop.start();

        game.start();
    }

    function stop () {
        networkLoop.stop();

        game.stop();
    }

    function onUpdate (delta) {
        for (const player of game.getPlayers()) {
            player.update(delta);
        }
    }

    game.setUpdateHandler(onUpdate);

    return Object.freeze(Object.assign({}, game, {
        createPlayer,
        getNetwork,
        start,
        stop
    }));
}

module.exports = { create: ServerGame };
