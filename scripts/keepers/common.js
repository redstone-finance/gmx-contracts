const { contractAt, sendTxn } = require("../shared/helpers");
const BN = require('bn.js')
const redstone = require("redstone-api");

// TODO: set
const POSITION_ROUTER_ADDRESS = "0xdb07196Dd14f97b059EaA95228d2cb66A2808aC4";
const FAST_PRICE_FEED_ADDRESS = "";

const SYMBOLS_WITH_PRECISION = [
  {symbol: "CANTO", precision: 1000},
  {symbol: "ETH", precision: 1000},
  {symbol: "ATOM", precision: 1000},
  {symbol: "USDC", precision: 1000},
  {symbol: "USDT", precision: 1000},
];

async function generatePriceBits(symbolsWithPrecisions) {
  const symbols = symbolsWithPrecisions.map(({symbol}) => symbol);
  const prices = await redstone.query().symbols(symbols).latest().exec({
    provider: "redstone"
  });

  const values = [];

  for (const { symbol, precision } of symbolsWithPrecisions) {
    const normalizedValue = normalizePrice(prices[symbol], precision);
    values.push(normalizedValue);
  }

  return getPriceBits(values);
}

function normalizePrice(price, precision) {
  return Math.round(price.value * precision);
}

function getPriceBits(prices) {
  if (prices.length > 8) {
    throw new Error("max prices.length exceeded")
  }

  let priceBits = new BN('0')

  for (let j = 0; j < 8; j++) {
    let index = j
    if (index >= prices.length) {
      break
    }

    const price = new BN(prices[index])
    if (price.gt(new BN("2147483648"))) { // 2^31
      throw new Error(`price exceeds bit limit ${price.toString()}`)
    }

    priceBits = priceBits.or(price.shln(j * 32))
  }

  return priceBits.toString()
}

async function getPositionRouterContract() {
  return await contractAt(
    "PositionRouter",
    POSITION_ROUTER_ADDRESS
  );
}

async function getFastPriceFeedContract() {
  return await contractAt(
    "FastPriceFeed",
    FAST_PRICE_FEED_ADDRESS
  );
}


module.exports = {
  generatePriceBits,
  normalizePrice,
  getPriceBits,
  getFastPriceFeedContract,
  getPositionRouterContract,

  SYMBOLS_WITH_PRECISION,
};
