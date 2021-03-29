const FileTask = require('../classes/fileTask');
const { readFile } = require('../util/file');
const contrib = require('blessed-contrib');
const { randomColor, getColors } = require('../util/colors');
const { intervals } = require('../config');
const { bytesToReadable } = require('../util/misc');

/*
DATA STRUCTURE: 
[
0 and 8
]
*/

const splitter = /\W+/;
module.exports = new FileTask(
    async function () {
        this.filePath = '/proc/net/dev'
        const file = await readFile(this.filePath);
        const adapters = [];
        file.toString().split("\n").splice(2,).forEach(adapter => {
            const entries = adapter.split(splitter);
            const adapterName = entries[1];
            const stats = entries.splice(2,);

            const total = stats.reduce((a, b) => a + Number.parseInt(b), 0);
            if (total === 0) return;
            adapters.push(adapterName);
        });
        this.adapters = adapters;
        this.identifiers = new RegExp("^\\W+(" + adapters.join("|") + ")");
        this.baseLine = {};
        this.data = [];
    },
    async function () {
        const file = await readFile(this.filePath);
        const lines = file.toString().split("\n");
        lines.forEach((line, i) => {
            const adapter = this.identifiers.exec(line);

            if (!adapter) return;
            const name = adapter[1];
            const fields = line.split(splitter);
            const incoming = Number.parseInt(fields[2]);
            const outgoing = Number.parseInt(fields[10]);
            if (!this.baseLine[name]) return this.baseLine[name] = { incoming, outgoing };
            const incomingNet = incoming - this.baseLine[name].incoming
            const outgoingNet = outgoing - this.baseLine[name].outgoing

            const j = this.adapters.indexOf(name);
            this.data[j] = { incomingNet, outgoingNet }
            this.baseLine[name] = { incoming, outgoing };
        })
    },
    async function (grid, [y, x, yw, xw,]) {
        const renders = [];
        for (let i = 0; i < this.adapters.length; i++) {
            renders.push(grid.set(y + i * 2, x, yw, xw, contrib.table, {
                label: this.adapters[i],
                columnWidth: [9, 9, 9],
                keys: true,
                fg: "green",
                selectedFg: "foreground",
                selectedBg: "background"
            }))
        }
        this.renders = renders;
    },
    async function () {
        if (this.data.length > 0)
            this.renders.forEach((render, i) => render.setData({
                headers: ["Incoming", "Outgoing"],
                data: [
                    [bytesToReadable(this.data[i].incomingNet), bytesToReadable(this.data[i].outgoingNet)]
                ]
            }));
    })