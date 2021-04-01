/*
    Defines layout for presentation in render, this is fed into the render function
*/
const internalStats = true;
const enabledModules = ['cpu_usage', 'cpu_clock', 'mem_free', 'disk', 'network'];

const columns = 12, rows = 18;

const origin = 0;

const row0Start = origin;
const row1Start = internalStats ? origin + 3 : 0;
const row2Start = internalStats ? row1Start + Math.round((rows - row1Start) / 2) : rows / 2;
const row3Start = rows;

const col0Start = origin;
const col1Start = origin;
const col2Start = origin + 3;
const col3Start = columns;

const staticBlock = 2;

const sharedSpaceMemDisk = rows - staticBlock - row1Start;
const diskHeight = Math.ceil(sharedSpaceMemDisk / 2);
const memHeight = Math.floor(sharedSpaceMemDisk / 2);

module.exports = {
    internalStats,
    enabledModules,
    limits: {
        disk: {
            maxDevices: 3
        },
        network: {
            maxDevices: 3
        }
    },
    master: [rows, columns],

    // Y, X, YW, XW
    "internalStats": {
        gen: [row0Start, col0Start, row1Start - row0Start, columns/3],
        perf: [row0Start, columns/3*1, row1Start - row0Start, columns/3],
        err: [row0Start, columns/3*2, row1Start - row0Start, columns/3]
    },

    "mem_free": [row1Start, col1Start, staticBlock, col2Start - col1Start],
    "disk": [row1Start + staticBlock, col1Start, diskHeight, col2Start - col1Start],
    "network": [row2Start, col1Start, memHeight, col2Start - col1Start],

    "cpu_usage": [row1Start, col2Start, row2Start - row1Start, col3Start - col2Start],
    "cpu_clock": [row2Start, col2Start, row3Start - row2Start, col3Start - col2Start],
}
