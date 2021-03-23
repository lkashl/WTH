const FileTask = require('../classes/fileTask');
const { readFile } = require('../util/file');
const contrib = require('blessed-contrib');
const { randomColor, getColors } = require('../util/colors');
const { intervals } = require('../config');
const { forNumber } = require('../util/misc');

/*
DATA STRUCTURE: 
[
    [percentUsed]
]
*/

const identifier = /^(MemTotal|MemAvailable)/;
const sanitiser = /kB/g;

module.exports = new FileTask('/proc/meminfo',
    function () { },
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

        this.data = (total - free) / total * 100;

    }, async function (grid, [y, x, yw, xw]) {
        this.renders = [grid.set(y, x, yw, xw, contrib.gauge, {
            label: "Mem Used",
        })]
    }, async function () {
        this.renders[0].setPercent(this.data)
    })