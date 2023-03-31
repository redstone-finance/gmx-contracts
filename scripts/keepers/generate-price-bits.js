const common = require("./common.js");

const SYMBOLS_WITH_PRECISION = [
  {symbol: "CANTO", precision: 1000},
  {symbol: "ETH", precision: 1000},
  {symbol: "ATOM", precision: 1000},
  {symbol: "USDC", precision: 1000},
  {symbol: "USDT", precision: 1000},
];

main();

async function main() {
  const priceBits = await common.generatePriceBits(SYMBOLS_WITH_PRECISION);
  console.log({ priceBits: priceBits.toString(16) });
}
