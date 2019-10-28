/**
 * Coindesk API client logger service.
 *
 * @file Defines logger function for each file when called.
 */

const path = require('path');
const { createLogger, format, transports } = require('winston');
const { config: logConfig } = require('./config');

const { combine, colorize, label, printf, timestamp } = format;

/**
 * Creates and returns a logger function for the specified file.
 *
 * Should be called at the begging of the file we want to create
 * a logger to, providing the filename.
 *
 * @access public
 *
 * @function
 * @param  {String}   filename File to log.
 * @return {Function} Logger function.
 */
let getLogger = (filename) => {
  const logger = createLogger({
    level: logConfig.level,
    format: combine(
      colorize(),
      label({ label: path.basename(filename) }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      printf(info => {
        return `${ info.timestamp } ${ info.level } [${ info.label }]: ${ info.message }`;
      })
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: `${ logConfig.filePath }`})
    ],
    silent: logConfig.silent
  });

  return logger;
};

module.exports = { getLogger };
