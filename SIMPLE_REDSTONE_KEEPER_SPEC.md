# Simple RedStone Position Keeper

## Motivation
Current implementation of GMX contracts relies on so-called keppers:
- Price feed keepers, which are responsible for submitting prices rountinely for swaps
- Position Keepers, responsible for submitting prices when executing a position
 
You can read more about it [in the following doc (Price Feeds section).](https://gmx-io.notion.site/gmx-io/GMX-Technical-Overview-47fc5ed832e243afb9e97e8a4a036353)

So basically GMX contracts allow a speicific whitelisted addresses to update prices. We believe that it can be improved with the use of RedStone oracles, thanks to secure and battle-tested signature verification mechanism of oracle data. This mechanism will make the GMX contracts more trustless and reliable.

But this is the general vision. Within the current task we only want to make the first step towards the goal of implementing trustless Position keepers powered by RedStone Oracles.

## Description

We would like to implement few Node.js scripts in the scripts folder (you can create a subfolder `redstone` inside it).

Before starting to work on the task, please go through the GMX contracts and tests to understand the general idea and implementation.

### deploy-all.js
Should deploy and configure all the required contracts locally.

### redstone-position-keeper.js
It should call the `setPricesWithBitsAndExecute` function on the FastPriceFeed contract with the data fetched from [RedStone API](https://www.npmjs.com/package/redstone-api).

### redstone-keeper-demo.js
Kinda end-to-end demo script. It will deploy GMX contracts and run few test interations. It can have the following steps:
- Setting up GMX contracts
- Registering RedStone keepers
- Opening a position (from one account)
- Executing the position with the use of RedStone Oracle Data (from another account)

Please try to place common logic to a separate file and reuse it across different scripts.

You can get inspired by the draft version, that was [initiated here](https://github.com/redstone-finance/gmx-contracts/pull/1/files), but please work on a separate branch or your own fork.
