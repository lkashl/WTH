const fs = require('fs/promises');

const open = fs.open;
const readFile = fs.readFile;
const readdir = fs.readdir;
const fstat = fs.stat;
const mkdir = fs.mkdir;
const appendFile = fs.appendFile;

module.exports = {
    open, readFile, readdir, fstat, mkdir, appendFile
}