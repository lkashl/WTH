// NOTE: This file is purely for debug log parsing
// It should never be called from the application
// Allow for a replica module to be created to replicate debug errors without underlying harddware or OS being necessary

const fs = require('fs');

const target = process.argv[2];
const newLine = /\n/g;

let state = "[" + fs.readFileSync("./" + target).toString().replace(newLine, ",");
state = state.substring(0, state.length - 1) + "]"
state = JSON.parse(state);

const mod = process.argv[2].replace(".txt", "")
console.log("Creating replica file for " + mod);
fs.writeFileSync('./' + mod + ".replica", state[0].source)

module.exports = () => {
    throw new Error("File not built for import");
}