// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ProductRegistry is Ownable {
    enum ProductState { Minted, InMarket, Active, Flagged }
 
    struct Product {
        string productId;
        string serialNumber;
        uint256 manufactureDate;
        uint256 timeToHub; // Max hours to reach hub
        string destination;
        string metadataHash;
        ProductState state;
        string flagReason;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(string => Product) private products;
    string[] private productIds;

    event ProductMinted(
        string productId, 
        string serialNumber, 
        uint256 manufactureDate, 
        string destination, 
        string metadataHash
    );
    event ProductStatusChanged(string productId, ProductState state, string reason);

    constructor() Ownable(msg.sender) {}

    function mintProduct(
        string memory _productId, 
        string memory _serialNumber,
        uint256 _manufactureDate,
        uint256 _timeToHub,
        string memory _destination,
        string memory _metadataHash
    ) public onlyOwner {
        require(bytes(products[_productId].productId).length == 0, "Product already exists");

        products[_productId] = Product({
            productId: _productId,
            serialNumber: _serialNumber,
            manufactureDate: _manufactureDate,
            timeToHub: _timeToHub,
            destination: _destination,
            metadataHash: _metadataHash,
            state: ProductState.Minted,
            flagReason: "",
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        productIds.push(_productId);
        emit ProductMinted(_productId, _serialNumber, _manufactureDate, _destination, _metadataHash);
    }

    function updateState(string memory _productId, uint8 _state) public onlyOwner {
        require(bytes(products[_productId].productId).length > 0, "Product does not exist");
        require(_state <= uint8(ProductState.Flagged), "Invalid state");

        products[_productId].state = ProductState(_state);
        products[_productId].updatedAt = block.timestamp;

        emit ProductStatusChanged(_productId, ProductState(_state), "");
    }

    function flagProduct(string memory _productId, string memory _reason) public onlyOwner {
        require(bytes(products[_productId].productId).length > 0, "Product does not exist");

        products[_productId].state = ProductState.Flagged;
        products[_productId].flagReason = _reason;
        products[_productId].updatedAt = block.timestamp;

        emit ProductStatusChanged(_productId, ProductState.Flagged, _reason);
    }

    function getProduct(string memory _productId) public view returns (
        string memory productId,
        string memory serialNumber,
        uint256 manufactureDate,
        uint256 timeToHub,
        string memory destination,
        string memory metadataHash,
        ProductState state,
        string memory flagReason,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        require(bytes(products[_productId].productId).length > 0, "Product does not exist");
        Product memory p = products[_productId];
        return (
            p.productId, 
            p.serialNumber, 
            p.manufactureDate, 
            p.timeToHub,
            p.destination, 
            p.metadataHash, 
            p.state, 
            p.flagReason, 
            p.createdAt, 
            p.updatedAt
        );
    }
}
