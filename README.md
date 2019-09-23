# coindesk.js

Powered by [![CoinDesk]()](https://www.coindesk.com/api/)

[Node.js](https://nodejs.org) client written in Javascript for CoinDesk API service:

### Features

  - Get Bitcoin current price
  - Get Bitcoin historical price

### Getting Started

These instructions will get you a copy of the project on your local system.

#### Prerequisites

CoinDesk API client for node.js uses a number of open source projects to work properly:

* [@hapi/joi] - The most powerful schema description language and data validator for Javascript
* [axios] - Promise based HTTP client for the browser and node.js
* [node-fetch] - A light-weight module that brings window.fetch to node.js
* [winston] - A logger for just about everything

And of course CoinDesk API client for node.js itself is open source with a [public repository][coindesk.js] on GitHub.

#### Installation

Install the npm package with the command:
``npm install --save coindesk``.

#### Quick Start

A series of simple examples:

Get currentprice price for Bitcoin in json format
```javascript
const { CoindeskAPIClient } = require('coindesk');
const apiClient = CoindeskAPIClient.start('currentprice');
const response = apiClient.get()
    .then(response => response)
    .catch(err => console.error(err));
```

Get currentprice price for Bitcoin in other currency than USD
```javascript
const { CoindeskAPIClient } = require('coindesk');
const apiClient = CoindeskAPIClient.start('currentprice', { currency: 'EUR' });
const response = apiClient.get()
    .then(response => response)
    .catch(err => console.error(err));
```

Get historical price for Bitcoin in json format
```javascript
const { CoindeskAPIClient } = require('coindesk');
const apiClient = CoindeskAPIClient.start('historical');
const response = apiClient.get()
    .then(response => response)
    .catch(err => console.error(err));
```

Get historical price for Bitcoin providing optional parameters
```javascript
const { CoindeskAPIClient } = require('coindesk');
const apiClient = CoindeskAPIClient.start('historical', { start: '2018-01-01' });
const response = apiClient.get()
    .then(response => response)
    .catch(err => console.error(err));
```

Get supported currencies to fetch Bitcoin price in
```javascript
const { CoindeskAPIClient } = require('coindesk');
const apiClient = new CoindeskAPIClient();
const supportedCurrencies = apiClient.getSupportedCurrencies();
```

Full documentation for CoinDesk API is available at https://www.coindesk.com/api/.

License
----

MIT


**Free Software. Hell Yeah!**

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen.)

   [coindesk.js]: <https://github.com/sdediego/coindesk.js>
   [@hapi/joi]: <https://www.npmjs.com/package/@hapi/joi>
   [axios]: <https://www.npmjs.com/package/axios>
   [node-fetch]: <https://www.npmjs.com/package/node-fetch>
   [winston]: <https://www.npmjs.com/package/winston>
