const { intervals } = require("../config");

/* Shared util and memory space for common grapshs */
// Create shared padding
const paddedXAxis = []
for (let i = 0; i < intervals; i++) {
    paddedXAxis.push(i)
}

const tableWidth = 9;
const columnSpacing = 2;

module.exports = {
    paddedXAxis, tableWidth, columnSpacing
}