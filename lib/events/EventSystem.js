'use strict';

function EventSystem ({ onDispatch } = {}) {
    const events = new Map();

    function dispatch (event) {
        if (!events.has(event.getId())) {
            events.set(event.getId(), event);
            event.dispatch();

            if (typeof onDispatch === 'function') {
                onDispatch(event);
            }
        }
    }

    function update (delta) {
        for (const event of events.values()) {
            if (!event.isDone()) {
                if (typeof event.update === 'function') {
                    event.update(delta);
                }
            }
        }
    }

    return Object.freeze({
        dispatch,
        update
    });
}

module.exports = { create: EventSystem };
