# Cube Garden

A small Green Cube calculator for the 54 hololive Dreams member boards. Select members and apply a connected 0, 5, 7, or 11 green-node preset. The total adds board investment and an optional unspent inventory balance. Progress stays in local storage; bulk changes can be undone.

```sh
npm install
npm run dev -- --host 127.0.0.1
npm test
npm run check
```

Created with `npm create rail@latest -- --vite --npm --minimal --noRepo`.

Data and images were retrieved through holodori.best on November 14, 2026. All four board models have identical first-11 green-node coordinates and costs. `src/board-data.json` preserves the roster, node coordinates, item costs, and source asset paths. Green Cube (`item-skill_tree_allmember-1`) costs are 0 / 100 / 260 / 700. Green Hexa (`item-skill_tree_allmember-2`), including the 50 required at node 11, is excluded. No live API or account login is needed.
