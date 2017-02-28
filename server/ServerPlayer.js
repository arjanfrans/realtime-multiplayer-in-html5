'use strict';

const uuid = require('uuid');
const Player = require('../lib/Player');

function ServerPlayer ({ name, x = 0, y = 0, width = 16, height = 16, speed = 50 }) {
    return Player.create({
        id: uuid.v4(),
        name,
        x,
        y,
        width,
        height,
        speed
    });
}

module.exports = { create: ServerPlayer };
