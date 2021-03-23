const supportedColors = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
const randomColor = () => {
    return [Math.random() * 255, Math.random() * 255, Math.random() * 255];
}

const getColors = (i) => {
    if (i === "rand") {
        i = Math.round(Math.random() * supportedColors.length);
        return supportedColors[i];
    }

    if (i) return supportedColors[i];

    return supportedColors;
}

module.exports = {
    randomColor, getColors
}