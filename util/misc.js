const forNumber = (endAt, operation, startFrom) => {
    let breaker = false;
    startFrom = startFrom || 0;

    for (let j = startFrom; j < endAt; j++) {
        if (breaker) break;
        operation(j, () => breaker = true);
    }
}

module.exports = {
    forNumber
}