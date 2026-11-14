# Green Cube Calculator

A small Green Cube calculator for the 54 hololive Dreams member boards. Select members or generations and apply 0, 5, 7, 9, or 11 green-node patterns. The side branches are included in the first five; 9 and 11 continue straight down after the first seven. Costs are 0 / 100 / 260 / 540 / 860 small Green Cubes.

Generation presets apply three 9-node boards for three-member generations, or three 9-node boards plus one 11-node board for four- and five-member generations. The allocation minimizes node changes from the current boards. The remaining member stays unchanged.

The live board reflects the selected members immediately. Presets update every selected member, and selection stays active for individual node tweaks. The board lights up every node owned by anyone selected. With multiple members selected, node badges show how many have each node unlocked. Clicking a partially unlocked node unlocks it only for members who need it. Clicking a shared unlocked node removes it and prunes disconnected nodes, preserving alternate connected routes.

The green-only board uses all 25 nodes and supports pan, zoom, and fit. Boards and inventory autosave in local storage. The compact roster scrolls by generation with equal-width member cards. Desktop board controls and totals remain visible while browsing members.

```sh
npm install
npm run dev -- --host 127.0.0.1
npm test
npm run check
```

Created with `npm create rail@latest -- --vite --npm --minimal --noRepo`.

Data and artwork were retrieved through holodori.best on November 14, 2026. All four board models share the green-node geometry and small-cube costs. Previews use the source's downward coordinate mapping, square grid, node frames, icons, stars, socket, sparkle links, and texture. Green Hexa is excluded. No live API or account login is required.
