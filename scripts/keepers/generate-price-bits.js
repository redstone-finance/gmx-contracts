const common = require("./common.js");

const SYMBOLS = ["CANTO", "ETH", "ATOM", "USDC", "USDT"];

main();

async function main() {
  const priceBits = await common.generatePriceBits(SYMBOLS);
  console.log({ priceBits });
}
