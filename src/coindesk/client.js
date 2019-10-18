/**
 * @file
 * Class-based Coindesk API client.
 */

const axios = require('axios');
const { Headers } = require('node-fetch');
const { _private } = require('./weakmap');
const { getLogger } = require('../logger/service');
const { CoindeskAPIClientError } = require('../errors');
const { CoindeskAPIHttpRequestError } = require('../errors');
const { CoindeskAPIHttpResponseError } = require('../errors');
const utils = require('./utils');
const settings = require('../settings');

const logger = getLogger(__filename);

/**
 * Constructs an instance of CoindeskAPIHttpRequest class.
 *
 * Provides the ability to request current price and historical
 * prices for Bitcoin from CoinDesk API.
 *
 * @access private
 * @class
 */
class CoindeskAPIHttpRequest {

  /**
   * Constructs an instance of CoindeskAPIHttpRequest class.
   *
   * @access     public
   * @constructs CoindeskAPIHttpRequest
   *
   * @constructor
   * @param  {Number}  retries   Maximum number of request attempts before failing.
   * @param  {Number}  redirects Maximum number of request redirects allowed.
   * @param  {Number}  timeout   Number of miliseconds before throw request timeout error.
   * @param  {Boolean} backoff   Enable/disable http request retry backoff.
   * @return {Object}  CoindeskAPIHttpRequest class instance.
   */
  constructor(retries = 10, redirects = 5, timeout = 5000, backoff = true) {
    _private(this).retries = retries;
    _private(this).redirects = redirects;
    _private(this).timeout = timeout;
    _private(this).backoff = backoff;
  }

  /**
   * Returns instance string representation.
   *
   * @access   public
   * @memberof CoindeskAPIHttpRequest
   *
   * @function
   * @return {String} CoindeskAPIHttpRequest class instance string representation.
   */
  toString() {
    return `Coindesk API Http Request -
      Class:     ${ this.constructor.name },
      Retries:   ${ this.retries },
      Redirects: ${ this.redirects },
      Timeout:   ${ this.timeout },
      Backoff:   ${ this.backoff }`;
  }

  /**
   * Validates class properties and constructs an instance of CoindeskAPIHttpRequest class.
   *
   * @access     public
   * @constructs CoindeskAPIHttpRequest
   * @static
   *
   * @function
   * @param  {Number}  retries   Maximum number of request attempts before failing.
   * @param  {Number}  redirects Maximum number of request redirects allowed.
   * @param  {Number}  timeout   Number of miliseconds before throw request timeout error.
   * @param  {Boolean} backoff   Enable/disable http request retry backoff.
   * @return {Object}  CoindeskAPIHttpRequest class instance.
   */
  static validate(retries, redirects, timeout, backoff) {
    retries = utils.validateRetries(retries);
    redirects = utils.validateRedirects(redirects);
    timeout = utils.validateTimeout(timeout);
    utils.validateBackoff(backoff);
    return [retries, redirects, timeout, backoff];
  }

  /**
   * Returns instance requests retries property value.
   *
   * @access   public
   * @memberof CoindeskAPIHttpRequest
   *
   * @property {Function}
   * @return   {Number}   Instance maximum number of request attempts before failing.
   */
  get retries() {
    return _private(this).retries;
  }

  /**
   * Sets instance requests retries property value.
   *
   * @access   public
   * @memberof CoindeskAPIHttpRequest
   *
   * @property {Function}
   * @param    {Number}   retries Maximum number of request attempts before failing.
   */
  set retries(retries) {
    retries = utils.validateRetries(retries);
    _private(this).retries = retries;
  }

  /**
   * Returns instance requests redirects property value.
   *
   * @access   public
   * @memberof CoindeskAPIHttpRequest
   *
   * @property {Function}
   * @return   {Number}   Instance maximum number of request redirects allowed.
   */
  get redirects() {
    return _private(this).redirects;
  }

  /**
   * Sets instance requests redirects property value.
   *
   * @access   public
   * @memberof CoindeskAPIHttpRequest
   *
   * @property {Function}
   * @param    {Number}   redirects Maximum number of request redirects allowed.
   */
  set redirects(redirects) {
    redirects = utils.validateRedirects(redirects);
    _private(this).redirects = redirects;
  }

