'use strict';

const uuid = require('uuid');

function HitEvent ({ id, bullet, duration, playerHit, onDispatch, onDone }) {
    id = id || uuid.v4();

    const name = 'hit';
    let isDispatched = false;
    let done = false;
    let time = 0;

    function reset () {
        time = 0;
        done = false;
        isDispatched = false;
    }

    function update (delta) {
        if (time >= duration && !done) {
            done = true;

            onDone();
        } else if (!done) {
            time += delta;
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
            bullet: bullet.getId(),
            playerHit: playerHit.getId()
        };
    }

    return Object.freeze({
        getId,
        getName,
        update,
        isDone,
        dispatch,
        reset,
        toJSON
    });
}

module.exports = { create: HitEvent };
