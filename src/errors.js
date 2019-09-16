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
