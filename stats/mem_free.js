const FileTask = require('../classes/fileTask');
const { readFile } = require('../util/file');
const contrib = require('blessed-contrib');
const { randomColor, getColors } = require('../util/colors');
const { intervals } = require('../config');
const { forNumber, bytesToReadable } = require('../util/misc');

/*
DATA STRUCTURE: 
[
    [percentUsed]
]
*/

const identifier = /^(MemTotal|MemAvailable)/;
const sanitiser = /kB/g;

module.exports = new FileTask(
    function () {
        this.filePath = '/proc/meminfo';
     },
    async function () {
        let contents = await readFile(this.filePath, 'utf8');
        contents = contents.split("\n");

        if (!this.data) this.data = [];

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

        this.data = {
            percent: Math.round((total - free) / total * 10000)/100,
            total: total * 1000,
            free: free * 1000
        }

    }, async function (grid, [y, x, yw, xw]) {
        this.renders = [grid.set(y, x, yw, xw, contrib.table, {
            label: "Memory",
            columnWidth: [9, 9, 9],
            keys: true,
            fg: "green",
            selectedFg: "foreground",
            selectedBg: "background"
        })]
    }, async function () {
        this.renders[0].setData({
            headers: ["% Used", "Free", "Total"],
            data: [
                [this.data.percent, bytesToReadable(this.data.free), bytesToReadable(this.data.total)]
            ]
        })
    })