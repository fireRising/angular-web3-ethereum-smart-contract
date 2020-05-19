pragma solidity ^0.5.16;

contract Shop {
  address payable public owner;
  uint id;
  uint purchaseId;
  product[] public allProducts;

  event Transfer(address indexed _from, string _productName, uint _purchaseId);
  event Register(address indexed _from);

  constructor() public {
    owner = msg.sender;

    // добавление продуктов
    product memory prod = product(0, "Basic plan", 1 ether, "50 GB available space");
    products[0] = prod;
    allProducts.push(prod);
    prod = product(1, "Advanced plan", 2 ether, "500 GB available space");
    products[1] = prod;
    allProducts.push(prod);
    prod = product(2, "Enterprise plan", 3 ether, "5 TB available space");
    products[2] = prod;
    allProducts.push(prod);
  }

  struct product {
      uint productId;
      string productName;
      uint price;
      string description;
  }
  struct ordersPlaced {
      string productId;
      uint purchaseId;
      address orderedBy;
  }
  struct user {
      string name;
      string email;
      bool isCreated;
  }
  struct orders {
      uint productId;
      string orderStatus;
      uint purchaseId;
  }

  mapping (uint => product) products;
  mapping (address=> user) users;
  mapping (address=>orders[]) userOrders;

  function createAccount(string memory _name, string memory _email) public {
    require(users[msg.sender].isCreated == false, "You are already registered");

    users[msg.sender].name = _name;
    users[msg.sender].email = _email;
    users[msg.sender].isCreated = true;

    emit Register(msg.sender);
  }

  function buyProduct(uint _productId) public payable {
    require(msg.value == products[_productId].price, "Value Must be Equal to Price of Product");
    require(users[msg.sender].isCreated, "You Must Be Registered to Buy");

    purchaseId = id++;
    orders memory order = orders(_productId, "Order not finished", purchaseId);

    owner.transfer(msg.value);

    order.orderStatus = "Order finished";
    userOrders[msg.sender].push(order);

    emit Transfer(msg.sender, products[_productId].productName, purchaseId);
  }

  function myOrders (uint _index) public view returns(uint, string memory, uint) {
    return(
      userOrders[msg.sender][_index].productId,
      userOrders[msg.sender][_index].orderStatus,
      userOrders[msg.sender][_index].purchaseId
    );
  }

  function getAccountBalance() public view returns (uint) {
    return msg.sender.balance;
  }
}
