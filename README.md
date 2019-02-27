# MLH Localhost &mdash; Blockchain Basics: An Introduction to J.P. Morgan's Quorum

This repository contains the code for an example Quorum network for the **Blockchain Basics: An Introduction to J.P. Morgan's Quorum**.

This project is **one of two parts** required for the **Quorum workshop**. This repository contains the code to run [TechMarketplace](https://github.com/MLH/mlh-localhost-tech-marketplace) which runs the application layer. The second part needed is [Quorum Network](https://github.com/MLH/mlh-localhost-quorum-network) which runs the Ethereum network layer.

### TechMarketplace [[Docs](https://github.com/MLH/mlh-localhost-tech-marketplace)]

TechMarketplace is an example application running on top of the Quorum network and allows users to buy and sell virtual hackathon gear. It demonstrates how to run an simple Ethereum application and how to write simple Smart Contracts that interact with the Ethereum-based network.

### Quorum Network [[Docs](https://github.com/MLH/mlh-localhost-quorum-network)]

[Quorum](https://github.com/jpmorganchase/quorum) is an protocol designed by JP Morgan chase to address the lack of data privacy on Ethereum platforms. With this, Quorum features several enhancements including private transactions/contracts, new consensus mechansims, and higher performance. It is a fork of the [go-ethereum](https://github.com/ethereum/go-ethereum) protocol and is updated with go-etherum releases.

We use Quorum as our Ethereum protocol in this project. We use a version of Quorum's [7nodes](https://github.com/jpmorganchase/quorum-examples/tree/master/examples/7nodes) example that runs several Quorum nodes in parallel using a virtual machine.

**Important note** A Quorum network must be running locally in order for the TechMarketplace application to work. This project includes instructions on how to run the Quorum network locally.

## Requirements

* Install [Docker](https://docs.docker.com/install/) - Tool for building and managing projects through containers
* Install [NodeJS](https://nodejs.org) - Event-driven Javascript runtime environment
* Install [NPM](https://www.npmjs.com/) - Popular package manager for JavaScript
* Install [Truffle](http://truffleframework.com/) - Development framework for Ethereum applications

## Installation

```sh
$ git clone https://github.com/MLH/mlh-localhost-tech-marketplace.git
$ cd mlh-localhost-tech-marketplace
$ npm install
```

## Running

To get your TechMarketplace application up and running locally, you will need to run the Quorum network, compile your contracts, migrate those contracts to the network, populate those contracts with data, then run your application:

### Quorum network

```sh
$ docker pull mlhacks/mlh-localhost-quorum-network
$ docker run -it -p 22000:22000 -p 22001:22001 -p 22002:22002 mlhacks/mlh-localhost-quorum-network
```

### TechMarketplace

```sh
$ truffle compile
$ truffle migrate
$ npm run seed
$ npm start
```

## Commands

Inside the TechMarketplace project, you can run some built-in commands:

### `npm start` or `yarn start`

Runs the app in development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will automatically reload if you make changes to the code.<br>
You will see the build errors and lint warnings in the console.

### `npm run compile` or `truffle compile`

Compiles the Solidity contracts (files with the `.sol` extension) in the `contracts/` directory. This is necessary to run every time you make a change to one of the contracts. Truffle will only compile the contracts that were changed since the last compile.

Compiled versions of these contracts will be placed in the `build/contracts/` directory.

Additional [documentation](http://truffleframework.com/docs/getting_started/compile).

### `npm run migrate` or `truffle migrate`

Migrations are JavaScript files that deploy your compiled contracts to the Ethereum network. To see your contract on the network, you must run `truffle migrate` after you run the network.

All migrations are located within the `migrations/` directory. To add a new contract to the network, you must add it to the `migrations/2_deploy_contract.js` file or create a new migration file.

Additional [documentation](http://truffleframework.com/docs/getting_started/migrations)

### `npm run seed` or `truffle exec seed.js`

Once your contracts are live on the network, you need to seed the network with default data. We do this by running the `seed.js` script which populates our contract with data from `items.json`.

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
