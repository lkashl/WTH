const forNumber = (endAt, operation, startFrom) => {
    let breaker = false;
    startFrom = startFrom || 0;

    for (let j = startFrom; j < endAt; j++) {
        if (breaker) break;
        operation(j, () => breaker = true);
    }
}

const bytesToReadable = (bytes) => {
    let string = bytes.toString();

    if (string.length < 3) {
        string = Math.round(bytes) + "B"
    } else if (string.length < 7) {
        string = Math.round(bytes / 1000) + "KB"
    } else if (string.length < 11) {
        string = Math.round(bytes / 1000000) + "MB"
    } else if (string.length < 15) {
        string = Math.round(bytes / 1000000000) + "GB"
    }

    return string;
}

const executeToStore = {};
const executeTo = async (alias, funct, target = 1) => {
    if (executeToStore[alias] === undefined) executeToStore[alias] = 0;
    if (executeToSTore[alias] < target) await funct();
    executeToStore[alias]++;
}

// Assumes a time store as a two dimensional array
// Hardware ID is the first locator
// Each time interval is expressed as an entry within hardware ID
// This should be the standard access pattern to support switching between time series and in moment data

const storeAsTimeSeries = (data, hardwareIndex, entries, intervals) => {
    if (!data[hardwareIndex]) data[hardwareIndex] = [];
    let current = data[hardwareIndex];
    // If we already have sufficient data, splice to the new entries
    if (current.length === intervals) current.splice(0, 1);
    current.push(entries);
    return data;
}

module.exports = {
    forNumber, bytesToReadable, executeTo, storeAsTimeSeries
}