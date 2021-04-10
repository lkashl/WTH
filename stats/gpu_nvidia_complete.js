const GenericTask = require('../classes/GenericTask');
const { readFile } = require('../util/file');
const contrib = require('blessed-contrib');
const { getColors } = require('../util/colors');
const { intervals } = require('../config');
const { trigger } = require('../util/process');


const digWhiteSpace = (string) => {
    for (let i = 0; i < string.length; i++) {
        if (string[i] !== " ") return i;
    }
}

/*
DATA STRUCTURE: 
[
    corex[...usage%xTime], 
    corex+1[...usage%Time]
]
*/

const whiteSpace = / +/g;
//const valDressing = /[%|(MiB)|C|W|(MHz)|(N\/A)]/
const valDressing = /[^\d\.]/g
const keyPairException = /^HW Slowdown/

const registerKeyValPair = (currObj, line) => {
    const [key, val] = line.replace(whiteSpace, " ").split(":")
    currObj[key.trim()] = val.replace(valDressing, "").trim()
}

// This is unfortunate :(
const sanitiseHeading = (line) => {
    line = line.trim();
    if (!keyPairException.test(line)) return line;
    return "HW Slowdown"
}

module.exports = new GenericTask({
    init() {
        this.execPath = 'nvidia-smi -q --display=MEMORY,UTILIZATION,TEMPERATURE,POWER,CLOCK,PERFORMANCE,FBC_STATS'
    },
    async collect() {

        try {
            //const data = trigger(this.execPath);
            let data = await (await readFile('./logs/gpu_nvidia.replica')).toString();
            const start = new Date();
            data = data.split("\n");

            let stitchObj = {}
            let currObj = {}
            let lastDepth;
            for (let i = data.length - 1; i > 0; i--) {
                const line = data[i];
                const depth = digWhiteSpace(line);
                if (lastDepth === undefined || lastDepth === depth) {
                    lastDepth = depth;
                    registerKeyValPair(currObj, line)
                } else if (depth < lastDepth) {
                    currObj = { [sanitiseHeading(line)]: currObj, ...stitchObj[depth] };
                    delete stitchObj[depth]
                    lastDepth = depth;
                } else if (depth > lastDepth) {
                    stitchObj[lastDepth] = currObj;
                    currObj = {};
                    lastDepth = depth;
                    registerKeyValPair(currObj, line)
                }

            }
            const time = new Date() - start;
            console.log(currObj)
        } catch (err) {
            console.log(err);
        }

    },
    async prepareRender(grid, [y, x, yw, xw]) {
        if (this.range[0] === this.range[1]) {
            this.range[1]++
            if (this.range >= 1) this.range[0]--
        }
        this._renders = [grid.set(y, x, yw, xw, contrib.line, {
            style: {
                text: "green",
                baseline: "black"
            },
            label: "CPU Clocks",
            minY: this.range[0] || 0,
            maxY: this.range[1] || 0,
            wholeNumbersOnly: true
        })]
    },
    async render() {
        // Reoptimise by persisting data format instead?
        const series = this._data.map((core, i) => {
            return {
                title: `Core ${i}`,
                x: this.headings,
                y: core,
                style: {
                    line: getColors(this._data.length % i)
                }
            }
        })
        this._renders[0].setData(series)
    },
    async returnDebugState(stage) {
        //const source = (await readFile(this.filePath)).toString();
        return {
            headings: this.headings,
            range: this.range,
            source
        }
    }
})