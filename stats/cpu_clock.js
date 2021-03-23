const FileTask = require('../classes/fileTask');
const { readFile } = require('../util/file');
const contrib = require('blessed-contrib');
const { randomColor, getColors } = require('../util/colors');
const { intervals } = require('../config');

/*
DATA STRUCTURE: 
[
    corex[...usage%xTime], 
    corex+1[...usage%Time]
]
*/

const identifier = /^cpu MHz/;
module.exports = new FileTask('/proc/cpuinfo',
    function(){},
    async function () {
    let contents = await readFile(this.filePath, 'utf8');
    contents = contents.split("\n");

    let firstInit = false;
    if (!this.data) {
        this.data = [];
        this.headings = [];
        this.range = [null, null];
        firstInit = true;
    }

    let core = 0;

    contents.forEach(line => {
        if (identifier.test(line)) {
            if (firstInit) {
                this.data[core] = [];
                this.headings.push(core);
            }

            if (this.data[core].length === intervals) this.data[core].splice(0, 1);
            let val = line.split(":")[1];
            val = Number.parseInt(val.trim())
            this.data[core].push(val);
            if (this.range[0] === null || val < this.range[0]) this.range[0] = val;
            if (this.range[1] === null || val > this.range[1]) this.range[1] = val;
            core++;
        }
    })
}, async function (grid, [y, x, yw, xw]) {
    if (this.range[0] === this.range[1]) {
        this.range[1]++
        if (this.range >= 1) this.range[0]--
    }
    this.renders = [grid.set(y, x, yw, xw, contrib.line, {
        style: {
            text: "green",
            baseline: "black"
        },
        label: "CPU Clocks",
        minY: this.range[0] || 0,
        maxY: this.range[1] || 0,
        wholeNumbersOnly: true
        //showLegend: true
    })]
}, async function () {
    // Reoptimise by persisting data format instead?
    const series = this.data.map((core, i) => {
        return {
            title: `Core ${i}`,
            x: this.headings,
            y: core,
            style: {
                line: getColors(this.data.length % i)
            }
        }
    })
    this.renders[0].setData(series)
})