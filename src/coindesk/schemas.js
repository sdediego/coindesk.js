/*
 * Coindesk API response schemas.
 */

const Joi = require('@hapi/joi');

const currentpriceSchema = Joi.object().keys({
  time: Joi.object().keys({
    updated: Joi.date().required(),
    updatedISO: Joi.date().iso().required(),
    updateduk: Joi.string().required()
  }).required(),
  chartName: Joi.string().alphanum().required(),
  disclaimer: Joi.string().required(),
  bpi: Joi.object().keys({
    USD: Joi.object().keys({
      code: Joi.string().regex(/^USD$/).required(),
      symbol: Joi.string().regex(/^\$|&#36;$/).required(),
      rate: Joi.string().regex(/^[0-9.,]$/).required(),
      description: Joi.string().alphanum().required(),
      rate_float: Joi.number().positive().required()
    }).required(),
    GBP: Joi.object().keys({
      code: Joi.string().regex(/^GBP$/).required(),
      symbol: Joi.string().regex(/^\£|&pound;$/).required(),
      rate: Joi.string().regex(/^[0-9.,]$/).required(),
      description: Joi.string().alphanum().required(),
      rate_float: Joi.number().positive().required()
    }).required(),
    EUR: Joi.object().keys({
      code: Joi.string().regex(/^GBP$/).required(),
      symbol: Joi.string().regex(/^\€|&euro;$/).required(),
      rate: Joi.string().regex(/^[0-9.,]$/).required(),
      description: Joi.string().alphanum().required(),
      rate_float: Joi.number().positive().required()
    }).required()
  }).required()
}).required();

const currentpriceCurrencySchema = Joi.object().keys({
  time: Joi.object().keys({
    updated: Joi.date().required(),
    updatedISO: Joi.date().iso().required(),
    updateduk: Joi.string().required()
  }).required(),
  disclaimer: Joi.string().required(),
  bpi: Joi.object().keys({
    USD: Joi.object().keys({
      code: Joi.string().regex(/^USD$/).required(),
      rate: Joi.string().regex(/^[0-9.,]$/).required(),
      description: Joi.string().alphanum().required(),
      rate_float: Joi.number().positive().required()
    }).pattern(/^[A-Z]$/, Joi.object().keys({
      code: Joi.string().regex(/^[A-Z]$/).required(),
      rate: Joi.string().regex(/^[0-9.,]$/).required(),
      description: Joi.string().alphanum().required(),
      rate_float: Joi.number().positive().required()
    }).required())
  }).required()
}).required();

const historicalSchema = Joi.object().keys({
  time: Joi.object().keys({
    updated: Joi.date().required(),
    updatedISO: Joi.date().iso().required()
  }).required(),
  disclaimer: Joi.string().required(),
  bpi: Joi.object().pattern(/^\d{4}-\d{2}-\d{2}$/, Joi.number().positive())
}).required();

module.exports = {
  currentpriceSchema,
  currentpriceCurrencySchema,
  historicalSchema
};
