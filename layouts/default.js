const contrib = require('blessed-contrib');
const { getColors } = require('../util/colors');
const { bytesToReadable } = require('../util/misc');
const { paddedXAxis, columnSpacing } = require('../util/render');
/*
    Defines layout for presentation in render, this is fed into the render function
*/

const internalStats = false;
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
const col3Start = columns - columns / 4;
const col4Start = columns;

const staticBlock = 2;

const networkStart = row1Start + staticBlock;
const networkHeight = (row2Start - row1Start - staticBlock) / 2;
const diskStart = networkStart + networkHeight;

const settings = {
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
        perf: [row0Start, columns / 3 * 1, row1Start - row0Start + 1, columns / 3],
        err: [row0Start, columns / 3 * 2, row1Start - row0Start, columns / 3]
    },

    "mem_free": [row1Start, col1Start, staticBlock, col2Start - col1Start],
    "network": [networkStart, col1Start, Math.floor(networkHeight), col2Start - col1Start],
    "disk": [diskStart, col1Start, Math.ceil(networkHeight), col2Start - col1Start],
    "gpu_nvidia": [row2Start, col1Start, row3Start - row2Start, col2Start - col1Start],

    "cpu_usage": [row1Start, col2Start, row2Start - row1Start, col3Start - col2Start],
    "cpu_clock": [row2Start, col2Start, row3Start - row2Start, col3Start - col2Start],

    "gpu_usage": [row1Start, col3Start, row2Start - row1Start, col4Start - col3Start],
    "gpu_clock": [row2Start, col3Start, row3Start - row2Start, col4Start - col3Start],

    renderFunctions: {},
    currentRenders: {}
}

// Helper function to clear old screens and refresh with new ones when init is called again
const initWrapper = (targetModule, funct, i, grid) => {
    const oldRender = settings.currentRenders[targetModule][i];
    const newRender = funct(grid);
    settings.currentRenders[targetModule][i] = newRender;

    return {
        oldRender: oldRender || null,
        newRender
    }
}

// Helper function to seed wrapper creation and update functions
const createRender = (targetModule, functionArray) => {
    if (!settings.renderFunctions[targetModule]) {
        settings.renderFunctions[targetModule] = [];
        settings.currentRenders[targetModule] = [];
    }

    functionArray.forEach(([init, update], i) => {
        settings.renderFunctions[targetModule][i] = [(grid) => initWrapper(targetModule, init, i, grid), update];
    })
}

let cpu_clock = { range: [null, null] };

// Add force rerender functionality

// Stores the functions for creating a new render as well as updating
createRender("cpu_clock", [[(grid) => {
    return grid.set(...settings.cpu_clock, contrib.line, {
        style: {
            text: "green",
            baseline: "black"
        },
        label: "CPU Clocks",
        wholeNumbersOnly: true,
        xPadding: 0,
        xLabelPadding: 0
    })
}, (data) => {
    // Reoptimise by persisting data format instead?
    return data.map((core, i) => {
        return {
            title: `Core ${i}`,
            x: paddedXAxis,
            y: core,
            style: {
                line: getColors(data.length % i)
            }
        }
    })
}]])

createRender("cpu_usage", [[(grid) => {
    return grid.set(...settings.cpu_usage, contrib.line, {
        style: {
            text: "green",
            baseline: "black"
        },
        label: "CPU Usage",
        wholeNumbersOnly: true
    })
}, ({ headings, baseLine, data }) => {
    return data.map((core, i) => {
        return {
            title: `Core ${i}`,
            x: paddedXAxis,
            y: core,
            style: {
                line: getColors(headings.length % i)
            }
        }
    })
}]])


// Disk
createRender("disk", [[(grid) => {
    return grid.set(...settings.disk, contrib.table, {
        label: "Disk Activity",
        columnWidth: [7, 6, 6, 6],
        columnSpacing: columnSpacing,
        keys: true,
        fg: "green",
        selectedFg: "foreground",
        selectedBg: "background",
        bold: false
    })
}, ({ data, devices }) => {
    if (data.length === 0) return null;
    const diskData = data.map((data, i) => [devices[i], data.percentQueue, bytesToReadable(data.readB), bytesToReadable(data.writeB)])
    return {
        headers: ["Disk", "Wait", "Read", "Write"],
        data: diskData
    }
}]])

