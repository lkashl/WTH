const FileTask = require('../classes/fileTask');
const { readFile, readdir, fstat } = require('../util/file');
const contrib = require('blessed-contrib');
const { getColors } = require('../util/colors');

/*
DATA STRUCTURE: 
[
    corex[...usage%xTime], 
    corex+1[...usage%Time]
]

BASELINE STRUCTURE:
[
    ..cores trel=-1 [idle, consumed]
]
*/

/*
0  read I/Os       requests      number of read I/Os processed
1  read merges     requests      number of read I/Os merged with in-queue I/O
2  read sectors    sectors       number of sectors read
3  read ticks      milliseconds  total wait time for read requests
4  write I/Os      requests      number of write I/Os processed
5  write merges    requests      number of write I/Os merged with in-queue I/O
6  write sectors   sectors       number of sectors written
7  write ticks     milliseconds  total wait time for write requests
8  in_flight       requests      number of I/Os currently in flight
9  io_ticks        milliseconds  total time this block device has been active
10 time_in_queue   milliseconds  total wait time for all requests
11 discard I/Os    requests      number of discard I/Os processed
12 discard merges  requests      number of discard I/Os merged with in-queue I/O
13 discard sectors sectors       number of sectors discarded
14 discard ticks   milliseconds  total wait time for discard requests

io_ticks vs timeinqueue [10/(9 + 10)]
read throughput [2]
write throughput [6]

*/

const statToArray = (stat) => {
    const rawNums = stat.toString().split(" ");
    const nums = [];
    rawNums.forEach(item => {
        const num = Number.parseInt(item);
        if (!isNaN(num)) nums.push(num);
    })

    return nums;
}

const identifier = /^cpu\d/;
module.exports = new FileTask(
    '/sys/block',
    async function () {
        const path = '/sys/block/';
        const blockDevices = await readdir(path);
        const stats = await Promise.all(blockDevices.map(dev => readFile(`${path}${dev}/stat`)));

        const scanPaths = [];
        this.devices = [];
        this.sectors = [];
        this.baseLine = [];
        this.data = [];

        stats.forEach((stat, i) => {
            const nums = statToArray(stat);
            const total = nums.reduce((a, b) => Number.parseInt(a) + Number.parseInt(b), 0)
            if (total !== 0) {
                scanPaths.push(`${path}${blockDevices[i]}/stat`);
                this.devices.push(blockDevices[i]);
            }
        })

        this.scanPaths = scanPaths;

        // Get the sector size
        const sectors = await Promise.all(this.devices.map(dev => readFile(`${path}${dev}/queue/max_sectors_kb`)));
        this.sectors = sectors.map(sector => Number.parseInt(sector.toString()));
    },
    async function () {
        let queue = [];
        this.scanPaths.forEach(path => queue.push(readFile(path), fstat(path)));
        queue = await Promise.all(queue);
        queue.forEach((buff, i) => {
            // TODO: Just for loop this to increment i at 2
            if (i % 2 === 0) {
                const index = i / 2;
                const stats = statToArray(buff.toString());

                const lastModified = queue[i + 1].ctimeMs;
                let activeIoms = stats[9];
                let queueIoms = stats[10];
                let readB = stats[2] * this.sectors[index];
                let writeB = stats[6] * this.sectors[index];

                const newBaseline = { lastModified, activeIoms, queueIoms, readB, writeB };

                if (this.baseLine[index]) {
                    activeIoms -= this.baseLine[index].activeIoms;
                    queueIoms -= this.baseLine[index].queueIoms;
                    readB -= this.baseLine[index].readB;
                    writeB -= this.baseLine[index].writeB;

                    this.data[index] = {
                        percentQueue: activeIoms + queueIoms === 0 ? 0 : queueIoms / (activeIoms + queueIoms) * 100,
                        readB: readB,
                        writeB: writeB
                    }
                }

                this.baseLine[index] = newBaseline;
            }
        });
    },
    async function (grid, [y, x, yw, xw,]) {
        const renders = [];
        for (let i = 0; i < this.devices.length; i++) {
            renders.push(grid.set(y * (i+1), x, yw, xw, contrib.table, {
                label: this.devices[i],
                columnWidth: [9, 9, 9],
                keys: true,
                fg: "black",
                selectedFg: "black",
                selectedBg: "black"
            }))
        }
        this.renders = renders;
    },
    async function () {
        if (this.data.length > 0)
            this.renders.forEach((render, i) => render.setData({
                headers: ["% Wait", "Read (B)", "Write (B)"],
                data: [
                    [this.data[i].percentQueue, this.data[i].readB, this.data[i].writeB]
                ]
            }));
    })