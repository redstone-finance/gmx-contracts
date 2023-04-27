const {deployAll, UPDATER_1, UPDATER_2, addFastPriceFeedUpdaters, USER_1, POSITION_ROUTER_EXECUTION_FEE} = require("./deploy-common");
const {updatePriceBitsAndExecute, SYMBOLS_WITH_PRECISIONS} = require("./keeper-common");
const {expandDecimals} = require("../../test/shared/utilities");
const {toUsd} = require("../../test/shared/units");

async function main() {
  const {positionRouter, router, fastPriceFeed, weth, atom} = await deployAll()
  await addFastPriceFeedUpdaters(fastPriceFeed, [UPDATER_1.address, UPDATER_2.address])
  await updatePriceBitsAndExecute(SYMBOLS_WITH_PRECISIONS, fastPriceFeed, positionRouter, UPDATER_1)
  await openPosition(positionRouter, router, weth, atom)
}

async function openPosition(positionRouter, router, collateralToken, indexToken) {
  console.log("Increasing position")

  await router.connect(USER_1).approvePlugin(positionRouter.address)
  await collateralToken.connect(USER_1).approve(router.address, expandDecimals(1, 18))

  const tx = await positionRouter.connect(USER_1).createIncreasePosition(
    [collateralToken.address], // _path
    indexToken.address, // _indexToken
    expandDecimals(1, 18), // _amountIn
    0, // _minOut
    toUsd(6000), // _sizeDelta
    true, // _isLong
    toUsd(10_000), // _acceptablePrice,
    POSITION_ROUTER_EXECUTION_FEE, // _executionFee
    ethers.constants.HashZero, // _referralCode
    ethers.constants.AddressZero, // _callbackTarget
    { value: POSITION_ROUTER_EXECUTION_FEE } // msg.value
  )
  await tx.wait()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
