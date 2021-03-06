/*
    Construct for all file handler based operations from read to render
*/

const { readFile } = require("../util/file");

const osDetails = "/proc/version";

class GenericTask {
    constructor({ init, collect, prepareRender, render, returnDebugState }) {

        this.init = init;
        this.collect = collect;
        this.prepareRender = prepareRender;
        this.render = render;
        this.debug = returnDebugState;

        this.returnDebugState = async function (err) {
            const os = await readFile(osDetails).catch(err => err)
            const debugInfo = await this.debug().catch(err => err)
            
            const obj = {
                err: {message: err.message, stack: err.stack},
                _name: this._name,
                _data: this._data,
                _renders: this._renders.map(obj => obj.uid),
                debugInfoError: debugInfo instanceof Error,
                nodeVersions: process.versions,
                os: os instanceof Error ? { message: os.message, stack: os.stack } : os.toString()
            }

            if (!obj.debugInfoError) return { ...obj, ...debugInfo }
            return obj;
        }

        this._renders = null;
        this._data = null;
        this._name = null;
        this._forceRerender = false;
        this._performance = [];
        this._failures = 0;

    }

    async phase(phase, ...params) {
        await this[phase](...params)
    }

}

module.exports = GenericTask;