  /**
   * Returns instance requests timeout property value.
   *
   * @access   public
   * @memberof CoindeskAPIHttpRequest
   *
   * @property {Function}
   * @return   {Number}   Instance maximum of miliseconds before throw request timeout error.
   */
  get timeout() {
    return _private(this).timeout;
  }

  /**
   * Sets instance requests timeout property value.
   *
   * @access   public
   * @memberof CoindeskAPIHttpRequest
   *
   * @property {Function}
   * @param    {Number}   timeout Number of miliseconds before throw request timeout error.
   */
  set timeout(timeout) {
    timeout = utils.validateTimeout(timeout);
    _private(this).timeout = timeout;
  }

  /**
   * Returns instance requests backoff property value.
   *
   * @access   public
   * @memberof CoindeskAPIHttpRequest
   *
   * @property {Function}
   * @return   {Boolean}  Instance request retry backoff.
   */
  get backoff() {
    return _private(this).backoff;
  }

  /**
   * Sets instance requests backoff property value.
   *
   * @access   public
   * @memberof CoindeskAPIHttpRequest
   *
   * @property {Function}
   * @param    {Boolean}  backoff Enable/disable http request retry backoff.
   */
  set backoff(backoff) {
    utils.validateBackoff(backoff);
    _private(this).backoff = backoff;
  }

  /**
   * Gets Bitcoin market information from Coindesk API.
   *
   * Makes https request to Coindesk API for the provided url with
   * optional parameters.
   *
   * @access   public
   * @memberof CoindeskAPIHttpRequest
   *
   * @function
   * @param  {String}  url Endpoint with optional query parameters.
   * @param  {Boolean} raw Enable/disable raw response.
   * @return {Promise} Http response object with requested data.
   *
   * @throws {CoindeskAPIHttpRequestError}
   */
  async get(url, raw = false) {
    let response;
    const options = this._getRequestOptions();
    try {
      response = await this._httpRequest(url, options);
    } catch (err) {
      const message = `Could not make request - ${ err.message }`;
      logger.error(`[CoindeskAPIHttpRequest] Request error: ${ message }`);
      throw new CoindeskAPIHttpRequestError(message);
    }
    this._checkResponseStatus(response);
    return raw ? response : response.data;
  }

  /**
   * Returns http request options and headers.
   *
   * Returns an object with http request headers and optional parameters
   * configuration, like response type (json), maximum number of redirects
   * and timeout.
   *
   * @access   private
   * @memberof CoindeskAPIHttpRequest
   *
   * @function
   * @return {Object} Http request optional parameters and headers.
   */
  _getRequestOptions() {
    return {
      headers: this._getHeaders(),
      responseType: 'json',
      maxRedirects: this.redirects,
      timeout: this.timeout
    };
  }

  /**
   * Returns http request headers.
   *
   * @access   private
   * @memberof CoindeskAPIHttpRequest
   *
   * @function
   * @return {Object} Http request headers.
   */
  _getHeaders() {
    const headers = settings.REQUEST_HEADERS;
    return new Headers(headers);
  }

  /**
   * Gets Bitcoin market information from Coindesk API.
   *
   * Makes https request to Coindesk API managing the
   * internal calls flow.
   *
   * @access   private
   * @memberof CoindeskAPIHttpRequest
   *
   * @function
   * @param  {String}  url     Endpoint with optional query parameters.
   * @param  {Boolean} options Http request options.
   * @return {Promise} Http response object with requested data.
   *
   * @throws {CoindeskAPIHttpRequestError}
   */
  async _httpRequest(url, options) {
    for (let retry = 1; retry <= this.retries; retry++) {
      try {
        return await axios.get(url, options);
      } catch (err) {
        const timeout = this.backoff ? Math.pow(2, retry) : 0;
        logger.error(`[CoindeskAPIHttpRequest] Retry ${ retry } request: ${ err.message }`);
        logger.error(`[CoindeskAPIHttpRequest] Waiting ${ timeout } ms`);
        await this._waitExponentialBackoff(timeout);
      }
    }
    const message = `No response from Coindesk API url ${ url }`;
    logger.error(`[CoindeskAPIHttpRequest] Request error: ${ message }`);
    throw new CoindeskAPIHttpRequestError(message);
  }

