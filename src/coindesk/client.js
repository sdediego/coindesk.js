#!/usr/bin/env node

/*
 * Class-based Coindesk API client.
 */

const axios = require('axios');
const { Headers } = require('node-fetch');
const { _private } = require('./weakmap');
const { getLogger } = require('../log/log.service');
const { CoindeskAPIHttpRequestError } = require('../errors');
const settings = require('../settings');

const logger = getLogger(__filename);

class CoindeskAPIHttpRequest {
  constructor(retries = 10, redirects = 5, timeout = 5000, backoff = true) {
    _private(this).retries = retries;
    _private(this).redirects = redirects;
    _private(this).timeout = timeout;
    _private(this).backoff = backoff;
  }

  toString() {
    return `Coindesk API Http Request -
      Class:     ${ this.constructor.name },
      Retries:   ${ this.retries },
      Redirects: ${ this.redirects },
      Timeout:   ${ this.timeout },
      Backoff:   ${ this.backoff }`;
  }

  static start(retries = 10, redirects = 5, timeout = 5000, backoff = true) {
    [retries, redirects, timeout, backoff] = this.validate(retries, redirects, timeout, backoff);
    return new this(retries, redirects, timeout, backoff);
  }

  static validate(retries, redirects, timeout, backoff) {
    // retries = utils.validateRetries(retries);
    // redirects = utils.validateRedirects(redirects);
    // timeout = utils.validateTimeout(timeout);
    // backoff = utils.validateBackoff(backoff);
    return [retries, redirects, timeout, backoff];
  }

  get retries() {
    return _private(this).retries;
  }

  set retries(retries) {
    // retries = utils.validateRetries(retries);
    _private(this).retries = retries;
  }

  get redirects() {
    return _private(this).redirects;
  }

  set redirects(redirects) {
    // redirects = utils.validateRedirects(redirects);
    _private(this).redirects = redirects;
  }

  get timeout() {
    return _private(this).timeout;
  }

  set timeout(timeout) {
    // timeout = utils.validateTimeout(timeout);
    _private(this).timeout = timeout;
  }

  get backoff() {
    return _private(this).backoff;
  }

  set backoff(backoff) {
    // backoff = utils.validateBackoff(backoff);
    _private(this).backoff = backoff;
  }

  async get(url, params = {}, raw = false) {
    url = this._getParsedUrl(url, params);
    const options = this._getRequestOptions();
    let response;

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

  async _httpRequest(url, options) {
    for (let retry = 1; retry <= this.retries; retry++) {
      try {
        return await axios.get(url.href, options);
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

  _checkResponseStatus(response) {
    const { status: statusCode, statusText } = response;

    if (statusCode === 403 || statusCode === 404) {
      const message = `Response status code ${ statusCode } - ${ statusText }`;
      logger.error(`[CoindeskAPIHttpRequest] Request error: ${ message }`);
      throw new CoindeskAPIHttpRequestError(message);
    } else {
      const message = `Status code ${ statusCode }`;
      logger.info(`[CoindeskAPIHttpRequest] Request success: ${ message }`);
    }
  }

  _getParsedUrl(url, params) {
    const encodedParams = this._getEncodedParams(params);
    url = encodedParams !== '' ? `${ url }?${ encodedParams }` : url;
    return new URL(url);
  }

  _getEncodedParams(params) {
    return Object.keys(params).map(key => {
      return `${ encodeURIComponent(key) }=${ encodeURIComponent(params[key]) }`;
    }).join('&');
  }

  _getRequestOptions() {
    return {
      headers: this._getHeaders(),
      responseType: 'json',
      maxRedirects: this.redirects,
      timeout: this.timeout
    };
  }

  _getHeaders() {
    const headers = settings.REQUEST_HEADERS;
    return new Headers(headers);
  }

  _waitExponentialBackoff(timeout) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), timeout);
    });
  }
}

module.exports = { CoindeskAPIHttpRequest };