createRender("gpu_nvidia", [[(grid) => {
    return grid.set(...settings.gpu_nvidia, contrib.table, {
        //label: `${this._data[0][0].name} [${this._data[0][0]['memory.total']}Mb] [${this._data[0][0]['power.limit']}W]`,
        columnWidth: [16, 8],
        columnSpacing: 3,
        keys: true,
        fg: "black",
        selectedFg: "foreground",
        selectedBg: "foreground",
        bold: false
    })
}, ({ data }) => {
    if (data.length > 0) {
        const gpu = data[0];
        const thisGPU = gpu[gpu.length - 1];

        const spacer = [' ', ' '];
        const vals = [
            [`Throttle [${thisGPU.pstate}]`, thisGPU.throttle],
            ['Util (Core)', thisGPU['utilization.gpu'] + "%"],
            ['Util (Mem)', thisGPU['utilization.memory'] + "%"],
            ['Power Draw', thisGPU['power.draw']],
            spacer,
            ['Temp Core/Mem', thisGPU['temperature.gpu'] + "/" + thisGPU['temperature.memory']],
            ["Fan Speed", thisGPU['fan.speed'] + "%"],
            spacer,
            ['Clock', thisGPU['clocks.current.graphics']],
            ['Clock (mem)', thisGPU['clocks.current.memory']],
            ['Clock (vid)', thisGPU['clocks.current.video']],
            ['Clock (sm)', thisGPU['clocks.current.sm']],
            spacer,
            ['VRAM Used/Free', thisGPU['memory.used'] + "/" + thisGPU['memory.free']],
            ['PCI Gen/Width', "G" + thisGPU['pcie.link.gen.current'] + "/" + thisGPU['pcie.link.width.current'] + "x"]

        ]

        return {
            headers: spacer,
            data: vals
        };
    }
}], [(grid) => {
    return grid.set(...settings.gpu_usage, contrib.line, {
        style: {
            text: "green",
            baseline: "black"
        },
        label: "GPU Usage",
        //wholeNumbersOnly: true,
        showLegend: true
    })
}, ({ data }) => {
    const gpu = data[0];
    const mem = [], core = [];

    // TODO: Reoptimise GPU data format to not require additional serialisation
    gpu.map(interval => {
        core.push(interval["utilization.gpu"])
        mem.push(interval["utilization.memory"])
    })

    return [{
        title: `gpu`,
        x: paddedXAxis,
        y: core,
        style: { line: "blue" }
    }, {
        title: "mem",
        x: paddedXAxis,
        y: mem,
        style: { line: "green" }
    }]

}], [(grid) => {
    return grid.set(...settings.gpu_clock, contrib.line, {
        style: {
            text: "green",
            baseline: "black"
        },
        label: "GPU Clock",
        minY: 0,
        maxY: 0,
        wholeNumbersOnly: true,
        xPadding: 0,
        xLabelPadding: 0,
        showLegend: true
    })
}, ({ data }) => {
    const gpu = data[0];
    const graphics = [], memory = [], sm = [], video = [];

    // TODO: Reoptimise GPU data format to not require additional serialisation
    gpu.map(interval => {
        graphics.push(interval["clocks.current.graphics"])
        memory.push(interval["clocks.current.memory"])
        sm.push(interval["clocks.current.sm"])
        video.push(interval["clocks.current.video"])
    })

    return [{
        title: `core`,
        x: paddedXAxis,
        y: graphics,
        style: { line: "blue" }
    }, {
        title: "mem",
        x: paddedXAxis,
        y: memory,
        style: { line: "green" }
    }, {
        title: "sm",
        x: paddedXAxis,
        y: sm,
        style: { line: "yellow" }
    }, {
        title: "vid",
        x: paddedXAxis,
        y: video,
        style: { line: "red" }
    },]
}]])

createRender("mem_free", [[(grid) => {
    return grid.set(...settings.mem_free, contrib.table, {
        label: "Memory",
        columnWidth: [6, 6, 6],
        keys: true,
        fg: "green",
        selectedFg: "foreground",
        selectedBg: "background",
        columnSpacing
    })
}, ({ data }) => {
    return {
        headers: ["% Used", "Free", "Total"],
        data: [
            [data.percent, bytesToReadable(data.free), bytesToReadable(data.total)]
        ]
    }
}]])

createRender("network", [[(grid) => {
    return grid.set(...settings.network, contrib.table, {
        label: "Network Activity",
        columnWidth: [10, 8, 8],
        columnSpacing: columnSpacing,
        keys: true,
        fg: "green",
        selectedFg: "foreground",
        selectedBg: "background"
    })
}, ({ data, adapters }) => {
    if (data.length === 0) return null;
    const localData = data.map((drive, i) => [adapters[i], bytesToReadable(drive.incomingNet), bytesToReadable(drive.outgoingNet)])

    return {
        headers: ["Device", "In.", "Out."],
        data: localData
    };
}]])

module.exports = settings;