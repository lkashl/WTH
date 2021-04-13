const { intervals } = require("../config");

/* Shared util and memory space for common grapshs */
// Create shared padding
const paddedXAxis = []
for (let i = 0; i < intervals; i++) {
    paddedXAxis.push(i)
}

const columnSpacing = 2;

// Helper functions to standardise actual init process based on what create render is passed
// This is hooked in via the createRender process to avoid boilerplate code
const initWrapper = (settings, targetModule, funct, i, grid, expose) => {
    const oldRender = settings._currentRenders[targetModule][i];
    const newRender = funct(grid, expose);
    settings._currentRenders[targetModule][i] = newRender;

    return {
        oldRender: oldRender || null,
        newRender
    }
}

// Helper function to seed wrapper creation and update functions
// These functions are invoked by the app file to populate layouts
const createRender = (targetModule, settings, functionArray) => {
    if (!settings._renderFunctions) {
        settings._renderFunctions = {};
        settings._currentRenders = {};
    }

    if (!settings._renderFunctions[targetModule]) {
        settings._renderFunctions[targetModule] = [];
        settings._currentRenders[targetModule] = [];
    }

    functionArray.forEach(([init, update], i) => {
        settings._renderFunctions[targetModule][i] = [(grid, expose) => initWrapper(settings, targetModule, init, i, grid, expose), update];
    })
}


module.exports = {
    paddedXAxis, columnSpacing, createRender
}