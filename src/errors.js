/**
 * Class-based errors for Coindesk API client.
 *
 * @file Defines custom errors for application classes.
 */

/**
 * Constructs an instance of BaseError class.
 *
 * Provides the ability to create a new BaseError instance
 * with custom message and code.
 *
 * @access public
 * @class
 */
class BaseError extends Error {

  /**
   * Constructs an instance of BaseError class.
   *
   * @access     public
   * @constructs BaseError
   *
   * @constructor
   * @param  {Number}    message Custom error message to provide information.
   * @param  {String}    code    Custom error number code.
   * @return {BaseError} Class instance.
   */
  constructor(message, code) {
    if (code !== null) {
      message = `${ message } - Error code ${ code }`;
    }

    super(message);
    this.code = code;
    this.message = message;
  }
}

class CoindeskAPIClientError extends BaseError {
  constructor(message, code = null) {
    super(message, code);
  }
}

class CoindeskAPIHttpRequestError extends BaseError {
  constructor(message, code = null) {
    super(message, code);
  }
}

class CoindeskAPIHttpResponseError extends BaseError {
  constructor(message, code = null) {
    super(message, code);
  }
}

class LogServiceError extends BaseError {
  constructor(message, code = null) {
    super(message, code);
  }
}

module.exports = {
  CoindeskAPIClientError,
  CoindeskAPIHttpRequestError,
  CoindeskAPIHttpResponseError,
  LogServiceError
};
