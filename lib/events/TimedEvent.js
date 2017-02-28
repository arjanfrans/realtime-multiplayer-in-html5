'use strict';

const uuid = require('uuid');

function TimedEvent ({ id, firedBy, name, duration, onDispatch, onDone }) {
    id = id || uuid.v4();

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

    function getFiredBy () {
        return firedBy;
    }

    function getName () {
        return name;
    }

    function setName (value) {
        name = value;
    }

    function isDone () {
        return done;
    }

    function toJSON () {
        return {
            id,
            name,
            firedBy: firedBy.getId()
        };
    }

    return Object.freeze({
        getId,
        getFiredBy,
        getName,
        isDone,
        setName,
        update,
        dispatch,
        reset,
        toJSON
    });
}

module.exports = { create: TimedEvent };
