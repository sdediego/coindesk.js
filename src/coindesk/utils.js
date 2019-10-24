/**
 * Coindesk API client utilities.
 *
 * @file Defines Coindesk API client classes utilities.
 */

const fs = require('fs');
const { getLogger } = require('../logger/service');
const { CoindeskAPIClientError } = require('../errors');
const { CoindeskAPIHttpRequestError } = require('../errors');
const { CoindeskAPIHttpResponseError } = require('../errors');
const schemas = require('./schemas');
const settings = require('../settings');
const supportedCurrencies = require('../currencies.json').SUPPORTED_CURRENCIES;

const logger = getLogger(__filename);

/**
 * Validates data type argument to constructor Coindesk API endpoint.
 *
 * @access private
 * @member {Function} CoindeskAPIClient
 *
 * @function
 * @param  {String} dataType Type of data to fetch from Coindesk API (currentprice or historical).
 * @return {String} Validated dataType parameters.
 *
 * @throws {CoindeskAPIClientError}
 */
let validateDataType = (dataType) => {
  if (!settings.VALID_DATA_TYPES.includes(dataType)) {
    const message = `Data type must be ${ settings.VALID_DATA_TYPES.join(', ') }.`;
    logger.error(`[CoindeskAPIClient] Data type error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }
  return dataType;
};

/**
 * Validates Coindesk API endpoint optional query parameters.
 *
 * @access private
 * @member {Function} CoindeskAPIClient
 *
 * @function
 * @param  {String} dataType Type of data to fetch from Coindesk API (currentprice or historical).
 * @param  {Object} params   Optional query parameters for corresponding endpoint.
 * @return {Object} Validated query parameters.
 *
 * @throws {CoindeskAPIClientError}
 */
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

/**
 * Validates index optional query parameter.
 *
 * @access private
 * @member {Function} CoindeskAPIClient
 *
 * @function
 * @param {String} index Query parameter whose values can be either 'USD' or 'CNY'.
 *
 * @throws {CoindeskAPIClientError}
 */
let validateIndex = (index) => {
  if (!settings.VALID_INDEX.includes(index)) {
    const message = `'Index' must be ${ settings.VALID_INDEX.join(', ') }.`;
    logger.error(`[CoindeskAPIClient] Index error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }
};

/**
 * Validates currency optional query parameter.
 *
 * @access private
 * @member {Function} CoindeskAPIClient
 *
 * @function
 * @param {String} currency Determine which currency data must be returned in.
 *
 * @throws {CoindeskAPIClientError}
 */
let validateCurrency = (currency) => {
  const currencies = supportedCurrencies.map(currency => currency.currency);
  if (currency !== null && !currencies.includes(currency)) {
    const message = `Unvalid provided currency ${ currency }.`;
    logger.error(`[CoindeskAPIClient] Currency error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }
};

/**
 * Validates dates interval (start and end) optional query parameters.
 *
 * @access private
 * @member {Function} CoindeskAPIClient
 *
 * @function
 * @param {Object} params Optional query paremters object.
 * @param {String} flag   Determines which date to validate ('start' or 'end').
 *
 * @throws {CoindeskAPIClientError}
 */
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

/**
 * Validates for optional query parameter.
 *
 * @access private
 * @member {Function} CoindeskAPIClient
 *
 * @function
 * @param {String} forParam Takes the value 'yesterday'. Overwrites 'start' and 'end' params.
 *
 * @throws {CoindeskAPIClientError}
 */
let validateFor = (forParam) => {
  if (!settings.VALID_FOR.includes(forParam)) {
    const message = `For must be ${ settings.VALID_FOR.join(', ') }.`;
    logger.error(`[CoindeskAPIClient] For error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }
};

/**
 * Validates retries Coindesk API request property value.
 *
 * @access private
 * @member {Function} CoindeskAPIHttpRequest
 *
 * @function
 * @param  {Number} retries Maximum number of request attempts before failing.
 * @return {Number} Validated retries value.
 *
 * @throws {CoindeskAPIHttpRequestError}
 */
let validateRetries = (retries) => {
  if (typeof retries !== 'number' || !Number.isInteger(retries) || retries < 0) {
    const message = `Retries type ${ typeof retries } must be positive integer number.`;
    logger.error(`[CoindeskAPIHttpRequest] Retries error: ${ message }`);
    throw new CoindeskAPIHttpRequestError(message);
  }
  const maxRetries = parseInt(Math.min(retries, settings.REQUEST_MAX_RETRIES));
  if (maxRetries < retries) {
    logger.warn(`[CoindeskAPIHttpRequest] Request max retries: ${ maxRetries }.`);
  }
  return maxRetries;
};

/**
 * Validates redirects Coindesk API request property value.
 *
 * @access private
 * @member {Function} CoindeskAPIHttpRequest
 *
 * @function
 * @param  {Number} redirects Maximum number of request redirects allowed.
 * @return {Number} Validated redirects value.
 *
 * @throws {CoindeskAPIHttpRequestError}
 */
let validateRedirects = (redirects) => {
  if (typeof redirects !== 'number' || !Number.isInteger(redirects) || redirects < 0) {
    const message = `Redirects type ${ typeof redirects } must be positive integer number.`;
    logger.error(`[CoindeskAPIHttpRequest] Redirects error: ${ message }`);
    throw new CoindeskAPIHttpRequestError(message);
  }
  const maxRedirects = parseInt(Math.min(redirects, settings.REQUEST_MAX_REDIRECTS));
  if (maxRedirects < redirects) {
    logger.warn(`[CoindeskAPIHttpRequest] Request max redirects: ${ maxRedirects }.`);
  }
  return maxRedirects;
};

/**
 * Validates timeout Coindesk API request property value.
 *
 * @access private
 * @member {Function} CoindeskAPIHttpRequest
 *
 * @function
 * @param  {Number} timeout Number of miliseconds before throw request timeout error.
 * @return {Number} Validated timeout value.
 *
 * @throws {CoindeskAPIHttpRequestError}
 */
let validateTimeout = (timeout) => {
  if (typeof timeout !== 'number' || !Number.isInteger(timeout) || timeout < 0) {
    const message = `Timeout type ${ typeof timeout } must be positive integer number.`;
    logger.error(`[CoindeskAPIHttpRequest] Timeout error: ${ message }`);
    throw new CoindeskAPIHttpRequestError(message);
  }
  const maxTimeout = parseInt(Math.min(timeout, settings.REQUEST_MAX_TIMEOUT));
  if (maxTimeout < timeout) {
    logger.warn(`[CoindeskAPIHttpRequest] Request max timeout: ${ maxTimeout }.`);
  }
  return maxTimeout;
};

/**
 * Validates backoff Coindesk API request property value.
 *
 * @access private
 * @member {Function} CoindeskAPIHttpRequest
 *
 * @function
 * @param  {Boolean} backoff Enable/disable http request retry backoff.
 * @return {Boolean} Validated backoff value.
 *
 * @throws {CoindeskAPIHttpRequestError}
 */
let validateBackoff = (backoff) => {
  if (typeof backoff !== 'boolean') {
    const message = `Backoff type ${ typeof backoff } must be 'boolean'.`;
    logger.error(`[CoindeskAPIHttpRequest] Backoff error: ${ message }`);
    throw new CoindeskAPIHttpRequestError(message);
  }
  return backoff;
};

/**
 * Validates Coindesk API endpoint.
 *
 * @access private
 * @member {Function} CoindeskAPIClient
 *
 * @function
 * @param {String} url Coindesk API endpoint.
 *
 * @throws {CoindeskAPIClientError}
 */
let validateUrl = (url) => {
  const match = url.match(/(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/);
  if (!match) {
    const message = `${ url } is not a valid pattern for an url.`;
    logger.error(`[CoindeskAPIClient] URL error: ${ message }`);
    throw new CoindeskAPIClientError(message);
  }
};

/**
 * Validates supported currencies list fetched from Coindesk API.
 *
 * @access private
 * @member {Function} CoindeskAPIClient
 *
 * @function
 * @param  {String} currencies Supported currencies fetched from Coindesk API.
 * @return {String} Stringified supported currencies updated data.
 */
let validateSupportedCurrencies = async (currencies) => {
  const validCurrencies = new Set(currencies.map(currency => currency.currency));
  const allowedCurrencies = new Set(supportedCurrencies.map(currency => currency.currency));
  for (let currency of validCurrencies) {
    if (!allowedCurrencies.has(currency)) {
      const message = `Missing currency ${ currency } in settings.`;
      logger.warn(`[CoindeskAPIClient] Currency error: ${ message }`);
      return await updateCurrenciesSettings(currencies);
    }
  }
};

/**
 * Returns supported currencies file.
 *
 * @access private
 * @member {Function} CoindeskAPIClient
 *
 * @function
 * @param  {String} path Path to supported currencies file ('currencies.json').
 * @return {String} Stringified supported currencies file.
 */
let readFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

/**
 * Updates supported currencies file.
 *
 * @access private
 * @member {Function} CoindeskAPIClient
 *
 * @function
 * @param  {String} path Path to supported currencies file ('currencies.json').
 * @param  {String} data Stringified supported currencies updated data.
 * @return {String} Stringified supported currencies updated data.
 */
let writeFile = (path, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

/**
 * Updates supported currencies with the fetched list from Coindesk API.
 *
 * @access private
 * @member {Function} CoindeskAPIClient
 *
 * @function
 * @param {String} currencies Supported currencies fetched from Coindesk API.
 *
 * @throws {CoindeskAPIClientError}
 */
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

/**
 * Returns corresponding schema to validate Coindesk API response data.
 *
 * @access private
 * @member {Function} CoindeskAPIHttpResponse
 *
 * @function
 * @param  {String} dataType Type of data to fetch from Coindesk API (currentprice or historical).
 * @param  {String} currency Currency in which data has been returned.
 * @return {Object} Response schema to validate returned data.
 *
 * @throws {CoindeskAPIHttpResponse}
 */
let getResponseSchema = (dataType, currency = null) => {
  switch (dataType) {
    case settings.API_CURRENTPRICE_DATA_TYPE:
      if (currency === null) return schemas.currentpriceSchema;
      return schemas.currentpriceCurrencySchema;
    case settings.API_HISTORICAL_DATA_TYPE:
      return schemas.historicalSchema;
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
  validateUrl,
  validateSupportedCurrencies,
  getResponseSchema
};
