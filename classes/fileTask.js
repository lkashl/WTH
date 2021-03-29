/*
    Construct for all file handler based operations from read to render
*/
class FileTask {
    constructor(initialise, collectData, prepareRender, renderData) {
        this.initialise = initialise;
        this.collectData = collectData;
        this.renderData = renderData;
        this.prepareRender = prepareRender;

        this.file = null;
        this.renders = null;
        this.data = null;
    }

    // Limits to render are passed in and stored on init
    // This can be device constraints in terms of numbers displayed for a specific layout
    async init(limits) {
        await this.initialise(limits);
    }

    async collect() {
        await this.collectData();
    }
    
    async render() {
        this.renderData();
    }
}

module.exports = FileTask;