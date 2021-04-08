/*
    Construct for all file handler based operations from read to render
*/

class GenericTask {
    constructor({ init, collect, prepareRender, render }) {

        this.init = init;
        this.collect = collect;
        this.prepareRender = prepareRender;
        this.render = render;

        this._renders = null;
        this._data = null;
        this._name = null;
        this._forceRerender = false;
        this._performance = [];
    }

    async phase(phase, ...params) {
        await this[phase](...params)
    }

}

module.exports = GenericTask;