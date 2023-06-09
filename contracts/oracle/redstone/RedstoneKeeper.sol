import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";
pragma solidity ^0.8.4;

interface IFastPriceFeed {
    function setPricesWithBitsAndExecute(
        address _positionRouter,
        uint256 _priceBits,
        uint256 _timestamp,
        uint256 _endIndexForIncreasePositions,
        uint256 _endIndexForDecreasePositions,
        uint256 _maxIncreasePositions,
        uint256 _maxDecreasePositions
    ) external;

    function setPricesWithBits(uint256 _priceBits, uint256 _timestamp) external;
}

contract RedstoneKeeper is MainDemoConsumerBase {
    address private immutable _fastPriceFeedAddress;
    uint256 public constant REDSTONE_PRECISION = 10 ** 8;
    uint256 public constant TOKEN_PRECISION = 10 ** 5;
    uint256 public constant PRECISON_DIFF =
        REDSTONE_PRECISION / TOKEN_PRECISION;

    constructor(address fastPriceFeedAddress) {
        _fastPriceFeedAddress = fastPriceFeedAddress;
    }

    function setPricesWithBitsAndExecute(
        address positionRouter,
        bytes32[] calldata dataFeedIds,
        uint256 timestamp,
        uint256 endIndexForIncreasePositions,
        uint256 endIndexForDecreasePositions,
        uint256 maxIncreasePositions,
        uint256 maxDecreasePositions
    ) external {
        uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
        uint256 priceBits = getPriceBits(values);
        IFastPriceFeed(_fastPriceFeedAddress).setPricesWithBitsAndExecute(
            positionRouter,
            priceBits,
            timestamp,
            endIndexForIncreasePositions,
            endIndexForDecreasePositions,
            maxIncreasePositions,
            maxDecreasePositions
        );
    }

    function setPricesWithBits(bytes32[] calldata dataFeedIds, uint256 timestamp) external {
        uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
        uint256 priceBits = getPriceBits(values);
        IFastPriceFeed(_fastPriceFeedAddress).setPricesWithBits(
            priceBits,
            timestamp
        );
    }

    function getPriceBits(
        uint256[] memory prices
    ) public view returns (uint256) {
        require(prices.length <= 8, "max prices.length exceeded");

        uint256 priceBits = 0;

        for (uint256 j = 0; j < 8; j++) {
            if (j >= prices.length) {
                break;
            }
            uint256 price = adaptPrecision(prices[j]);
            require(price <= 2147483648, "price exceeds bit limit");

            priceBits = priceBits | (price << (j * 32));
        }

        return priceBits;
    }

    // Temporary solution to adapt precision
    function adaptPrecision(uint256 number) private pure returns (uint256) {
        uint256 truncated = number / (PRECISON_DIFF / 10);
        uint256 remainder = truncated % 10;

        if (remainder >= 5) {
            truncated = (truncated / 10) + 1;
        } else {
            truncated = truncated / 10;
        }
        return truncated;
    }
}
