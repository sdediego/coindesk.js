/*
 * Class-based errors for Coindesk API client.
 */

class BaseError extends Error {
  constructor(message, code) {
    if (code !== null) {
      message = `${ message } - Error code ${ code }`;
    }

    super(message);
    this.code = code;
    this.message = message;
  }
}

class CoindeskAPIHttpRequestError extends BaseError {
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
  CoindeskAPIHttpRequestError,
  LogServiceError
};
