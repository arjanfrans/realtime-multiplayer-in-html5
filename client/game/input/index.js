'use strict';

const Keyboard = require('./utils/keyboard');

function inputHandler () {
    const keyboard = Keyboard.create();

    function getInput () {
        const inputs = [];

        if (keyboard.isPressed('A') || keyboard.isPressed('left')) {
            inputs.push('l');
        }

        if (keyboard.isPressed('D') || keyboard.isPressed('right')) {
            inputs.push('r');
        }

        if (keyboard.isPressed('S') || keyboard.isPressed('down')) {
            inputs.push('d');
        }

        if (keyboard.isPressed('W') || keyboard.isPressed('up')) {
            inputs.push('u');
        }

        if (keyboard.isPressed('space')) {
            inputs.push('f');
        }

        if (keyboard.isPressed('R')) {
            inputs.push('re');
        }

        return inputs;
    }

    return {
        getInput
    };
}

module.exports = inputHandler;
