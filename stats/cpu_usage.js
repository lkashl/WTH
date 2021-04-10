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

BASELINE STRUCTURE:
[
    ..cores trel=-1 [idle, consumed]
]
*/
const identifier = /^cpu\d/;
module.exports = new GenericTask({
    init() {
        this.filePath = '/proc/stat';
    },
    async collect() {
        let contents = await readFile(this.filePath, 'utf8');
        contents = contents.split("\n");

        let firstInit = false;
        if (!this._data) {
            this._data = [];
            this.headings = [];
            this.range = [null, null];
            this.baseLine = [];
            this.axis = [];
            this.range = [0, 1]
            firstInit = true;
        }

        let core = 0;

        // If the file hasn't been updated then just return the same info
        if (contents.length === 1) {
            this._data.forEach(core => {
                //let rand = Math.random() * 100;
                const entry = core[core.length - 1]// + rand;
                core.push(entry);
            })
            return;
        }

        contents.forEach(line => {
            if (identifier.test(line)) {

                const [id, user, nice, system, idl, iowait, irq, softirq] = line.split(" ");

                const idle = Number.parseInt(idl);
                const consumed = Number.parseInt(user) + Number.parseInt(nice) + Number.parseInt(system) +
                    Number.parseInt(iowait) + Number.parseInt(irq) + Number.parseInt(softirq);

                if (firstInit) {
                    this._data[core] = [];
                    this.headings.push(core);
                    this.baseLine[core] = [consumed, idle];
                    return core++;
                }

                // If there is no previous core data use baseline
                const intervalIdle = idle - this.baseLine[core][1];
                const intervalConsumed = consumed - this.baseLine[core][0];
                this.baseLine[core] = [consumed, idle];

                const val = intervalConsumed / intervalIdle * 100;
                if (this._data[core].length === intervals) this._data[core].splice(0, 1);
                this._data[core].push(val);

                if (val > this.range[1]) {
                    this.range[1] = val;
                    this._forceRerender = true;
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
            label: "CPU Usage",
            minY: this.range[0],
            maxY: this.range[1],
            wholeNumbersOnly: true
        })]

    },
    async render() {
        const series = this._data.map((core, i) => {
            return {
                title: `Core ${i}`,
                x: paddedXAxis,
                y: core,
                style: {
                    line: getColors(this.headings.length % i)
                }
            }
        })
        this._renders[0].setData(series)
    },
    async returnDebugState(stage) {
        const source = (await readFile(this.filePath)).toString();
        return {
            headings: this.headings,
            range: this.range,
            baseLine: this.baseLine,
            axis: this.axis,
            source
        }
    }
})