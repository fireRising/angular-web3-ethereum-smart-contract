import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';

import { FormGroup, Validators, FormBuilder } from '@angular/forms';

declare let require: any;
const shop_artifacts = require('../../../../build/contracts/Shop.json');

export interface Element {
  position: number;
  name: string;
  description: string;
  price: string;
}

const ELEMENT_DATA: Element[] = [
  { position: 1, name: 'Standard', description: '50 GB available space', price: '1 eth'},
  { position: 2, name: 'Advanced', description: '500 GB available space', price: '2 eth'},
  { position: 3, name: 'Enterprise', description: '5 TB available space', price: '3 eth'}
];

@Component({
  selector: 'app-meta-sender',
  templateUrl: './meta-sender.component.html',
  styleUrls: ['./meta-sender.component.css']
})


export class MetaSenderComponent implements OnInit {
  isLinear = true;
  registerNext = true;
  buyNext = true;

  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  accounts: string[];
  MetaCoin: any;
  Shop: any;
  Test: Number;

  displayedColumns: string[] = ['position', 'name', 'description', 'price', 'action'];
  dataSource = ELEMENT_DATA;

  account: string;
  balance = 0;
  status = '';
  purchasedProduct = 'Not Yet Purchased';

  constructor(private web3Service: Web3Service, private matSnackBar: MatSnackBar, private _formBuilder: FormBuilder) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit() {
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
          this.setStatus('Order completed');
          this.refreshBalance();
          this.buyNext = false;
          this.secondFormGroup.controls['valid'].setErrors(null);
        });
        deployed.Register({}, (error, event) => {
          console.log('Register event came in');
          console.log(event);
          this.setStatus('Register success');
          this.registerNext = false;
        });
      });
    });

    this.firstFormGroup = this._formBuilder.group({
      userName: ['', Validators.required],
      userEmail: ['', Validators.required]
    });
    this.secondFormGroup = this._formBuilder.group({
      valid: ['', Validators.required]
    });
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.account = accounts[0];
      this.refreshBalance();
    });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  async refreshBalance() {
    console.log('Refreshing balance');

    try {
      console.log('Account', this.account);
      const that = this;
      await this.web3Service.getAccountInfo().then(function(acctInfo: any) {
        that.balance = acctInfo.balance;
      }).catch(function(error) {
        console.log(error);
      });
      console.log('Found balance: ' +  that.balance);
    } catch (e) {
      console.log(e);
      this.setStatus('Error getting balance; see log.');
    }
  }

  async userRegistration() {
    try {
      const deployedShop = await this.Shop.deployed();
      console.log(deployedShop);

      const userName = this.firstFormGroup.get('userName').value;
      const userEmail = this.firstFormGroup.get('userEmail').value;
      const regResult = await deployedShop.createAccount(userName, userEmail, {from: this.account});
      console.log('Register result = ' + regResult);
    } catch (e) {
      console.log(e);
      this.setStatus('Error registration; see log.');
    }
  }

  async buyProduct(numProd, amountEth, nameOfProduct) {
    if (!this.Shop) {
      this.setStatus('Shop is not loaded, unable to send transaction');
      return;
    }
    this.setStatus('Initiating transaction... (please wait)');
    try {
      const deployedShop = await this.Shop.deployed();
      const amount = amountEth;
      const prodNum = numProd;
      const receiver = await deployedShop.owner.call();
      console.log('Sending coins ' + amount + ' to ' + receiver);

      const transaction = await deployedShop.buyProduct(prodNum,
        {
          from: this.account,
          value: this.web3Service.web3.utils.toWei(amount, 'ether')
        });

      if (!transaction) {
        this.setStatus('Transaction failed!');
      } else {
        this.purchasedProduct = nameOfProduct;
        this.setStatus('Transaction complete!');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error sending coin; see log.');
    }
  }
}
