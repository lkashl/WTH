// Polyfill for older node versions that do not contain fs/promises module

let open, readFile, readdir, fstat, mkdir, appendFile;

try {
    const fs = require('fs/promises');

    open = fs.open;
    readFile = fs.readFile;
    readdir = fs.readdir;
    fstat = fs.stat;
    mkdir = fs.mkdir;
    appendFile = fs.appendFile;
} catch (err) {
    const fs = require('fs');
    const { promisify } = require('util');

    open = promisify(fs.open);
    readFile = promisify(fs.readFile)
    readdir = promisify(fs.readdir)
    fstat = promisify(fs.stat)
    mkdir = promisify(fs.mkdir)
    appendFile = promisify(fs.appendFile)
}


module.exports = {
    open, readFile, readdir, fstat, mkdir, appendFile
}