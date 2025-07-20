const { exec: _exec } = require("child_process");
const { rimraf } = require("rimraf");
const { promisify } = require("util");
const { rename } = require("node:fs/promises");
const { readdir, mkdir } = require("fs/promises");
const path = require("path");
const exec = promisify(_exec);

// -----
// CONFIGURATION
// -----
const src = "build";
const dest = "dist";
const cmd = "craco build";

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

run();
async function run() {
    try {
        log(ESeverity.info, `Setting up ${dest} folder...`, EColors.grey);
        await rimraf(dest, { filter: (path) => !/\.git$/.test(path) });
    } catch (ex) {
        console.error("Setup failed", ex);
        return;
    }

    try {
        log(ESeverity.info, "Starting build...", EColors.grey);
        await exec(cmd);
    } catch (ex) {
        console.error("Build failed", ex);
        return;
    }

    try {
        log(ESeverity.info, `Moving ${src}...`, EColors.grey);
        const files = await readdir(src, { recursive: true, withFileTypes: true });
        for (const file of files) {
            const directory = path.relative(src, file.path);
            if (file.isDirectory()) {
                await mkdir(path.join(dest, directory, file.name), { recursive: true });
                continue;
            }
            const filepath = path.join(directory, file.name);
            await rename(path.join(src, filepath), path.join(dest, filepath));
        }
    } catch (ex) {
        console.error("Move failed", ex);
        return;
    }

    try {
        log(ESeverity.info, "Cleaning up...", EColors.grey);
        await rimraf(src);
    } catch (ex) {
        console.error("Cleanup failed", ex);
        return;
    }

    log(ESeverity.log, "Build finished. Don't forget to commit and push!", EColors.green);
}

function log(severity, message, color) {
    console[severity](`\u001b[${color}m${message}\u001b[0m`);
}