'use strict';

const InputHandler = require('./input');
const AbstractGame = require('../../lib/AbstractGame');
const Ghost = require('./ClientPlayer');

function interpolate (p, n, interpolation) {
    interpolation = Math.max(0, Math.min(1, interpolation));

    return p + interpolation * (n - p);
}

function lerp (a, b, interpolation) {
    return {
        x: interpolate(a.x, b.x, interpolation),
        y: interpolate(a.y, b.y, interpolation)
    };
}

function ClientGame ({ options }) {
    const game = AbstractGame.create({ options });
    const serverGhosts = new Map();
    const localGhosts = new Map();
    const inputHandler = InputHandler();

    let network = null;
    let renderer = null;
    let localPlayer = null;
    let inputSeq = 0;
    let clientTime = 0;
    let serverTime = 0;

    const serverUpdates = [];
    const afterViewLoopHooks = {};

    function addAfterViewLoopHook (name, hook) {
        afterViewLoopHooks[name] = hook;
    }

    function removeAfterViewLoopHook (name) {
        if (afterViewLoopHooks[name]) {
            delete afterViewLoopHooks[name];
        }
    }

    function addPlayer (player) {
        game.addPlayer(player);

        const { x, y } = player.getPosition();
        const serverGhost = Ghost.create({ x, y, width: player.getWidth(), height: player.getHeight() });
        const localGhost = Ghost.create({ x, y, width: player.getWidth(), height: player.getHeight() });

        serverGhosts.set(player.getId(), serverGhost);
        localGhosts.set(player.getId(), localGhost);
    }

    function removePlayer (playerId) {
        localGhosts.delete(playerId);
        serverGhosts.delete(playerId);

        game.removePlayer(playerId);
    }

    function setLocalPlayer (player) {
        localPlayer = player;
    }

    function getServerTime () {
        return serverTime;
    }

    function getGhosts (playerId) {
        return {
            server: serverGhosts.get(playerId),
            local: localGhosts.get(playerId)
        };
    }

    function clearPlayers () {
        game.clearPlayers();

        serverGhosts.clear();
        localGhosts.clear();
    }

    function getLocalPlayer () {
        return localPlayer;
    }

    function setRenderer (value) {
        renderer = value;
    }

    function updateInput () {
        const input = inputHandler.getInput();

        if (input.length > 0 && localPlayer) {
            // Update what sequence we are on now
            inputSeq += 1;

            localPlayer.pushInput({
                inputs: input,
                time: game.getTime(),
                seq: inputSeq
            });

            if (network) {
                let data = '';

                data += input.join('-') + '.';
                data += game.getTime().toString().replace('.', '-') + '.';
                data += inputSeq;

                network.send(data);
            }
        }
    }

    function processPlayerUpdates (playerData, player) {
        player.setReloading(playerData.reloading);
        player.setFireing(playerData.fireing);
    }

    function processEventUpdates (data) {
        for (const eventData of data.events) {
            const player = game.getPlayerById(eventData.firedBy);

            game.onNetworkEvent({
                id: eventData.id,
                name: eventData.name
            }, player);
        }
    }

    function clientPrediction () {
        if (serverUpdates.length <= 0) {
            return;
        }

        // The most recent server update
        const latestServerUpdate = serverUpdates[serverUpdates.length - 1];

        // here we handle our local input prediction ,
        // by correcting it with the server and reconciling its differences
        const serverInputSeq = latestServerUpdate.ownPlayer.lastInputSeq;


        if (serverInputSeq) {
            let lastInputSeqIndex = -1;

            const localInputs = localPlayer.getInputs();

            for (let i = 0; i < localInputs.length; ++i) {
                if (localInputs[i].seq === serverInputSeq) {
                    lastInputSeqIndex = i;
                    break;
                }
            }

            // Now we can crop the list of any updates we have already processed
            if (lastInputSeqIndex !== -1) {
                // so we have now gotten an acknowledgement from the server that our inputs here have been accepted
                // and that we can predict from this known position instead

                // remove the rest of the inputs we have confirmed on the server
                const numberToClear = Math.abs(lastInputSeqIndex - (-1));

                localPlayer.clearInputs(numberToClear);

                // The localPlayer is now located at the new server position, authoritive server
                const { x, y } = latestServerUpdate.ownPlayer.position;

                localPlayer.setPosition(x, y);
                localPlayer.setLastInputSeq(lastInputSeqIndex);
            }

            // Update the debug server position block
            const serverGhost = serverGhosts.get(localPlayer.getId());

            const { x, y } = latestServerUpdate.ownPlayer.position;

            serverGhost.setPosition(x, y);
        }
    }

    function onServerUpdate (data) {
        serverTime = data.serverTime;

        // Update our local offset time from the last server update
        clientTime = serverTime - (options.networkOffset / 1000);

        // One approach is to set the position directly as the server tells you.
        // This is a common mistake and causes somewhat playable results on a local LAN, for example,
        // but causes terrible lag when any ping/latency is introduced. The player can not deduce any
        // information to interpolate with so it misses positions, and packet loss destroys this approach
        // even more so. See 'the bouncing ball problem' on Wikipedia.
        if (options.naiveApproach) {
            localPlayer.setPosition(data.ownPlayer.position.x, data.ownPlayer.position.y);

            for (const playerData of data.players) {
                const player = game.getPlayerById(playerData.id);

                player.setPosition(playerData.position.x, playerData.position.y);

                processPlayerUpdates(playerData, player);
            }

            processEventUpdates(data);
        } else {
            // Cache the data from the server,
            // and then play the timeline
            // back to the player with a small delay (networkOffset), allowing
            // interpolation between the points.
            serverUpdates.push(data);

            // we limit the buffer in seconds worth of updates
            // 60fps*buffer seconds = number of samples
            if (serverUpdates.length >= (game.getSimulationFps() * options.networkBufferSize)) {
                serverUpdates.splice(0, 1);
            }

            // Handle the latest positions from the server
            // and make sure to correct our local predictions, making the server have final say.
            if (localPlayer) {
                clientPrediction();

                const delta = options.simulationTimestep;

                // Now we reapply all the inputs that we have locally that
                // the server hasn't yet confirmed. This will 'keep' our position the same,
                // but also confirm the server position at the same time.
                game.update(delta);
            }
        }
    }

    function processNetworkUpdates (interpolation) {
        if (serverUpdates.length === 0) {
            return;
        }

        // First : Find the position in the updates, on the timeline
        // We call this clientTime, then we find the past_pos and the target_pos using this,
        // searching throught the server_updates array for clientTime in between 2 other times.
        let target = null;
        let previous = null;

        // We look from the 'oldest' updates, since the newest ones
        // are at the end (list.length-1 for example). This will be expensive
        // only when our time is not found on the timeline, since it will run all
        // samples. Usually this iterates very little before breaking out with a target.
        for (let i = 0; i < serverUpdates.length - 1; ++i) {
            const point = serverUpdates[i];
            const nextPoint = serverUpdates[i + 1];

            // Compare our point in time with the server times we have
            if (clientTime > point.serverTime && clientTime < nextPoint.serverTime) {
                target = nextPoint;
                previous = point;
                break;
            }
        }

        // With no target we store the last known
        // server position and move to that instead
        if (!target) {
            target = serverUpdates[0];
            previous = serverUpdates[0];
        }

        if (!target || !previous) {
            return;
        }

        // Now that we have a target and a previous destination,
        // We can interpolate between then based on 'how far in between' we are.
        // This is simple percentage maths, value/target = [0,1] range of numbers.
        // lerp requires the 0,1 value to lerp to thats the one.
        const difference = target.serverTime - clientTime;
        const maxDifference = target.serverTime - previous.serverTime;
        let timePoint = difference / maxDifference;

        // Because we use the same target and previous in extreme cases
        // It is possible to get incorrect values due to division by 0 difference and such.
        if (Number.isNaN(timePoint) || Math.abs(timePoint) === Number.POSITIVE_INFINITY) {
            timePoint = 0;
        }

        // The most recent server update
        const latestServerUpdate = serverUpdates[serverUpdates.length - 1];
        // console.table(serverUpdates.map(u => u.players[0] ? Object.assign({}, u, { x: u.players[0].position.x, y: u.players[0].position.y }) : null));

        for (let i = 0; i < latestServerUpdate.players.length; i++) {
            const serverData = latestServerUpdate.players[i];
            const ghosts = getGhosts(serverData.id);
            const player = game.getPlayerById(serverData.id);

            if (!player) {
                break;
            }

            // The other players positions in this timeline, behind us and in front of us
            if (target.players[i] && previous.players[i]) {
                const serverPosition = serverData.position;
                const targetPosition = target.players[i].position;
                const previousPosition = previous.players[i].position;

                // update the dest block, this is a simple lerp
                // to the target from the previous point in the server_updates buffer
                ghosts.server.setPosition(serverPosition.x, serverPosition.y);

                const destinationPosition = lerp(previousPosition, targetPosition, timePoint);

                ghosts.local.setPosition(destinationPosition.x, destinationPosition.y);

                if (options.clientSmoothing) {
                    const { x, y } = lerp(player.getPosition(), destinationPosition, interpolation);

                    player.setPosition(x, y);
                } else {
                    const { x, y } = destinationPosition;

                    player.setPosition(x, y);
                }

                processPlayerUpdates(target.players[i], player);
                processEventUpdates(target);
            }
        }

        // Now, if not predicting client movement , we will maintain the local player position
        // using the same method, smoothing the players information from the past.
        if (!options.clientPrediction && !options.naiveApproach) {
            const ghosts = getGhosts(localPlayer.getId());

            // Snap the ghost to the new server position
            ghosts.server.setPosition(latestServerUpdate.ownPlayer.position.x, latestServerUpdate.ownPlayer.position.y);

            const local_target = lerp(previous.ownPlayer.position, target.ownPlayer.position, timePoint);

            // Smoothly follow the destination position
            if (options.clientSmoothing) {
                const { x, y } = lerp(localPlayer.getPosition(), local_target, interpolation);

                localPlayer.setPosition(x, y);
            } else {
                localPlayer.setPosition(local_target.x, local_target.y);
            }

            processEventUpdates(latestServerUpdate);
        }
    }

    function setNetwork (value) {
        network = value;
    }

    function onUpdate (delta) {
        updateInput();

        if (options.clientPrediction && localPlayer) {
            localPlayer.update(delta);
        }
    }

    function onDraw (interpolation) {
        if (!options.naiveApproach && serverUpdates.length > 0) {
            // Network player just gets drawn normally, with interpolation from
            // the server updates, smoothing out the positions from the past.
            // Note that if we don't have prediction enabled - this will also
            // update the actual local client position on screen as well.
            processNetworkUpdates(interpolation);
        }

        renderer.draw(interpolation);

        for (const hookName of Object.keys(afterViewLoopHooks)) {
            afterViewLoopHooks[hookName]({
                time: game.getTime(),
                clientTime,
                serverTime,
                netLatency: network ? network.getNetLatency() : null,
                netPing: network ? network.getNetPing() : null
            });
        }
    }

    game.setUpdateHandler(onUpdate);
    game.setDrawHandler(onDraw);

    return Object.freeze(Object.assign({}, game, {
        getGhosts,
        getServerTime,
        clearPlayers,
        getLocalPlayer,
        addAfterViewLoopHook,
        removeAfterViewLoopHook,
        addPlayer,
        removePlayer,
        setNetwork,
        setLocalPlayer,
        onServerUpdate,
        setRenderer,
    }));
}

module.exports = { create: ClientGame };
