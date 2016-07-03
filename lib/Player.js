'use strict';

const TempValue = require('./TempValue');

function Player ({ id, name, x = 0, y = 0, width = 16, height = 16, speed = 50, onEvent }) {
    const position = { x, y };
    const previousState = {
        position: { x, y }
    };

    let reloading = false;
    let hit = false;
    const fireing = TempValue.create({
        time: 200,
        value: false
    });

    let inputs = [];
    let lastInputSeq = 0;
    const angle = Math.PI;

    function getAngle () {
        return angle;
    }

    function canFire () {
        return fireing.isReady();
    }

    function getLastInputSeq () {
        return lastInputSeq;
    }

    function setLastInputSeq (value) {
        lastInputSeq = value;
    }

    function getId () {
        return id;
    }

    function getName () {
        return name;
    }

    function setPosition (x, y) {
        position.x = x;
        position.y = y;
    }

    function getPosition () {
        return Object.assign({}, position);
    }

    function setSpeed (newSpeed) {
        speed = newSpeed;
    }

    function pushInput (input) {
        inputs.push(input);
    }

    function getInputs () {
        return inputs;
    }

    function getSpeed () {
        return speed;
    }

    function getWidth () {
        return width;
    }

    function getHeight () {
        return height;
    }

    function clearInputs (numberToClear) {
        if (typeof numberToClear === 'undefined') {
            inputs = [];
        } else {
            inputs.splice(0, numberToClear);
        }
    }

    function setReloading (value) {
        reloading = value;
    }

    function isReloading () {
        return reloading;
    }

    function isFireing () {
        return fireing.getValue();
    }

    function setPreviousState (state) {
        Object.assign(previousState, state);
    }

    function getPreviousState () {
        return Object.assign({}, previousState);
    }

    function getLatestInputs () {
        return inputs.filter(input => {
            return input.seq > lastInputSeq;
        });
    }

    function setEventHandler (handler) {
        onEvent = handler;
    }

    function processInputs (delta) {
        if (inputs.length === 0) {
            return;
        }

        const movement = {
            x: 0,
            y: 0
        };

        for (let j = 0; j < inputs.length; j++) {
            // Don't process ones we already have simulated locally
            if (inputs[j].seq > lastInputSeq) {
                const input = inputs[j].inputs;
                const c = input.length;

                for (let i = 0; i < c; ++i) {
                    const key = input[i];

                    if (key === 'l') {
                        movement.x -= 1;
                    }
                    if (key === 'r') {
                        movement.x += 1;
                    }
                    if (key === 'd') {
                        movement.y += 1;
                    }
                    if (key === 'u') {
                        movement.y -= 1;
                    }
                    if (key === 'f') {
                        onEvent({ name: 'bulletEvent' });
                    }
                    if (key === 're') {
                        onEvent({ name: 'reload' });
                    }
                }
            }
        }

        position.x += movement.x * (speed * (delta / 1000));
        position.y += movement.y * (speed * (delta / 1000));

        position.x = Math.round(position.x * 1000) / 1000;
        position.y = Math.round(position.y * 1000) / 1000;

        lastInputSeq = inputs[inputs.length - 1].seq;
    }

    function fireBullet () {
        return fireing.setValue(true);
    }

    function update (delta) {
        fireing.update(delta);

        setPreviousState({
            position: getPosition()
        });

        processInputs(delta);
    }

    function isHit () {
        return hit;
    }

    function setHit (value) {
        hit = value;
    }

    function damage () {
        console.log('hit');
        hit = true;
    }

    function getHit () {
        return hit;
    }

    function toJSON () {
        return {
            id,
            name,
            lastInputSeq,
            position: Object.assign({}, position),
            hit,
            fireing: fireing.getValue(),
            reloading
        };
    }

    return Object.freeze({
        getId,
        getName,
        fireBullet,
        getAngle,
        canFire,
        damage,
        setHit,
        getHit,
        getPosition,
        isHit,
        getSpeed,
        pushInput,
        getInputs,
        getLatestInputs,
        getWidth,
        getHeight,
        setLastInputSeq,
        getLastInputSeq,
        getPreviousState,
        setPosition,
        setSpeed,
        setReloading,
        isFireing,
        isReloading,
        setPreviousState,
        setEventHandler,
        clearInputs,
        update,
        toJSON
    });
}

module.exports = { create: Player };
