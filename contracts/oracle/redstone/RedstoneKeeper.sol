pragma solidity ^0.8.4;
import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";

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

    function tokens(uint256) external view returns (address);
}

contract RedstoneKeeper is MainDemoConsumerBase {
    address private _fastPriceFeedAddress = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
    
    uint256 public constant REDSTONE_PRECISION = 10 ** 8;
    uint256 public constant TOKEN_PRECISION = 10 ** 5;
    uint256 public constant PRECISON_DIFF =
        REDSTONE_PRECISION / TOKEN_PRECISION;

    function getFastPriceFeedAddress() public view returns (address) {
        return _fastPriceFeedAddress;
    }

    function setPricesWithBitsAndExecute(
        address positionRouter,
        uint256 timestamp,
        uint256 endIndexForIncreasePositions,
        uint256 endIndexForDecreasePositions,
        uint256 maxIncreasePositions,
        uint256 maxDecreasePositions
    ) external {
        bytes32[] memory dataFeedIds = getIds();
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

    function setPricesWithBits(uint256 timestamp) external {
        bytes32[] memory dataFeedIds = getIds();
        uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
        uint256 priceBits = getPriceBits(values);
        IFastPriceFeed(_fastPriceFeedAddress).setPricesWithBits(
            priceBits,
            timestamp
        );
    }

    function getPriceBits(
        uint256[] memory prices
    ) public pure returns (uint256) {
        require(prices.length <= 8, "max prices.length exceeded");

        uint256 priceBits = 0;

        for (uint256 j = 0; j < 8; j++) {
            if (j >= prices.length) {
                break;
            }
            uint256 price = adaptPrecision(prices[j]);
            require(price < 4294967296, "price exceeds bit limit");

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

    function stringToBytes32(
        string memory source
    ) private pure returns (bytes32 result) {
        assembly {
            result := mload(add(source, 32))
        }
    }

    function getIds() private pure returns (bytes32[] memory) {
        bytes32[] memory ids = new bytes32[](2);
        ids[0] = stringToBytes32('ETH');
        ids[1] = stringToBytes32('ATOM');
        return ids;
    }
}
