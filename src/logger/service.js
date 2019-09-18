/*
 * Coindesk API client logger service.
 */

const path = require('path');
const { createLogger, format, transports } = require('winston');
const { config: logConfig } = require('./config');

const { combine, colorize, label, printf, timestamp } = format;

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
