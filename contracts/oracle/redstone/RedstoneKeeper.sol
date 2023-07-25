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

    function tokens(uint256) external view returns (address);
}

contract RedstoneKeeper is MainDemoConsumerBase {
    address private immutable _fastPriceFeedAddress;
    address private immutable _eth_address;
    address private immutable _atom_address;
    uint256 public constant REDSTONE_PRECISION = 10 ** 8;
    uint256 public constant TOKEN_PRECISION = 10 ** 5;
    uint256 public constant PRECISON_DIFF =
        REDSTONE_PRECISION / TOKEN_PRECISION;

    constructor(
        address fastPriceFeedAddress,
        address eth_address,
        address atom_address
    ) {
        _fastPriceFeedAddress = fastPriceFeedAddress;
        _eth_address = eth_address;
        _atom_address = atom_address;
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

    function stringToBytes32(
        string memory source
    ) private pure returns (bytes32 result) {
        assembly {
            result := mload(add(source, 32))
        }
    }

    function getIds() private view returns (bytes32[] memory) {
        address[] memory tokens = getTokens();
        uint256 length = tokens.length;

        bytes32[] memory ids = new bytes32[](length);

        for (uint256 i = 0; i < length; i++) {
            if (tokens[i] == _eth_address) {
                ids[i] = stringToBytes32("ETH");
            } else if (tokens[i] == _atom_address) {
                ids[i] = stringToBytes32("ATOM");
            } else {
                revert("Unknown token");
            }
        }
        return ids;
    }

    function getTokens() private view returns (address[] memory) {
        uint256 length = getTokensLength();
        address[] memory tokens = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            tokens[i] = IFastPriceFeed(_fastPriceFeedAddress).tokens(i);
        }

        return tokens;
    }

    function getTokensLength() private view returns (uint256) {
        return 2;
        // uint256 length = 0;

        // while (true) {
        //     try IFastPriceFeed(_fastPriceFeedAddress).tokens(length)
        //     {
        //         length++;
        //     } catch (bytes memory) {
        //         break;
        //     }
        // }

        // return length;
    }
}
