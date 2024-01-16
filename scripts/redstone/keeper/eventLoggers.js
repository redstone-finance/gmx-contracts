function handleExecuteIncreasePositionEvent(
  account,
  path,
  indexToken,
  amountIn,
  minOut,
  sizeDelta,
  isLong,
  acceptablePrice,
  executionFee,
  blockGap,
  timeGap
) {
  logger.info(
    `ExecuteIncreasePosition: ${JSON.stringify({
      account,
      path,
      indexToken,
      amountIn,
      minOut,
      sizeDelta,
      isLong,
      acceptablePrice,
      executionFee,
      blockGap,
      timeGap,
    })}`
  );
}

function handleCancelIncreasePositionEvent(
  account,
  path,
  indexToken,
  amountIn,
  minOut,
  sizeDelta,
  isLong,
  acceptablePrice,
  executionFee,
  blockGap,
  timeGap
) {
  logger.info(
    `CancelIncreasePosition: ${JSON.stringify({
      account,
      path,
      indexToken,
      amountIn,
      minOut,
      sizeDelta,
      isLong,
      acceptablePrice,
      executionFee,
      blockGap,
      timeGap,
    })}`
  );
}

function handleExecuteDecreasePositionEvent(
  account,
  path,
  indexToken,
  collateralDelta,
  sizeDelta,
  isLong,
  receiver,
  acceptablePrice,
  minOut,
  executionFee,
  blockGap,
  timeGap
) {
  logger.info(
    `ExecuteDecreasePosition: ${JSON.stringify({
      account,
      path,
      indexToken,
      collateralDelta,
      sizeDelta,
      isLong,
      receiver,
      acceptablePrice,
      minOut,
      executionFee,
      blockGap,
      timeGap,
    })}`
  );
}

function handleCancelDecreasePositionEvent(
  account,
  path,
  indexToken,
  collateralDelta,
  sizeDelta,
  isLong,
  receiver,
  acceptablePrice,
  minOut,
  executionFee,
  blockGap,
  timeGap
) {
  logger.info(
    `CancelDecreasePosition: ${JSON.stringify({
      account,
      path,
      indexToken,
      collateralDelta,
      sizeDelta,
      isLong,
      receiver,
      acceptablePrice,
      minOut,
      executionFee,
      blockGap,
      timeGap,
    })}`
  );
}

module.exports = {
  handleExecuteIncreasePositionEvent,
  handleCancelIncreasePositionEvent,
  handleExecuteDecreasePositionEvent,
  handleCancelDecreasePositionEvent,
};
