'use strict';

const uuid = require('uuid');

function Client ({ socket, name }) {
    const id = uuid.v4();
    let currentRoom = null;

    function emit (event, data) {
        socket.emit(event, data);
    }

    function on (event, listener) {
        socket.on(event, listener);
    }

    function once (event, listener) {
        socket.once(event, listener);
    }

    function send (message) {
        socket.send(message);
    }

    function setCurrentRoom (room) {
        currentRoom = room;
    }

    function getCurrentRoom () {
        return currentRoom;
    }

    function isInRoom () {
        return currentRoom ? true : false;
    }

    function getName () {
        return name;
    }

    function getId () {
        return id;
    }

    function toJSON () {
        return {
            currentRoom: currentRoom ? currentRoom.toJSON() : null,
            id,
            name
        };
    }

    return Object.freeze({
        getId,
        getName,
        getCurrentRoom,
        isInRoom,
        emit,
        on,
        once,
        send,
        setCurrentRoom,
        toJSON
    });
}

module.exports = { create: Client };
