const { interval, modules } = require('./config');

const modulePath = './stats/';
const blessed = require('blessed');
const contrib = require('blessed-contrib');

const layout = require('./layouts/default');
const { forNumber } = require('./util/misc');
const { appendFile } = require('./util/file');

let screen, grid, logGen, logPerf, logErr;
screen = blessed.screen();

grid = new contrib.grid({
    rows: layout.master[0], cols: layout.master[1], screen: screen,
})

if (layout.internalStats) {
    logGen = grid.set(...layout.internalStats.gen, contrib.log, { fg: "green", selectedFg: "green", label: "General Log" })
    logPerf = grid.set(...layout.internalStats.perf, contrib.log, { fg: "gray", selectedFg: "green", label: "Performance Log" })
    logErrActual = grid.set(...layout.internalStats.err, contrib.log, { fg: "red", selectedFg: "green", label: "Error Log" })

    logErr = {};
    logErr.log = async (message, err, state) => {
        logErrActual.log(message);
        if (!err && !state) return;
        const stack = err.stack.split("\n");
        forNumber(2, (i) => logErrActual.log(stack[i]), 0);
        state = await state;
        appendFile(`./logs/${state._name}.txt`, JSON.stringify(state) + "\n");
    }

    screen.key(['escape', 'q', 'C-c'], function (ch, key) {
        return process.exit(0);
    });
}


const main = async () => {
    const modules = layout.enabledModules;
    const pMods = modules.map(module => require(`${modulePath}${module}`));
    pMods.forEach((pMod, i) => pMod._name = modules[i]);

    // Let modules instantiate and tally individually
    const functioningModules = [];
    const disabledModules = [];

    let flags = {
        pollInitialised: false,
        promisesReturned: false,
    }

    const poll = async () => {
        const trimFailing = [];
        const updates = functioningModules.map(async (mod, i) => {
            try {
                await mod.phase("collect");

                if (!flags.pollInitialised || mod._forceRerender) {
                    mod._forceRerender = false;
                    mod.phase("prepareRender", grid, layout[mod._name]);
                    mod._renders.forEach(render => {
                        screen.remove(render);
                        screen.append(render);
                    })
                }

                await mod.phase("render");
                //if (logPerf) logPerf.log(`${mod._name} ${mod._performance.join(", ")}`)

            } catch (err) {
                // If any of the components from render to collect fail then flag this module as unstable
                if (logErr) logErr.log("Failed poll", err, mod.returnDebugState())
                mod._failures++;
                if (mod._failures > 3) trimFailing.push({ i, err, mod });
            }
        });

        
        await Promise.all(updates);
        trimFailing.forEach(mod => {
            disabledModules.push({ mod: functioningModules.splice(mod.i, 1), err: mod.err });
            logErr.log(`${mod.mod._name} module disabled due to failures`)
        });
        if (!flags.pollInitialised) flags.pollInitialised = true;
        screen.render()

        setTimeout(() => poll(), interval);
    }

    // Don't use promise all so failing modules can more neatly be intercepted
    pMods.map((mod, i) => mod.phase("init", layout.limits[modules[i]])
        .then(() => {
            if (logGen) logGen.log("Init " + mod._name)
            functioningModules.push(mod);
        })
        .catch((err) => {
            // Write out error to log render
            if (logErr) logErr.log("Failed init: " + mod._name, err, mod.returnDebugState())
            disabledModules.push({ mod, err })
        })
        .then(() => {
            if (functioningModules.length + disabledModules.length === pMods.length && !flags.promisesReturned) {
                flags.promisesReturned = true;
                poll();
            }
        }));
}

main();