  /**
   * Returns a Promise when timeout expires.
   *
   * When class property backoff is enabled awaits between request calls
   * retries in an exponentially incremental rate.
   *
   * @access   private
   * @memberof CoindeskAPIHttpRequest
   *
   * @function
   * @param  {Number}  timeout Number of miliseconds for request timeout error.
   * @return {Promise} Resolves the promise when timeout is reached.
   */
  _waitExponentialBackoff(timeout) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), timeout);
    });
  }

  /**
   * Validates Coindesk API response status.
   *
   * @access   private
   * @memberof CoindeskAPIHttpRequest
   *
   * @function
   * @param {Object} response Http response object with requested data.
   *
   * @throws {CoindeskAPIHttpRequestError}
   */
  _checkResponseStatus(response) {
    const { status: statusCode, statusText } = response;
    if (statusCode === 403 || statusCode === 404) {
      const message = `Response status code ${ statusCode } - ${ statusText }`;
      logger.error(`[CoindeskAPIHttpRequest] Request error: ${ message }`);
      throw new CoindeskAPIHttpRequestError(message);
    } else if (statusCode === 500) {
      const message = `Response status code ${ statusCode } - ${ statusText }`;
      logger.error(`[CoindeskAPIHttpRequest] Server error: ${ message }`);
      throw new CoindeskAPIHttpRequestError(message);
    } else {
      const message = `Status code ${ statusCode }`;
      logger.info(`[CoindeskAPIHttpRequest] Request success: ${ message }`);
    }
  }
}

/**
 * Constructs an instance of CoindeskAPIClient class.
 *
 * Provides the ability generate a client instance to manage endpoints
 * with different options to make request to CoinDesk API for fetching
 * current price and historical prices for Bitcoin.
 *
 * @access public
 * @class
 */
class CoindeskAPIClient extends CoindeskAPIHttpRequest {
  constructor(dataType = null, params = {}, retries = 10, redirects = 5, timeout = 5000, backoff = true) {
    super(retries, redirects, timeout, backoff);
    _private(this).dataType = dataType;
    _private(this).apiEndpoint = this._constructApiEndpoint(dataType, params);
  }

  toString() {
    const toString = super.toString().slice(super.toString().indexOf('Retries'));
    return `Coindesk API Client -
      Class: ${ this.constructor.name },
      Url:   ${ this.url },
      ${ toString }`;
  }

  static start(dataType = null, params = {}, retries = 10, redirects = 5, timeout = 5000, backoff = true) {
    dataType = utils.validateDataType(dataType);
    params = utils.validateParams(dataType, params);
    [retries, redirects, timeout, backoff] = this.validate(retries, redirects, timeout, backoff);
    return new this(dataType, params, retries, redirects, timeout, backoff);
  }

  _constructApiEndpoint(dataType, params) {
    let resource = dataType ? settings.API_ENDPOINTS[dataType] : '';
    if (dataType === settings.API_CURRENTPRICE_DATA_TYPE) {
      const currency = params.hasOwnProperty('currency') ? params.currency : '';
      resource = currency !== '' ? resource.split('.').join(`/${ currency }.`) : resource;
      delete params.currency;
    }
    const apiPath = `${ this._getApiPath() }/${ resource }`;
    const apiEndpoint = this._getParsedUrl(apiPath, params);
    return apiEndpoint;
  }

  _getApiPath() {
    const { protocol, host, path } = settings.API_COINDESK_SETUP;
    const apiPath = `${ protocol }://${ host }${ path }`;
    return this._cleanApiPath(apiPath);
  }

  _cleanApiPath(apiPath) {
    return apiPath.endsWith('/') ? apiPath.replace(/\/+$/g, '') : apiPath;
  }

  _getParsedUrl(url, params) {
    const encodedParams = this._getEncodedParams(params);
    url = encodedParams !== '' ? `${ url }?${ encodedParams }` : url;
    utils.validateUrl(url);
    return new URL(url);
  }

  _getEncodedParams(params) {
    return Object.keys(params).map(key => {
      return `${ encodeURIComponent(key) }=${ encodeURIComponent(params[key]) }`;
    }).join('&');
  }

  get dataType() {
    return _private(this).dataType;
  }

  set dataType(dataType) {
    dataType = utils.validateDataType(dataType);
    _private(this).dataType = dataType;
    if (dataType === settings.API_CURRENTPRICE_DATA_TYPE) this.params = {};
    _private(this).apiEndpoint = this._constructApiEndpoint(dataType, this.params);
  }

