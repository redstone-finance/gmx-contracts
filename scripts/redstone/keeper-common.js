const redstone = require("redstone-api");
const {getPriceBits} = require("../../test/shared/utilities");

const MAX_INCREASE_POSITIONS = 8
const MAX_DECREASE_POSITIONS = 8

async function updatePriceBitsAndExecute(symbolsWithPrecisions, fastPriceFeed, positionRouter, updater) {
  const priceBits = await fetchPriceBits(symbolsWithPrecisions)
  await setPriceBitsAndExecute(priceBits, fastPriceFeed, positionRouter, updater)
}

async function fetchPriceBits(symbolsWithPrecisions) {
  console.log(`Fetching prices: ${JSON.stringify(symbolsWithPrecisions)}`)
  const symbols = symbolsWithPrecisions.map(({symbol}) => symbol)
  const prices = await redstone.query().symbols(symbols).latest().exec({
    provider: "redstone"
  })
  console.log(`Prices from Redstone: ${JSON.stringify(symbolsWithPrecisions.map(({symbol}) => {return {symbol: symbol, price: prices[symbol].value}}))}`)
  const normalizedPrices = symbolsWithPrecisions.map(({symbol, precision}) => normalizePrice(prices[symbol], precision))
  return getPriceBits(normalizedPrices)
}

async function setPriceBitsAndExecute(priceBits, fastPriceFeed, positionRouter, updater) {
  console.log(`Updating price bits: ${priceBits} and executing`)
  const timestamp = Math.floor(Date.now() / 1000)
  //TODO: fetch
  const endIndexForIncreasePositions = 1
  const endIndexForDecreasePositions = 1
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
}

function normalizePrice(price, precision) {
  return Math.round(price.value * precision);
}

module.exports = {
  updatePriceBitsAndExecute,
}
