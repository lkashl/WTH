const GenericTask = require('../classes/GenericTask');
const { readFile } = require('../util/file');
const contrib = require('blessed-contrib');
const { forNumber, bytesToReadable } = require('../util/misc');
const { tableWidth, columnSpacing } = require('../util/render');

/*
DATA STRUCTURE: 
[
    [percentUsed]
]
*/

const identifier = /^(MemTotal|MemAvailable)/;
const sanitiser = /kB/g;

module.exports = new GenericTask({
    init() {
        this.filePath = '/proc/meminfo';
    },
    async collect() {
        let contents = await readFile(this.filePath, 'utf8');
        contents = contents.split("\n");

        if (!this._data) this._data = [];

        let total, free;
        forNumber(contents.length, (i, breaker) => {
            if (identifier.test(contents[i])) {
                let [key, val] = contents[i].replace(sanitiser, "").split(":");
                val = Number.parseInt(val);
                if (key === "MemTotal") {
                    total = val;
                    if (free) breaker()
                } else if (key === "MemAvailable") {
                    free = val;
                    if (total) breaker()
                }
            }
        })

        this._data = {
            percent: Math.round((total - free) / total * 10000) / 100,
            total: total * 1000,
            free: free * 1000
        }

    },
    async returnDebugState(stage) {
        const source = (await readFile(this.filePath)).toString();
        return {
            source
        }
    },
    expose() {
        return {
            data: this._data
        }
    }

})