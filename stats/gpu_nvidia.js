const GenericTask = require('../classes/GenericTask');
const { readFile } = require('../util/file');
const contrib = require('blessed-contrib');
const { getColors } = require('../util/colors');
const { trigger } = require('../util/process');
const { storeAsTimeSeries } = require('../util/misc');
const { columnSpacing } = require('../util/render');

/*
DATA STRUCTURE: 
[
    gpux[...statsxTime], 
    corex+1[...statsxTime]
]
*/

const intervals = 1;

const throttleReasons = ["clocks_throttle_reasons.gpu_idle", "clocks_throttle_reasons.sw_power_cap", "clocks_throttle_reasons.hw_slowdown", "clocks_throttle_reasons.hw_thermal_slowdown", "clocks_throttle_reasons.hw_power_brake_slowdown", "clocks_throttle_reasons.sw_thermal_slowdown", "clocks_throttle_reasons.sync_boost"];

const nv_address = ["name", "pcie.link.gen.current", "pcie.link.width.current", "fan.speed", "pstate", ...throttleReasons, "memory.total", "memory.used", "memory.free", "utilization.gpu", "utilization.memory", "temperature.gpu", "temperature.memory", "power.draw", "power.limit", "clocks.current.graphics", "clocks.current.sm", "clocks.current.memory", "clocks.current.video"]

const nv_params = nv_address.join(",");

module.exports = new GenericTask({
    init() {
        this.execPath = `nvidia-smi --query-gpu=${nv_params} --format=csv,noheader,nounits`
        this._data = [];
    },
    async collect() {
        // Collect data
        let rawData = await (await readFile('./logs/gpu_nvidia.replica')).toString();
        rawData = rawData.split('\n');

        rawData.forEach((gpu, gpuI) => {
            const data = {};
            if (!gpu) return;

            gpu.split(", ").forEach((val, i) => {
                if (val === "Not Active") val = 0
                else if (val === "Active") val = 1
                else if (val === "N/A") val = 0
                else if (val === "[N/A]") val = 0

                let treatedVal = Number.parseFloat(val);
                if (Number.isNaN(treatedVal)) treatedVal = val;
                if (nv_address[i] === "name") treatedVal = treatedVal.replace("GeForce", "");

                const isThrottle = throttleReasons.indexOf(nv_address[i]) > -1;
                if (isThrottle && val === 1) {
                    const reason = nv_address[i].split(".")
                    data.throttle = reason[reason.length - 1]
                } else if (!isThrottle) {
                    data[nv_address[i]] = treatedVal
                }
            })

            if (!data.throttle) data.throttle = "None"
            storeAsTimeSeries(this._data, gpuI, data, intervals);
        })
    },
    async prepareRender(grid, [y, x, yw, xw]) {
        const renders = [];
        renders.push(grid.set(y, x, yw, xw, contrib.table, {
            label: `${this._data[0][0].name} [${this._data[0][0]['memory.total']}Mb] [${this._data[0][0]['power.limit']}W]`,
            columnWidth: [16, 8],
            columnSpacing: 3,
            keys: true,
            fg: "black",
            selectedFg: "foreground",
            selectedBg: "foreground",
            bold: false
        }))
        this._renders = renders;
    },
    async render() {
        if (this._data.length > 0) {
            const gpu = this._data[0];
            const data = gpu[gpu.length - 1];

            const spacer = [' ', ' '];
            const vals = [
                [`Throttle [${data.pstate}]`, data.throttle],
                ['Util (Core)', data['utilization.gpu'] + "%"],
                ['Util (Mem)', data['utilization.memory'] + "%"],
                ['Power Draw', data['power.draw']],
                spacer,
                ['Temp Core/Mem', data['temperature.gpu'] + "/" + data['temperature.memory']],
                ["Fan Speed", data['fan.speed'] + "%"],
                spacer,
                ['Clock', data['clocks.current.graphics']],
                ['Clock (mem)', data['clocks.current.memory']],
                ['Clock (vid)', data['clocks.current.video']],
                ['Clock (sm)', data['clocks.current.sm']],
                spacer,
                ['VRAM Used/Free', data['memory.used'] + "/" + data['memory.free']],
                spacer,
                ['PCI Gen/Width',"G"+ data['pcie.link.gen.current'] + "/" + data['pcie.link.width.current']+ "x"]

            ]

            this._renders[0].setData({
                headers: spacer,
                data: vals
            });
        }
    },
    async returnDebugState(stage) {
        return {};
        const source = (await readFile(this.filePath)).toString();
        return {
            headings: this.headings,
            range: this.range,
            source
        }
    }
})