const { interval, blessedEnabled, modules } = require('./config');

const modulePath = './stats/';
const blessed = require('blessed');
const contrib = require('blessed-contrib');

const layout = require('./layouts/default');

let screen, grid;
if (blessedEnabled) {
    screen = blessed.screen();

    grid = new contrib.grid({ rows: layout.master[0], cols: layout.master[1], screen: screen })

    screen.key(['escape', 'q', 'C-c'], function (ch, key) {
        return process.exit(0);
    });
}


const main = async () => {
    const modules = layout.enabledModules;
    const pMods = modules.map(module => require(`${modulePath}${module}`));
    await Promise.all(pMods.map((mod,i) => mod.init(layout.limits[modules[i]]), "test"));

    const poll = async () => {
        const updates = pMods.map(async (mod, i) => {
            await mod.collect();
            if (blessedEnabled) {
                await mod.prepareRender(grid, layout[modules[i]]);
                mod.renders.forEach(render => {
                    screen.append(render);
                })
                await mod.render();
            }
        });

        await Promise.all(updates);
        if (blessedEnabled) screen.render()

        setTimeout(() => poll(), interval);
    }
    poll();
}

main();
