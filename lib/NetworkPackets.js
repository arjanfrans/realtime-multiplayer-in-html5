'use strict';

const debug = require('debug');
const log = debug('game:lib/NetworkPackets');

const jsonpatch = require('fast-json-patch');
const msgpack = require('msgpack-lite');

const COMPRESS_KEYS = {
    id: 'i',
    name: 'n',
    serverTime: 't',
    ownPlayer: 'o',
    players: 'p',
    events: 'e',
    position: 'l',
    lastInputSeq: 'q',
    x: 'x',
    y: 'y',
    reloading: 'r',
    fireing: 'f',
    hit: 'h'
};

const DECOMPRESS_KEYS = Object.keys(COMPRESS_KEYS).reduce((output, key) => {
    const value = COMPRESS_KEYS[key];

    output[value] = key;

    return output;
}, {});

function decompress (diff) {
    const decompressed = [];

    for (const patch of diff) {
        const result = {
            path: ''
        };

        const keys = patch.p.substring(1).split('/');

        for (const key of keys) {
            const mappedKey = DECOMPRESS_KEYS[key];

            if (!mappedKey) {
                // log('unmapped key', { key });
            }

            result.path += `/${mappedKey || key}`;
        }

        result.value = patch.v;
        result.op = patch.o;

        decompressed.push(result);
    }

    return decompressed;
}

function compress (diff) {
    const compressed = [];

    for (const patch of diff) {
        const result = {
            p: ''
        };

        const keys = patch.path.substring(1).split('/');

        for (const key of keys) {
            const mappedKey = COMPRESS_KEYS[key];

            if (!mappedKey) {
                // log('unmapped key', { key, patch });
            }

            result.p += `/${mappedKey || key}`;
        }

        result.v = patch.value;
        result.o = patch.op;

        compressed.push(result);
    }

    return compressed;
}

function NetworkPackets ({ diffOnly = true, compressDiff = true } = {}) {
    const previousSend = {};
    let previousReceive = {};

    function pack (data, id) {
        let diff = data;

        if (diffOnly) {
            diff = jsonpatch.compare(previousSend[id] || {}, data);

            if (compressDiff) {
                diff = compress(diff);
            }

            previousSend[id] = data;
        }

        diff = msgpack.encode(diff);

        return diff;
    }

    function unpack (diff) {
        diff = new Uint8Array(diff);

        diff = msgpack.decode(diff);

        let data = [];

        Object.keys(diff).forEach((value) => {
            data.push(diff[value]);
        });
        console.log(data);
        // let data = diff;

        if (diffOnly) {
            if (compressDiff) {
                const decompressedData = decompress(diff);

                diff = decompressedData;
            }

            data = Object.assign({}, previousReceive);

            jsonpatch.apply(data, diff);

            previousReceive = data;
        }

        return data;
    }

    return Object.freeze({
        pack,
        unpack
    });
}

module.exports = { create: NetworkPackets };
