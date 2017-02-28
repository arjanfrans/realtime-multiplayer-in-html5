'use strict';

const uuid = require('uuid');

function BulletEvent ({ id, firedBy, bullet, onDispatch, onDone }) {
    id = id || uuid.v4();
    const name = 'bulletEvent';
    let isDispatched = false;
    let done = false;

    function reset () {
        done = false;
        isDispatched = false;
    }

    function update (delta) {
        if (bullet.isDead() && !done) {
            done = true;

            if (typeof onDone === 'function') {
                onDone();
            }
        } else if (!done) {
            bullet.update(delta);
        }
    }

    function dispatch (event) {
        if (!isDispatched) {
            onDispatch(event);
        }
    }

    function getId () {
        return id;
    }

    function getFiredBy () {
        return firedBy;
    }

    function getName () {
        return name;
    }

    function isDone () {
        return done;
    }

    function toJSON () {
        return {
            id,
            name,
            firedBy: firedBy.getId(),
            data: {
                bullet: bullet.toJSON()
            }
        };
    }

    return Object.freeze({
        getId,
        getFiredBy,
        getName,
        isDone,
        update,
        dispatch,
        reset,
        toJSON
    });
}

module.exports = { create: BulletEvent };
