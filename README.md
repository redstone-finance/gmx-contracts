# GMX Contracts
Contracts for GMX integrated with Redstone.

Docs at https://gmxio.gitbook.io/gmx/contracts.

## Install Dependencies
If npx is not installed yet:
`npm install -g npx`

Install packages:
`npm i`

## Set variables
Add `env.json` and set variables required by hardhat eg. `env-template.json`

## Compile Contracts
`npx hardhat compile`

## Run Tests
`npx hardhat test`

## Run Redstone scripts
Makefile installed is recommended for simplicity
- Setup local node e.g. by `make node`

Then in another terminal tab
- To run demo script - `make demo`