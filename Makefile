.PHONY: test

deploy:
	npx hardhat run scripts/redstone/deploy-all.js --network localhost

demo:
	npx hardhat run scripts/redstone/redstone-keeper-demo.js --network localhost

keeper:
ifeq ($(and $(WETH_CONTRACT_ADDRESS),$(ATOM_CONTRACT_ADDRESS),$(FAST_PRICE_FEED_CONTRACT_ADDRESS),$(POSITION_ROUTER_CONTRACT_ADDRESS),$(POSITION_UTILS_ADDRESS)),)
	$(error WETH_CONTRACT_ADDRESS,ATOM_CONTRACT_ADDRESS,FAST_PRICE_FEED_CONTRACT_ADDRESS,POSITION_ROUTER_CONTRACT_ADDRESS,POSITION_UTILS_ADDRESS environment variables need to be set)
endif
		npx hardhat run scripts/redstone/redstone-position-keeper.js --network localhost

node:
	npx hardhat node

test:
	npx hardhat test
