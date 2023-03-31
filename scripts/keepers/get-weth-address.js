const { contractAt } = require("../shared/helpers");

main();

async function main() {
  const contract = contractAt("Router", "0xdb07196Dd14f97b059EaA95228d2cb66A2808aC4");
  const wethAddress = await contract.gov();
  console.log({ wethAddress });
}
