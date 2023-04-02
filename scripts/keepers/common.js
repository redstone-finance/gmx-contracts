const { contractAt, sendTxn, signers } = require("../shared/helpers");
const BN = require('bn.js')
const redstone = require("redstone-api");
const { providers } = require("../shared/helpers");

const POSITION_ROUTER_ADDRESS = "0xA4004A335429cf9d1eE148ccF822fE63741D597D";
const FAST_PRICE_FEED_ADDRESS = "0x5dE1cFC7dB4f10181604D2847681f0aBaDBeA174";

const SYMBOLS_WITH_PRECISION = [
  { symbol: "ETH", address: "0xCa03230E7FB13456326a234443aAd111AC96410A", precision: 1000 },
  { symbol: "CANTO", address: "0x04a72466De69109889Db059Cb1A4460Ca0648d9D", precision: 1000 },
  { symbol: "ATOM", address: "0x40E41DC5845619E7Ba73957449b31DFbfB9678b2", precision: 1000 },
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
    FAST_PRICE_FEED_ADDRESS,
    signers.canto
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
