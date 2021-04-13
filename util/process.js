const { exec } = require('child_process');

const trigger = (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, function (err, stdout, stderr) {
            if (err) reject(err);
            resolve(stdout);
        })
    })
}

const watch = (cmd) => {
    throw new Error("Unimplemented")
}

module.exports = {
    trigger, watch
}