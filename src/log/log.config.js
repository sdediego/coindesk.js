/*
 * Coindesk API client logger configuration.
 */

const Joi = require('@hapi/joi');
const { LogServiceError } = require('../errors');
const settings = require('../settings');

const logSchema = Joi.object().keys({
  LOG_LEVEL: Joi.string().allow(...settings.VALID_LOG_LEVELS).default(settings.DEFAULT_LOG_LEVEL),
  LOG_SILENT: Joi.boolean().default(settings.DEFAULT_LOG_SILENT),
  LOG_FILEPATH: Joi.string().regex(/^(.+)\/([^/]+)$/).default(settings.DEFAULT_LOG_FILEPATH)
}).unknown(true);

const { error, value } = logSchema.validate(process.env);
if (error) {
  const message = `Log configuration validation error: ${ error.message }`;
  throw new LogServiceError(message);
}

const config = {
  log: {
    level: value.LOG_LEVEL,
    silent: value.LOG_SILENT,
    filePath: value.LOG_FILEPATH
  }
};

module.exports = { config };
