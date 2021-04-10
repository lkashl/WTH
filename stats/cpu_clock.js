const GenericTask = require('../classes/GenericTask');
const { readFile } = require('../util/file');
const contrib = require('blessed-contrib');
const { getColors } = require('../util/colors');
const { intervals } = require('../config');
const { paddedXAxis } = require('../util/render');
/*
DATA STRUCTURE: 
[
    corex[...usage%xTime], 
    corex+1[...usage%Time]
]
*/

const identifier = /^cpu MHz/;

module.exports = new GenericTask({
    init() {
        this.filePath = '/proc/cpuinfo'
    },
    async collect() {
        let contents = await readFile(this.filePath, 'utf8');
        contents = contents.split("\n");

        let firstInit = false;
        if (!this._data) {
            this._data = [];
            this.range = [null, null];
            firstInit = true;
        }

        let core = 0;

        contents.forEach(line => {
            if (identifier.test(line)) {
                if (firstInit) this._data[core] = [];

                if (this._data[core].length === intervals) this._data[core].splice(0, 1);
                let val = line.split(":")[1];
                val = Number.parseInt(val.trim())
                this._data[core].push(val);

                // Determine the new bounds for this value rounded to 5% precision
                if (this.range[0] === null || val < this.range[0]) {
                    this._forceRerender = true;
                    this.range[0] = val;
                }

                if (this.range[1] === null || val > this.range[1]) {
                    this._forceRerender = true;
                    this.range[1] = val;
                }
                core++;
            }
        })
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
            wholeNumbersOnly: true,
            xPadding: 0,
            xLabelPadding: 0
        })]
    },
    async render() {
        // Reoptimise by persisting data format instead?
        const series = this._data.map((core, i) => {
            return {
                title: `Core ${i}`,
                x: paddedXAxis,
                y: core,
                style: {
                    line: getColors(this._data.length % i)
                }
            }
        })
        this._renders[0].setData(series)
    },
    async returnDebugState(stage) {
        const source = (await readFile(this.filePath)).toString();
        return {
            range: this.range,
            source
        }
    }
})