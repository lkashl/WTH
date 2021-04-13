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
                core++;
            }
        })
    },
    expose() {
        return this._data;
    },
    async returnDebugState(stage) {
        const source = (await readFile(this.filePath)).toString();
        return {
            source
        }
    }
})