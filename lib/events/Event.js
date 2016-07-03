'use strict';

const uuid = require('node-uuid');

function Event ({ id, firedBy, name, onDispatch }) {
    id = id || uuid.v4();

    let isDispatched = false;
    let done = false;

    function reset () {
        done = false;
        isDispatched = false;
    }

    function dispatch (event) {
        if (!isDispatched) {
            done = true;
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
        dispatch,
        reset,
        toJSON
    });
}

module.exports = { create: Event };
