const columns = 12, rows = 18;
const col2Start = 3;
const origin = 0;

module.exports = {
    enabledModules: ['cpu_usage', 'cpu_clock', 'mem_free', 'disk', 'network'],
    limits: {
        disk: {
            maxDevices: 3
        },
        network: {
            maxDevices: 3
        }
    },
    master: [rows, columns],
    // Y, X, YW, XW
    "cpu_usage": [origin, col2Start, rows / 2, columns - col2Start],
    "cpu_clock": [rows / 2, col2Start, rows / 2, columns - col2Start],
    "mem_free": [origin, origin, 2, col2Start],
    "disk": [2, 0, 2, col2Start],
    "network": [rows / 2, 0, 2, col2Start]
}