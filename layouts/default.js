/*
    Defines layout for presentation in render, this is fed into the render function
*/
const internalStats = true;
const enabledModules = ['cpu_usage', 'cpu_clock', 'mem_free', 'disk', 'network', 'gpu_nvidia'];

const columns = 24, rows = 18;

const origin = 0;

const row0Start = origin;
const row1Start = internalStats ? origin + 2 : 0;
const row2Start = internalStats ? row1Start + Math.round((rows - row1Start) / 2) : rows / 2;
const row3Start = rows;

const col0Start = origin;
const col1Start = origin;
const col2Start = origin + 4;
const col3Start = columns;

const staticBlock = 2;

const networkStart = row1Start + staticBlock;
const networkHeight = (row2Start - row1Start - staticBlock) / 2;
const diskStart = networkStart + networkHeight;

module.exports = {
    // Whether internal tracking stats are enabled
    internalStats,
    // Specifies which modules are enabled for this dashboard
    enabledModules,
    // Limits to the amount of rendered devices based on this dashboard
    limits: {
        disk: {
            maxDevices: 5
        },
        network: {
            maxDevices: 5
        }
    },
    // The master grid layout
    master: [rows, columns],

    // Y, X, YW, XW
    "internalStats": {
        gen: [row0Start, col0Start, row1Start - row0Start, columns / 3],
        perf: [row0Start, columns / 3 * 1, row1Start - row0Start, columns / 3],
        err: [row0Start, columns / 3 * 2, row1Start - row0Start, columns / 3]
    },

    "mem_free": [row1Start, col1Start, staticBlock, col2Start - col1Start],
    "network": [networkStart, col1Start, Math.floor(networkHeight), col2Start - col1Start],
    "disk": [diskStart, col1Start, Math.ceil(networkHeight), col2Start - col1Start],
    "gpu_nvidia": [row2Start, col1Start, row3Start - row2Start, col2Start - col1Start],

    "cpu_usage": [row1Start, col2Start, row2Start - row1Start, col3Start - col2Start],
    "cpu_clock": [row2Start, col2Start, row3Start - row2Start, col3Start - col2Start],

}
