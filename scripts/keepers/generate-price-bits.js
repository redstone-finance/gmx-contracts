const common = require("./common.js");

main();

async function main() {
  const priceBits = await common.generatePriceBits(common.SYMBOLS_WITH_PRECISION);
  console.log({ priceBits: priceBits.toString(16) });
}
