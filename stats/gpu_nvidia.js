const GenericTask = require('../classes/GenericTask');
const { readFile } = require('../util/file');
const contrib = require('blessed-contrib');
const { getColors } = require('../util/colors');
const { trigger } = require('../util/process');
const { storeAsTimeSeries } = require('../util/misc');
const { columnSpacing } = require('../util/render');
const { isDebug } = require('../util/env');
const { intervals } = require('../config');


/*
DATA STRUCTURE: 
[
    gpux[...statsxTime], 
    corex+1[...statsxTime]
]
*/

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
        let rawData;
        if (isDebug) rawData = await (await readFile('./logs/gpu_nvidia.replica')).toString()
        else rawData = await trigger(this.execPath)

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
    async returnDebugState(stage) {
        if (isDebug) rawData = await (await readFile('./logs/gpu_nvidia.replica')).toString()
        else rawData = await trigger(this.execPath)
        
        return {
            data: this._data,
            source: rawData
        }
    },
    expose() {
        return {
            data: this._data
        };
    }
})