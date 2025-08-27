# Web Game Simulator

This project provides an interactive simulator with database-backed materials and physics-based defense calculations derived from real mechanical and thermal properties.

## Defense Calculations

Material properties like hardness, strength, density, and thermal or electrical behavior are translated into slashing, piercing, blunt, and elemental resistances using straightforward formulas. Each raw resistance value is normalized only against materials of the same type so metals are compared with metals and wood with wood. Armor thickness, biases, and optional magical attunements then adjust the normalized scores.

## Live demo

Visit [https://shmerrick.github.io/webgame/](https://shmerrick.github.io/webgame/) to use the simulator on GitHub Pages.

## Prerequisites

- [Node.js](https://nodejs.org/) (which includes npm)

## Installation

Install project dependencies:

```bash
npm install
```

## Development

Build the project:

```bash
npm run build
```

Run the test suite:

```bash
npm test
```

## Contribution Guidelines

Contributions are welcome! Please open an issue or submit a pull request. Ensure all builds and tests pass before proposing changes.
