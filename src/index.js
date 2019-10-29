/**
 * Coindesk API client.
 *
 * Coindesk API client importable classes are defined in
 * this file.
 *
 * @link   https://github.com/sdediego/coindesk.js
 * @file   Defines importable Coindesk API client classes.
 * @author Sergio de Diego.
 * @since  2019.10.29
 */

const { CoindeskAPIClient, CoindeskAPIResponse } = require('./coindesk/client');

module.exports = {
    CoindeskAPIClient,
    CoindeskAPIResponse
};
