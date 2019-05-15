# TechMarketplace: A Sample App Utilizing Quorum
![TechMarketplace](TechMarketplace.PNG)

TechMarketplace is an example application running on top of a Quorum network which allows users to bid for and offer virtual hackathon gear for sale in an interactive marketplace. This app is based on what was originally developed for the MLH Localhost Quorum workshop, which demonstrates how to run a simple Ethereum application and how to write a simple Smart Contract that interacts with the Ethereum-based network. The original app can be found [here](https://github.com/MLH/mlh-localhost-tech-marketplace).

## Goals 

Produce an example which will demonstrate some of the various advantages and challenges Quorum brings to the table, while still having a simple enough flow to understand. The example should also highlight the private state / public state usage and design implications in a practical use case, as a marketplace. 
 
## Design & Flow
This design introduces these key changes:
-	All items are owned by an account.
-	A sale is between two accounts, and is reflected in their respective balances.
-	TechToken: ERC20 standard implementation, used as marketplace cash token. To create a bid, an account has to approve funds for Market which will use them to execute sale. 
-	A Market Manager node, which owns the TechToken and provides funds for accounts and is privy to all txns. 
-	A buyer can purchase an item privately and “publicly” (privately inclusive) from seller. When Item is sold privately, other marketplace participants will know the item was sold, but will not know who was the buyer (appears as Buyer: “Unknown” in the UI). 
-	In order to accomplish it, the Market Manager, will update “publicly” the item state to 'Sold', which in it’s turn will envoke an event notifiying all participants of the sale. 
-	Bidding mechanism, operated by BidManager, which enforces the use of a single bid for an item, and discards the unseccessful bids. 

The implementation of reselling an item that was purchased via private txns presented a challenge, and several approaches were considered.
Possible approaches:
1.	Let anyone reoffer Item for sale. 
Issue: doesn't reflect the ownership of item. Relies on the app level to enforce ownership.
2.	Create new item with same properties (newId) and put up for sale. 
Issue: similar to before, but actually quite realistic as it's similar to existing marketplace models today. Also, will not affect purchased item ownership.
3.	During sale, generate random string that only seller will have, and store it's hash on the item. After the sale is complete, seller will transfer the string off-chain (or on-chain via private txn) to buyer, which will use it to put the item back on sale. Issue: may rely on seller to provide string off-chain (not enforceable on chain), but also realistic. Also, a more complicated mechanism.
4.	When buyer wishes to remove their anonymity and resell item, they will ask the Market Manager to change “publicly” the ownership on the item through a private txn.
Issue: relying on a 3rd party to enforce txn, but realistic and less complicated.

Eventually, approach 4 was selected and implemented.

## Requirements
### Quorum
This app uses Quorum as the Ethereum protocol in this project. This app supports out of the box running on either Quorum-Examples network (7nodes), or a Quorum Maker network.

#### Quorum-Examples network (7nodes)
The app can run on top of Quorum's [7nodes example](https://github.com/jpmorganchase/quorum-examples/tree/master/examples/7nodes) that runs several Quorum nodes in parallel using a virtual machine or docker.
Please follow the steps mentioned in the [7 nodes repo](https://github.com/jpmorganchase/quorum-examples/tree/master/examples/7nodes) & the wider [quorum-examples repo](https://github.com/jpmorganchase/quorum-examples) to setup & run the local Quorum network **with these modification**:
1. Adding to PRIVATE_CONFIG the parameter **--rpccorsdomain "http://localhost:3000"**, in raft-start.sh / instanbul-start.sh / docker-compose.yml, depending on usage.
2. Reduce the number of nodes to 4 by following steps 1,2 [here](https://github.com/jpmorganchase/quorum-examples/tree/master/examples/7nodes#reducing-the-number-of-nodes).

#### Quorum Maker network 
The app can run on top of a [Quorum Maker](https://github.com/synechron-finlabs/quorum-maker) dockerized network, and requires 
docker & docker-compose installed. For more info refer to [quorum-maker wiki](https://github.com/synechron-finlabs/quorum-maker/wiki).
To quickly setup and run the network:
```sh
$ git clone https://github.com/synechron-finlabs/quorum-maker
$ cd quorum-maker
$ ./setup.sh dev -p TechMarketplaceNetwork -n 4
$ cd TechMarketplaceNetwork
$ docker-compose up
```

### App
* Install [NodeJS](https://nodejs.org) - Event-driven Javascript runtime environment
* Install [NPM](https://www.npmjs.com/) - Popular package manager for JavaScript
* Install [Truffle](http://truffleframework.com/) - Development framework for Ethereum applications (This app was last tested on Truffle 4.1.15 with Solidity v0.4.25)


## Installation
If running on top of a Quorum Maker network, make sure to clone the repo to the same directory where quorum-maker is located.


```sh
$ git clone https://github.com/lyotam/TechMarketplace.git
$ cd TechMarketplace
$ npm install
```

## Running the App

To get your TechMarketplace application up and running locally, you will need to first setup & run the Quorum network, as mentioned before and only then compile your contracts, migrate those contracts to the network, populate those contracts with data, and run your application as follows:


Running with Quorum-Examples network (7nodes):

```sh
$ npm run compile
$ npm run migrate
$ npm run seed
$ npm start
```

Running with Quorum Maker network:

```sh
$ npm run qm_setup
$ npm run compile
$ npm run qm_migrate
$ npm run qm_seed
$ npm start
```


***To note: For best view of the app's flow of execution, it is recommended to have all 4 accounts' tabs open on your browser**



## Additional Resources

* [Web3JS documentation](https://github.com/ethereum/wiki/wiki/JavaScript-API) - Documentation for web3.js, an API for interacting with Ethereum network
* [Solidity documentation](https://solidity.readthedocs.io) - Documentation for writing Smart Contracts for the Ethereum Virtual machine
* [Truffle documentaion](http://truffleframework.com/docs/) - Documentation for building Ethereum apps using the Truffle framework
* [Ethereum Pet Shop](http://truffleframework.com/tutorials/pet-shop) - A tutorial developed by the Truffle team to write your first Ethereum application

## License

Unless otherwise stated, the code in this repo is released under the MIT
License.

```
Copyright (c) 2018 Major League Hacking, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE
```
