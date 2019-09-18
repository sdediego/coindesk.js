/*
 * Coindesk API client utilities.
 */

const fs = require('fs');
const { getLogger } = require('../logger/service');
const { CoindeskAPIClientError } = require('../errors');
const { CoindeskAPIHttpRequestError } = require('../errors');
const { CoindeskAPIHttpResponseError } = require('../errors');
const schema = require('./schemas');
const settings = require('../settings');
const supportedCurrencies = require('../currencies.json').SUPPORTED_CURRENCIES;

const logger = getLogger(__filename);

let validateDataType = (dataType) => {
  if (!settings.VALID_DATA_TYPES.includes(dataType)) {
    const message = `Data type must be ${ settings.VALID_DATA_TYPES.join(', ') }.`;
    logger.error(`[CoindeskAPIClient] Data type error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }
  return dataType;
};

let validateParams = (dataType, params) => {
  if (dataType === settings.API_CURRENTPRICE_DATA_TYPE) {
    for (let param in params) {
      if (!settings.VALID_CURRENTPRICE_PARAMS.includes(param)) {
        const message = `Unvalid param ${ param } for ${ dataType } data type.`;
        logger.error(`[CoindeskAPIClient] Param error: ${ message }`);
        throw new CoindeskAPIClientError(message);
      }
    }

    if (params.hasOwnProperty(settings.CURRENCY_PARAM)) {
      validateCurrency(params[settings.CURRENCY_PARAM]);
    }
  } else if (dataType === settings.API_HISTORICAL_DATA_TYPE) {
    for (let param in params) {
      if (!settings.VALID_HISTORICAL_PARAMS.includes(param)) {
        const message = `Unvalid param ${ param } for ${ dataType } data type.`;
        logger.error(`[CoindeskAPIClient] Param error: ${ message }`);
        throw new CoindeskAPIClientError(message);
      }
    }

    if (params.hasOwnProperty(settings.INDEX_PARAM)) {
      validateIndex(params[settings.INDEX_PARAM]);
    }
    if (params.hasOwnProperty(settings.CURRENCY_PARAM)) {
      validateCurrency(params[settings.CURRENCY_PARAM]);
    }
    if (params.hasOwnProperty(settings.START_PARAM)) {
      validateDate(params[settings.START_PARAM]);
    }
    if (params.hasOwnProperty(settings.END_PARAM)) {
      validateDate(params[settings.END_PARAM]);
    }
    if (params.hasOwnProperty(settings.FOR_PARAM)) {
      validateFor(params[settings.FOR_PARAM]);
    }
  } else {
    const message = `Unable to validate params for data type ${ dataType }.`;
    logger.error(`[CoindeskAPIClient] Data type error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }

  return params;
};

let validateIndex = (index) => {
  if (!settings.VALID_INDEX.includes(index)) {
    const message = `'Index' must be ${ settings.VALID_INDEX.join(', ') }.`;
    logger.error(`[CoindeskAPIClient] Index error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }
};

let validateCurrency = (currency) => {
  const currencies = supportedCurrencies.map(currency => currency.currency);
  if (currency !== null && !currencies.includes(currency)) {
    const message = `Unvalid provided currency ${ currency }.`;
    logger.error(`[CoindeskAPIClient] Currency error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }
};

let validateDate = (params, flag) => {
  const date = params[flag];
  const match = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    try {
      const parsedDate = new Date(match[1], match[2] - 1, match[3]).toISOString();
      params[flag] = parsedDate.slice(0, parsedDate.indexOf('T'));
    } catch (err) {
      const message = err.message;
      logger.error(`[CoindeskAPIClient] Date error: ${ message }.`);
      throw new CoindeskAPIClientError(message);
    }
  } else {
    const message = `${ flag } must fullfill the pattern YYYY-MM-DD.`;
    logger.error(`[CoindeskAPIClient] Date error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }
};

let validateFor = (forParam) => {
  if (!settings.VALID_FOR.includes(forParam)) {
    const message = `For must be ${ settings.VALID_FOR.join(', ') }.`;
    logger.error(`[CoindeskAPIClient] For error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }
};

let validateRetries = (retries) => {
  if (typeof retries !== 'number') {
    const message = `Retries type ${ typeof retries } must be 'number'.`;
    logger.error(`[CoindeskAPIHttpRequest] Retries error: ${ message }`);
    throw new CoindeskAPIHttpRequestError(message);
  }

  const maxRetries = parseInt(Math.min(retries, settings.REQUEST_MAX_RETRIES));
  if (maxRetries < retries) {
    logger.warn(`[CoindeskAPIHttpRequest] Request max retries: ${ maxRetries }.`);
  }

  return maxRetries;
};

let validateRedirects = (redirects) => {
  if (typeof redirects !== 'number') {
    const message = `Redirects type ${ typeof redirects } must be 'number'.`;
    logger.error(`[CoindeskAPIHttpRequest] Redirects error: ${ message }`);
    throw new CoindeskAPIHttpRequestError(message);
  }

  const maxRedirects = parseInt(Math.min(redirects, settings.REQUEST_MAX_REDIRECTS));
  if (maxRedirects < redirects) {
    logger.warn(`[CoindeskAPIHttpRequest] Request max redirects: ${ maxRedirects }.`);
  }

  return maxRedirects;
};

let validateTimeout = (timeout) => {
  if (typeof timeout !== 'number') {
    const message = `Timeout type ${ typeof timeout } must be 'number'.`;
    logger.error(`[CoindeskAPIHttpRequest] Timeout error: ${ message }`);
    throw new CoindeskAPIHttpRequestError(message);
  }

  const maxTimeout = parseInt(Math.min(timeout, settings.REQUEST_MAX_TIMEOUT));
  if (maxTimeout < timeout) {
    logger.warn(`[CoindeskAPIHttpRequest] Request max timeout: ${ maxTimeout }.`);
  }

  return maxTimeout;
};

let validateBackoff = (backoff) => {
  if (typeof backoff !== 'boolean') {
    const message = `Backoff type ${ typeof backoff } must be 'boolean'.`;
    logger.error(`[CoindeskAPIHttpRequest] Backoff error: ${ message }`);
    throw new CoindeskAPIHttpRequestError(message);
  }
};

let validateSupportedCurrencies = async (currencies) => {
  const validCurrencies = new Set(currencies.map(currency => currency.currency));
  const supportedCurrencies = new Set(supportedCurrencies.map(currency => { 
    return currency.currency;
  }));

  for (let currency of validCurrencies) {
    if (!supportedCurrencies.has(currency)) {
      const message = `Missing currency ${ currency } in settings.`;
      logger.warn(`[CoindeskAPIClient] Currency error: ${ message }`);
      return await updateCurrenciesSettings(currencies);
    }
  }
};

let readFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

let writeFile = (path, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

let updateCurrenciesSettings = async (currencies) => {
  let file;

  try {
    file = await readFile('../currencies.json');
  } catch (err) {
    const message = `Unable to read settings file - ${ err.message }.`;
    logger.error(`[CoindeskAPIClient] File error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }

  const currenciesObj = JSON.parse(file);
  currenciesObj.SUPPORTED_CURRENCIES = currencies;
  const currenciesJSON = JSON.stringify(currenciesObj);

  try {
    await writeFile('../currencies.json', currenciesJSON);
  } catch (err) {
    const message = `Unable to write settings file - ${ err.message }.`;
    logger.error(`[CoindeskAPIClient] File error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }
};

let getResponseSchema = (dataType, currency) => {
  switch (dataType) {
    case settings.API_CURRENTPRICE_DATA_TYPE:
      if (currency === null) return schema.currentpriceSchema;
      return schema.currentpriceCurrencySchema;
    case settings.API_HISTORICAL_DATA_TYPE:
      return schema.historicalSchema;
    default:
      message = `Schema not found for data type ${ dataType } and currency ${ currency }.`;
      logger.error(`[CoindeskAPIHttpResponse] Schema error: ${ message }`);
      throw new CoindeskAPIHttpResponseError(message);
  }
};

module.exports = {
  validateDataType,
  validateParams,
  validateRetries,
  validateRedirects,
  validateTimeout,
  validateBackoff,
  validateSupportedCurrencies,
  getResponseSchema
};
