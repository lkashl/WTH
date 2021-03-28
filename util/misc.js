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
        string += "B"
    } else if (string.length < 7) {
        string = Math.round(bytes / 1000) + "KB"
    } else if (string.length < 11) {
        string = Math.round(bytes / 1000000) + "MB"
    } else if (string.length < 15) {
        string = Math.round(bytes / 1000000000) + "GB"
    }

    return string;
}

module.exports = {
    forNumber, bytesToReadable
}