const redstone = require("redstone-api");

const {
  formatBytes32String,
} = require("ethers/lib/utils");

const { WrapperBuilder } = require("@redstone-finance/evm-connector");

const MAX_INCREASE_POSITIONS = 5;
const MAX_DECREASE_POSITIONS = 5;

async function fetchPrices(symbols) {
  const prices = await redstone.query().symbols(symbols).latest().exec({
    provider: "redstone",
  });
  console.log(
    `Prices from Redstone: ${JSON.stringify(
      symbols.map((symbol) => {
        return { symbol: symbol, price: prices[symbol].value };
      })
    )}`
  );
  return prices;
}

async function setPriceBitsAndOptionallyExecute(
  symbols,
  redstoneKeeper,
  positionRouter
) {
  console.log("Getting position queue");
  const positionQueue = await getPositionQueueLengths(positionRouter);
  console.log(`Position queue: ${JSON.stringify(positionQueue)}`);
  const timestamp = Math.floor(Date.now() / 1000);
  if (
    positionQueue.increaseKeysLength - positionQueue.increaseKeyStart > 0 ||
    positionQueue.decreaseKeysLength - positionQueue.decreaseKeyStart > 0
  ) {
    console.log(`Updating price bits for ${symbols}:  and executing positions`);
    const endIndexForIncreasePositions = positionQueue.increaseKeysLength;
    const endIndexForDecreasePositions = positionQueue.decreaseKeysLength;
    const wrappedRedstoneKeeper = WrapperBuilder.wrap(
      redstoneKeeper
    ).usingDataService({
      dataFeeds: symbols,
    });

    const tx = await wrappedRedstoneKeeper.setPricesWithBitsAndExecute(
      positionRouter.address, // _positionRouter
      timestamp, // _timestamp
      endIndexForIncreasePositions, // _endIndexForIncreasePositions
      endIndexForDecreasePositions, // _endIndexForDecreasePositions
      MAX_INCREASE_POSITIONS, // _maxIncreasePositions
      MAX_DECREASE_POSITIONS // _maxDecreasePositions
    );
    await tx.wait();
  } else {
    const wrappedRedstoneKeeper = await WrapperBuilder.wrap(
      redstoneKeeper
    ).usingDataService({
      dataFeeds: symbols,
    });
    console.log(`Updating price bits for ${symbols}`);
    const tx = await wrappedRedstoneKeeper.setPricesWithBits(
      timestamp
    );
    await tx.wait();
  }
}

async function getPositionQueueLengths(positionRouter) {
  const positionQueue = await positionRouter.getRequestQueueLengths();
  return {
    increaseKeyStart: positionQueue[0].toNumber(),
    increaseKeysLength: positionQueue[1].toNumber(),
    decreaseKeyStart: positionQueue[2].toNumber(),
    decreaseKeysLength: positionQueue[3].toNumber(),
  };
}
module.exports = {
  setPriceBitsAndOptionallyExecute,
  fetchPrices,
};
