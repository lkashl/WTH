const GenericTask = require('../classes/GenericTask');
const { readFile } = require('../util/file');
const { forNumber } = require('../util/misc');
const { isDebug } = require('../util/env');

/*
DATA STRUCTURE: 
[
0 and 8
]
*/

const splitter = /\W+/;

module.exports = new GenericTask({
    async init(limits) {

        this.filePath = isDebug ? "./logs/network.replica" : '/proc/net/dev'

        const file = await readFile(this.filePath);

        const adapters = [];
        file.toString().split("\n").splice(2,).forEach(line => {
            // Resolves i1 by ensuring padding is always present for consistent indexing
            // The file is whitespaced to a common index so the longest adapter isn't always spaced out
            line = " " + line;

            const entries = line.split(splitter);
            const adapterName = entries[1];
            const stats = entries.splice(2,);

            const total = stats.reduce((a, b) => a + Number.parseInt(b), 0);
            if (total === 0) return;
            adapters.push({
                adapterName,
                activity: total
            });
        });

        // Check whether there is a UI limit to adapters rendered
        const adaptersFlat = [];
        const limit = Math.min(limits.maxDevices, adapters.length);

        adapters.sort((a, b) => b.activity - a.activity);
        forNumber(limit, (i) => adaptersFlat.push(adapters[i].adapterName))

        this.adapters = adaptersFlat;
        this.identifiers = new RegExp("^\\W+(" + adaptersFlat.join("|") + ")");
        this.baseLine = {};

        this._data = [];
    },
    async collect() {
        const file = await readFile(this.filePath);

        file.toString().split("\n").forEach((line) => {
            if (!line) return;

            // Resolves i1 by ensuring padding is always present for consistent indexing
            // The file is whitespaced to a common index so the longest adapter isn't always spaced out
            line = " " + line;

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
            this._data[j] = { incomingNet, outgoingNet }
            this.baseLine[name] = { incoming, outgoing };
        })
    },
    async returnDebugState(stage) {
        const source = (await readFile(this.filePath)).toString();
        return {
            adapters: this.adapters,
            baseLine: this.baseLine,
            source: source
        }
    },
    expose() {
        return {
            data: this._data,
            adapters: this.adapters
        }
    }
})