/*
    Construct for all file handler based operations from read to render
*/

class GenericTask {
    constructor(initialise, collectData, renderInitiate, renderData) {
        this.initialise = initialise;
        this.collectData = collectData;
        this.renderInitiate = renderInitiate;
        this.renderData = renderData;

        this._renders = null;
        this._data = null;
        this._name = null;
        this._forceRerender = false;
        this._performance = [];
    }

    // Limits to render are passed in and stored on init
    // This can be device constraints in terms of numbers displayed for a specific layout
    async init(limits) {
        await this.initialise(limits);
    }

    async collect() {
        const before = new Date();
        await this.collectData();
        this._performance = [new Date() - before];
    }

    async prepareRender(...args) {
        const before = new Date();
        await this.renderInitiate(...args);
        this._performance.push(new Date() - before);
    }

    async render() {
        const before = new Date();
        await this.renderData();
        this._performance.push(new Date() - before);
    }
}

module.exports = GenericTask;