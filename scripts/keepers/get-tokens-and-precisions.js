const { getFastPriceFeedContract } = require("./common");

main();

async function main() {
  const contract = await getFastPriceFeedContract();
  const tokens = await contract.tokens();
  const precisions = await contract.tokenPrecisions();
  console.log({ tokens, precisions });
}
