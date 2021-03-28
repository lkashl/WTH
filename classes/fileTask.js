const { open } = require("../util/file");

class FileTask {
    constructor(filePath, initialise, collectData, prepareRender, renderData) {
        this.filePath = filePath;
        this.initialise = initialise;
        this.collectData = collectData;
        this.renderData = renderData;
        this.prepareRender = prepareRender;

        this.file = null;
        this.renders = null;
        this.data = null;
    }

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