  get url() {
    return _private(this).apiEndpoint;
  }

  get path() {
    return this.url.pathname;
  }

  set path(path) {
    this.url.pathname = path;
    this.deleteManyParams(Object.keys(this.params));
  }

  get params() {
    const params = new Object();
    for (let key of this.url.searchParams.keys()) {
      params[key] = this.getParam(key);
    }
    return params;
  }

  getParam(key) {
    return this.url.searchParams.get(key);
  }

  set params(params) {
    params = utils.validateParams(this.dataType, params);
    Object.keys(params).forEach(key => this.url.searchParams.set(key, params[key]));
  }

  deleteParam(key) {
    this.url.searchParams.delete(key);
  }

  deleteManyParams(keys) {
    keys.forEach(key => this.deleteParam(key));
  }

  deleteAllParams() {
    Object.keys(this.params).forEach(key => this.deleteParam(key));
  }

  get validParams() {
    switch (this.dataType) {
      case settings.API_CURRENTPRICE_DATA_TYPE:
        return settings.VALID_CURRENTPRICE_PARAMS;
      case settings.API_HISTORICAL_DATA_TYPE:
        return settings.VALID_HISTORICAL_PARAMS;
      default:
        const message = `Uncorrect data type setup for ${ this.dataType }`;
        logger.warn(`[CoindeskAPIClient] Data type error: ${ message }`);
        return null;
    }
  }

  async getSupportedCurrencies() {
    let currencies = null;
    const apiPath = this._getApiPath();
    const resource = settings.API_ENDPOINTS[settings.API_SUPPORTED_CURRENCIES_DATA_TYPE];
    const url = new URL(`${ apiPath }/${ resource }`);
    try {
      utils.validateUrl(url.href);
      currencies = await super.get(url.href, false);
    } catch (err) {
      const message = err.message;
      logger.warn(`[CoindeskAPIClient] Get currencies error: ${ message }`);
    }
    if (currencies !== null) await utils.validateSupportedCurrencies(currencies);
    return currencies !== null ? currencies : settings.SUPPORTED_CURRENCIES;
  }

  async get(raw = false) {
    try {
      return await super.get(this.url.href, raw);
    } catch (err) {
      const message = `Could not get response. ${ err.message }`;
      logger.error(`[CoindeskAPIClient] API call error: ${ message }`);
      throw new CoindeskAPIClientError(message);
    }
  }
}

/**
 * Constructs an instance of CoindeskAPIHttpResponse class.
 *
 * Provides the ability to parse and validate responses from CoinDesk API.
 *
 * @access public
 * @class
 */
class CoindeskAPIHttpResponse {
  constructor(response) {
    _private(this).response = response;
  }

  toString() {
    return `Coindesk API Http Response -
      Class: ${ this.constructor.name }`;
  }

  static parse(response, dataType, currency = null) {
    this._validate(response, dataType, currency);
    return new this(response);
  }

  static _validate(response, dataType, currency) {
    const schema = utils.getResponseSchema(dataType, currency);
    const { errors } = schema.validate(response);
    if (errors) {
      const message = error.message;
      logger.error(`[CoindeskAPIHttpResponse] Validation error: ${ message }`);
      throw new CoindeskAPIHttpResponseError(message);
    }
  }

  get response() {
    return _private(this).response;
  }

  get JSONresponse() {
    try {
      return JSON.stringify(this.response);
    } catch (err) {
      const message = `Unable to decode JSON response. ${ err.message }`;
      logger.error(`[CoindeskAPIHttpResponse] Response error: ${ message }`);
      throw new CoindeskAPIHttpResponseError(message);
    }
  }

  get responseItems() {
    return Object.keys(this.response);
  }

  getResponseItem(item) {
    if (!this.response.hasOwnProperty(item)) {
      const message = `Unvalid provided response item ${ item }`;
      logger.error(`[CoindeskAPIHttpResponse] Response item error: ${ message }`);
      return null;
    }
    return this.response[item];
  }
}

module.exports = {
  CoindeskAPIRequest: CoindeskAPIHttpRequest,
  CoindeskAPIClient,
  CoindeskAPIResponse: CoindeskAPIHttpResponse
};
