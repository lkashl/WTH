const GenericTask = require('../classes/GenericTask');
const { readFile } = require('../util/file');
const contrib = require('blessed-contrib');
const { forNumber, bytesToReadable } = require('../util/misc');

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
    async prepareRender(grid, [y, x, yw, xw]) {
        this._renders = [grid.set(y, x, yw, xw, contrib.table, {
            label: "Memory",
            columnWidth: [9, 9, 9],
            keys: true,
            fg: "green",
            selectedFg: "foreground",
            selectedBg: "background"
        })]
    },
    async render() {
        this._renders[0].setData({
            headers: ["% Used", "Free", "Total"],
            data: [
                [this._data.percent, bytesToReadable(this._data.free), bytesToReadable(this._data.total)]
            ]
        })
    }
})