'use strict';

/**
 * A value that can only be set when a given time has passed. After the given time
 * it will reset to the initial value.
 * TODO: Find a better name for this. Any ideas?
 */
function TempValue ({ time, value }) {
    const initialValue = value;
    let passedTime = 0;
    let ready = true;

    function update (delta) {
        if (!ready) {
            passedTime += delta;

            if (passedTime >= time) {
                passedTime = 0;
                ready = true;
                value = initialValue;
            }
        }
    }

    function setValue (newValue) {
        if (ready) {
            value = newValue;
            ready = false;

            return true;
        }

        return false;
    }

    function getValue () {
        return value;
    }

    function isReady () {
        return ready;
    }

    return Object.freeze({
        setValue,
        getValue,
        update,
        isReady
    });
}

module.exports ={ create: TempValue };
