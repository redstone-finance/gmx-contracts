const BN = require('bn.js')
const redstone = require("redstone-api");

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

module.exports = {
  generatePriceBits,
  normalizePrice,
  getPriceBits,
};
