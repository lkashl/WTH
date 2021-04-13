const GenericTask = require('../classes/GenericTask');
const { readFile } = require('../util/file');
const { intervals } = require('../config');

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
            this.baseLine = [];
            firstInit = true;
        }

        let core = 0;

        // If the file hasn't been updated then just return the same info
        if (contents.length === 1) {
            this._data.forEach(core => {
                const entry = core[core.length - 1]
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
                core++;
            }
        })

    },
    expose() {
        return {
            headings: this.headings,
            baseLine: this.baseLine,
            data: this._data
        }
    },
    async returnDebugState(stage) {
        const source = (await readFile(this.filePath)).toString();
        return {
            headings: this.headings,
            baseLine: this.baseLine,
            source
        }
    }
})