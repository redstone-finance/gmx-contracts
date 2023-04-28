const redstone = require("redstone-api");
const {getPriceBits} = require("../../test/shared/utilities");

const MAX_INCREASE_POSITIONS = 5
const MAX_DECREASE_POSITIONS = 5

async function updatePriceBitsAndOptionallyExecute(symbolsWithPrecisions, fastPriceFeed, positionRouter, updater) {
  const priceBits = await fetchPriceBits(symbolsWithPrecisions)
  await setPriceBitsAndOptionallyExecute(priceBits, fastPriceFeed, positionRouter, updater)
}

async function fetchPrices(symbols) {
  const prices = await redstone.query().symbols(symbols).latest().exec({
    provider: "redstone"
  })
  console.log(`Prices from Redstone: ${JSON.stringify(symbols.map((symbol) => {return {symbol: symbol, price: prices[symbol].value}}))}`)
  return prices
}

async function fetchPriceBits(symbolsWithPrecisions) {
  console.log("Fetching prices")
  const symbols = symbolsWithPrecisions.map(({symbol}) => symbol)
  const prices = await fetchPrices(symbols)
  const normalizedPrices = symbolsWithPrecisions.map(({symbol, precision}) => normalizePrice(prices[symbol], precision))
  return getPriceBits(normalizedPrices)
}

async function setPriceBitsAndOptionallyExecute(priceBits, fastPriceFeed, positionRouter, updater) {
  console.log("Getting position queue")
  const positionQueue = await getPositionQueueLengths(positionRouter)
  console.log(`Position queue: ${JSON.stringify(positionQueue)}`)
  const timestamp = Math.floor(Date.now() / 1000)
  if(positionQueue.increaseKeysLength - positionQueue.increaseKeyStart > 0 || positionQueue.decreaseKeysLength - positionQueue.decreaseKeyStart> 0) {
    console.log(`Updating price bits: ${priceBits} and executing`)
    const endIndexForIncreasePositions = positionQueue.increaseKeysLength
    const endIndexForDecreasePositions = positionQueue.decreaseKeysLength
    const tx = await fastPriceFeed.connect(updater).setPricesWithBitsAndExecute(
      positionRouter.address,
      priceBits, // _priceBits
      timestamp, // _timestamp
      endIndexForIncreasePositions, // _endIndexForIncreasePositions
      endIndexForDecreasePositions, // _endIndexForDecreasePositions
      MAX_INCREASE_POSITIONS, // _maxIncreasePositions
      MAX_DECREASE_POSITIONS // _maxDecreasePositions
    )
    await tx.wait();
  } else {
    console.log(`Updating price bits: ${priceBits}`)
    const tx = await fastPriceFeed.connect(updater).setPricesWithBits(priceBits, timestamp)
    await tx.wait();
  }

}

async function getPositionQueueLengths(positionRouter) {
  const positionQueue = await positionRouter.getRequestQueueLengths()
  return {
    increaseKeyStart: positionQueue[0].toNumber(),
    increaseKeysLength: positionQueue[1].toNumber(),
    decreaseKeyStart: positionQueue[2].toNumber(),
    decreaseKeysLength: positionQueue[3].toNumber()
  }
}

function normalizePrice(price, precision) {
  return Math.round(price.value * precision);
}

module.exports = {
  updatePriceBitsAndOptionallyExecute,
  fetchPrices
}
