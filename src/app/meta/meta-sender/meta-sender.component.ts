import { Component, OnInit, ViewChild, NgModule } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';

import { MatTableDataSource } from '@angular/material/table';

declare let require: any;
const shop_artifacts = require('../../../../build/contracts/Shop.json');

@Component({
  selector: 'app-meta-sender',
  templateUrl: './meta-sender.component.html',
  styleUrls: ['./meta-sender.component.css']
})


export class MetaSenderComponent implements OnInit {
  accounts: string[];
  MetaCoin: any;
  Shop: any;
  Test: Number;

  model = {
    amount: 5,
    receiver: '',
    balance: 0,
    account: '',
    userName: '',
    userEmail: '',
    num: 0
  };

  status = '';

  dataSource;
  displayedColumns = [];

  columnNames = [
    {
      id: 'position',
      value: 'No.',
    },
    {
      id: 'name',
      value: 'Name',
    },
    {
      id: 'description',
      value: 'description',
    },
    {
      id: 'price',
      value: 'price',
    }
  ];

  constructor(private web3Service: Web3Service, private matSnackBar: MatSnackBar) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {
    console.log('OnInit: ' + this.web3Service);
    console.log(this);
    this.watchAccount();

    this.web3Service.artifactsToContract(shop_artifacts).then((ShopAbstraction) => {
      this.Shop = ShopAbstraction;
      this.Shop.deployed().then(deployed => {
        console.log(deployed);
        deployed.Transfer({}, (error, event) => {
          console.log('Transfer event came in, refreshing balance');
          console.log(event);
          this.refreshBalance();
        });
      });
    });

    this.displayedColumns = this.columnNames.map(x => x.id);
    this.createTable();
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.model.account = accounts[0];
      this.refreshBalance();
    });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  async sendCoin() {
    if (!this.Shop) {
      this.setStatus('Shop is not loaded, unable to send transaction');
      return;
    }
    this.setStatus('Initiating transaction... (please wait)');
    try {
      const deployedShop = await this.Shop.deployed();

      const amount = this.model.amount;
      const receiver = await deployedShop.owner.call();
      console.log('Sending coins ' + amount + ' to ' + receiver);

      const transaction = await deployedShop.buyProduct.sendTransaction(receiver, amount, {from: this.model.account});

      if (!transaction) {
        this.setStatus('Transaction failed!');
      } else {
        this.setStatus('Transaction complete!');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error sending coin; see log.');
    }
  }

  async refreshBalance() {
    console.log('Refreshing balance');

    try {
      const deployedShop = await this.Shop.deployed();
      console.log(deployedShop);
      console.log('Account', this.model.account);
      await this.web3Service.web3.eth.getBalance(this.model.account).then(value => {
        this.model.balance = this.web3Service.web3.utils.fromWei(value, 'ether');
      });
      console.log(this.web3Service.web3);
      console.log('Found balance: ' +  this.model.balance);

      const owner = await deployedShop.owner.call();
      console.log('owner = ' + owner);
    } catch (e) {
      console.log(e);
      this.setStatus('Error getting balance; see log.');
    }
  }

  async userRegistration() {

  }

  setAmount(e) {
    console.log('Setting amount: ' + e.target.value);
    this.model.amount = e.target.value;
  }

  setReceiver(e) {
    console.log('Setting receiver: ' + e.target.value);
    this.model.receiver = e.target.value;
  }

  setUserName(e) {
    console.log('Setting user name: ' + e.target.value);
    this.model.userName = e.target.value;
  }

  setUserEmail(e) {
    console.log('Setting user email: ' + e.target.value);
    this.model.userEmail = e.target.value;
  }

  setNum(e) {
    console.log('Setting num: ' + e.target.value);
    this.model.num = e.target.value;
  }

  createTable() {
    const tableArr: Element[] = [
      { position: 1, name: 'Standard', description: '50 GB available space', price: '1 eth' },
      { position: 2, name: 'Advanced', description: '500 GB available space', price: '2 eth' },
      { position: 3, name: 'Enterprise', description: '5 TB available space', price: '3 eth' }
    ];

    this.dataSource = new MatTableDataSource(tableArr);
  }
}

export interface Element {
  position: number;
  name: string;
  description: string;
  price: string;
}
