// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

contract NFTMarket is ReentrancyGuard, KeeperCompatibleInterface {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    //Time interval between payments
    uint256 public immutable interval;
    //When Rent is to expire
    uint256[] public expireTimeStamp;
    uint256[] public storedItemIds;
    address[] public storedNftContract;
    address[] public storedOwnerAddress;
    uint256[] public storedTokenId;
    
    //Called by Chainlink Keepers to check if work needs to be done
    function checkUpkeep(
        bytes calldata checkData
    ) external override returns (bool upkeepNeeded, bytes memory performData) {
        //check if current timestamp >= the expiring date
        bool isKeepNeeded = false;
        for(uint i = 0; i < expireTimeStamp.length; i++) {
            if(block.timestamp >= expireTimeStamp[i]) {
                string memory currentIndex = Strings.toString(i);
                bytes memory currentIndexBytes = bytes(currentIndex); 
                performData = currentIndexBytes; 
                isKeepNeeded = true;
                break;
            }
        }
        upkeepNeeded = isKeepNeeded;
    }

    function sliceUint(bytes memory bs, uint start) internal pure returns (uint) {
        require(bs.length >= start + 32, "slicing out of range");
        uint x;
        assembly {
            x := mload(add(bs, add(0x20, start)))
        }
        return x;
    }

    //Called by Chainlink Keepers to handle work
    function performUpkeep(bytes calldata performData) external override {
        uint i = sliceUint(performData, 0);//Strings.toString(performData);
        
        uint256 _itemId = storedItemIds[i]; //get the item id
        uint256 price = idToMarketItem[_itemId].price; //get the item price

        delete idToMarketItem[_itemId]; //delete the item

        //create a new item with the same item id
        idToMarketItem[_itemId] = MarketItem(
            _itemId,
            storedNftContract[i],
            storedTokenId[i],
            payable(storedOwnerAddress[i]),
            payable(address(0)),
            price,
            false,
            true,
            ''
        );

        //delete array object
        delete expireTimeStamp[i];
        delete storedNftContract[i];
        delete storedTokenId[i];
        delete storedItemIds[i];
    }

    address payable owner;
    uint256 listingPrice = 0.025 ether;

    constructor(uint updateInterval) {
        owner = payable(msg.sender);
        interval = updateInterval;
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
        bool isBuy; //default is buy = true
        string expiredDate;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold,
        bool isBuy,
        string expiredDate
    );

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false,
            true,
            ''
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(itemId, nftContract, tokenId, msg.sender, address(0), price, false, true, '');

    }

    function createMarketSale(
        address nftContract,
        uint256 itemId,
        uint256 pType,
        string memory expiredDate,
        uint256 timeToExpire
    ) public payable nonReentrant {
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;
        address itemOwner = idToMarketItem[itemId].owner;
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");

        
        idToMarketItem[itemId].seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        idToMarketItem[itemId].isBuy = (pType == 1) ? true : false;
        idToMarketItem[itemId].expiredDate = expiredDate;
        _itemsSold.increment();
        payable(owner).transfer(listingPrice);
        if(pType == 0) { //i.e to rent
            storedNftContract.push(nftContract);
            expireTimeStamp.push(timeToExpire);
            storedTokenId.push(tokenId);
            storedOwnerAddress.push(itemOwner);
        }
    }

    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);

        for(uint i = 0; i < itemCount; i++) {
            if(idToMarketItem[i+1].owner == address(0)) {
                uint currentId = idToMarketItem[i+1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for(uint i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i+1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for(uint i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i+1].owner == msg.sender) {
                uint currentId = idToMarketItem[i+1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return items;

    }

    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for(uint i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i+1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for(uint i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i+1].seller == msg.sender) {
                uint currentId = idToMarketItem[i+1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return items;
    }
}