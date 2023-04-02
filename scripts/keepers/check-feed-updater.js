const { getFastPriceFeedContract, SYMBOLS_WITH_PRECISION } = require("./common");

const ADDRESS_TO_CHECK = "0xD372947F3D0E308C9f77ae76f1eb4C94e6388a5d";

main();

async function main() {
  const contract = await getFastPriceFeedContract();
  const isUpdater = await contract.isUpdater(ADDRESS_TO_CHECK);
  console.log({ isUpdater });
}
