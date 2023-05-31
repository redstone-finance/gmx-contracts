const { getPriceBits } = require("../../../test/shared/utilities");
const redstone = require("redstone-api");

const MAX_INCREASE_POSITIONS = 5;
const MAX_DECREASE_POSITIONS = 5;

async function updatePriceBitsAndOptionallyExecute(
  symbolsWithPrecisions,
  fastPriceFeed,
  positionRouter,
  keeper
) {
  const priceBits = await fetchPriceBits(symbolsWithPrecisions);
  await setPriceBitsAndOptionallyExecute(
    priceBits,
    fastPriceFeed,
    positionRouter,
    keeper
  );
}

async function setPriceBitsAndOptionallyExecute(
  priceBits,
  fastPriceFeed,
  positionRouter,
  keeper
) {
  const positionQueue = await getPositionQueueLengths(positionRouter);
  const timestamp = Math.floor(Date.now() / 1000);
  if (
    positionQueue.increaseKeysLength - positionQueue.increaseKeyStart > 0 ||
    positionQueue.decreaseKeysLength - positionQueue.decreaseKeyStart > 0
  ) {
    const endIndexForIncreasePositions = positionQueue.increaseKeysLength;
    const endIndexForDecreasePositions = positionQueue.decreaseKeysLength;
    const tx = await fastPriceFeed
      .connect(keeper)
      .setPricesWithBitsAndExecute(
        positionRouter.address,
        priceBits,
        timestamp,
        endIndexForIncreasePositions,
        endIndexForDecreasePositions,
        MAX_INCREASE_POSITIONS,
        MAX_DECREASE_POSITIONS
      );
    await tx.wait();
  } else {
    const tx = await fastPriceFeed
      .connect(keeper)
      .setPricesWithBits(priceBits, timestamp);
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

async function fetchPrices(symbols) {
  const prices = await redstone.query().symbols(symbols).latest().exec({
    provider: "redstone",
  });
  return prices;
}

async function fetchPriceBits(symbolsWithPrecisions) {
  const symbols = symbolsWithPrecisions.map(({ symbol }) => symbol);
  const prices = await fetchPrices(symbols);
  const normalizedPrices = symbolsWithPrecisions.map(({ symbol, precision }) =>
    normalizePrice(prices[symbol], precision)
  );
  return getPriceBits(normalizedPrices);
}

function normalizePrice(price, precision) {
  return Math.round(price.value * precision);
}

module.exports = {
    updatePriceBitsAndOptionallyExecute,
};