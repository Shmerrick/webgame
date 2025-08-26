# AI Programmer Instructions

- **No Python:** This project uses JavaScript tooling only. Do not add, modify, or rely on Python code, scripts, or dependencies.
- Use JavaScript or TypeScript for any new code.
- Before committing changes, run available project checks such as `npm test` (if defined) and `npm run build`.

## Hosting

Ensure the site functions both when served locally and when deployed to GitHub Pages. Prefer relative paths so all pages can access shared data files in either environment.

## Project Scope

This repository powers a public web companion for an open-world MMORPG and will later host C++ classes integrated with Unreal Engine 5.6+. Keep all pages pulling from the same database files so future game code and website remain in sync.

## Agent Log

- Verified three bug-check passes by running syntax checks on key scripts (`public/crafting_calculator.js`, `public/siege_calculator.js`, `src/simulator.jsx`).

## Programming Principles

Follow these practices while coding and reviewing code:

- KISS (Keep It Simple, Stupid)
- DRY (Don't Repeat Yourself)
- YAGNI (You Aren't Gonna Need It)
- SOLID
- Separation of Concerns (SoC)
- Avoid Premature Optimization
- Law of Demeter
