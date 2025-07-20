const { readdirSync } = require("node:fs");
const path = require("node:path");

const ESeverity = {
    log: "log",
    info: "info",
    warn: "warn",
    error: "error"
};
const EColors = {
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
    grey: 90,
};
function log(severity, message, color) {
    console[severity](`\u001b[${color}m${message}\u001b[0m`);
}

function getFiles(dir) {
    const dirents = readdirSync(dir, { withFileTypes: true });
    const files = dirents.map(dirent => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    });
    return files.flat();
}

exports.ESeverity = ESeverity;
exports.EColors = EColors;
exports.log = log;
exports.getFiles = getFiles;