/*
    Construct for all file handler based operations from read to render
*/

class GenericTask {
    constructor({ init, collect, prepareRender, render, returnDebugState }) {

        this.init = init;
        this.collect = collect;
        this.prepareRender = prepareRender;
        this.render = render;
        this.debug = returnDebugState;

        this.returnDebugState = async function () {
            const debugInfo = await this.debug();
            return {
                ...debugInfo,
                _name: this._name,
                _data: this._data,
                _renders: this._renders.map(obj=>obj.uid)
            }
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