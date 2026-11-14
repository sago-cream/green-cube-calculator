# Cube Garden

A small Green Cube calculator for the 54 hololive Dreams member boards. Select members or generations and apply 0, 5, 7, 9, or 11 green-node patterns. The side branches are included in the first five; 9 and 11 continue straight down after the first seven. Costs are 0 / 100 / 260 / 540 / 860 small Green Cubes.

Generation presets apply three 9-node boards for three-member generations, or three 9-node boards plus one 11-node board for four- and five-member generations. Plain Optimal preserves the fifth member's board; +5 and +7 explicitly set it. Choose the 11-node and fifth members individually.

Each member also has an interactive green-only board editor with all 25 nodes, pan/zoom, presets, path unlocking, node removal, undo, and save/cancel. Removing a node removes any nodes disconnected from the root. Alternate connected routes remain intact. Custom layouts are counted separately from named presets. Progress stays in local storage, including older saved numeric presets.

```sh
npm install
npm run dev -- --host 127.0.0.1
npm test
npm run check
```

Created with `npm create rail@latest -- --vite --npm --minimal --noRepo`.

Data and artwork were retrieved through holodori.best on November 14, 2026. All four board models share the green-node geometry and small-cube costs. Previews use the source's downward coordinate mapping, square grid, node frames, icons, stars, socket, sparkle links, and texture. Green Hexa is excluded. No live API or account login is required.
