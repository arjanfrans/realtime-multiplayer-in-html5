'use strict';

const HitEvent = require('./events/HitEvent');

function BulletSystem ({ eventSystem }) {
    const players = new Map();
    const bullets = new Map();

    function onHit (bullet, player) {
        player.damage();

        // It's possible that the client does not have a bullet anymore.
        if (bullet) {
            bullet.kill();
        }
    }

    function onHitEvent (eventData) {
        const bullet = bullets.get(eventData.bullet);
        const player = players.get(eventData.playerHit);

        // Hit the player only once
        if (!player.isHit()) {
            eventSystem.dispatch(HitEvent.create({
                id: eventData.id,
                bullet,
                duration: 1000,
                playerHit: player,
                onDispatch: () => {
                    onHit(bullet, player);
                },
                onDone: () => {
                    player.setHit(false);
                }
            }));
        }
    }

    function addBullet (bullet) {
        bullets.set(bullet.getId(), bullet);
    }

    function removeBullet (bullet) {
        bullets.delete(bullet.getId());
    }

    function addPlayer (player) {
        players.set(player.getId(), player);
    }

    function removePlayer (player) {
        players.delete(player.getId());
    }

    function getBullets () {
        return Array.from(bullets.values());
    }

    function clear () {
        for (const bullet of bullets.values()) {
            if (bullet.isDead()) {
                removeBullet(bullet);
            }
        }
    }

    function update () {
        for (const player of players.values()) {
            for (const bullet of bullets.values()) {
                if (bullet.getFiredBy() !== player) {
                    const width = player.getWidth();
                    const height = player.getHeight();

                    const bulletPosition = bullet.getPosition();
                    const { x, y } = player.getPosition();
                    const positionLimits = {
                        xMin: x - (width / 2),
                        xMax: x + (width / 2),
                        yMin: y - (height / 2),
                        yMax: y + (height / 2)
                    };

                    if (bulletPosition.x >= positionLimits.xMin
                        && bulletPosition.x <= positionLimits.xMax
                        && bulletPosition.y >= positionLimits.yMin
                        && bulletPosition.y <= positionLimits.yMax) {
                        onHitEvent({
                            bullet: bullet.getId(),
                            playerHit: player.getId()
                        });
                    }
                }
            }
        }
    }

    return Object.freeze({
        update,
        onHitEvent,
        clear,
        getBullets,
        addBullet,
        removeBullet,
        addPlayer,
        removePlayer
    });
}

module.exports = { create: BulletSystem };
