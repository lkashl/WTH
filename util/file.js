const fs = require('fs/promises');

const open = fs.open;
const readFile = fs.readFile;
const readdir = fs.readdir;
const fstat = fs.stat;

module.exports = {
    open, readFile, readdir, fstat
}