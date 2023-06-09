const {deployAll} = require("./setup-common");

async function main() {
  const deployResult = await deployAll()
  console.log("\nDeployed contracts. Environment variables to use in keeper script:")
  console.log(`export WETH_CONTRACT_ADDRESS=${deployResult.weth.address}`)
  console.log(`export ATOM_CONTRACT_ADDRESS=${deployResult.atom.address}`)
  console.log(`export FAST_PRICE_FEED_CONTRACT_ADDRESS=${deployResult.fastPriceFeed.address}`)
  console.log(`export POSITION_ROUTER_CONTRACT_ADDRESS=${deployResult.positionRouter.address}`)
  console.log(`export POSITION_UTILS_ADDRESS=${deployResult.positionUtils.address}`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
