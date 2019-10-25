/**
 * Coindesk API client weakmap for private properties.
 *
 * @file Defines weakmap instance providing private access to instance properties.
 */

const internal = new WeakMap();

/**
 * Creates and returns an object attached to certain instance
 * to provide private access.
 *
 * @access private
 *
 * @function
 * @param  {String} key Instance to set private access to.
 * @return {Object} Object attached to the provided key.
 */
let _private = (key) => {
  if (!internal.has(key)) internal.set(key, {});
  return internal.get(key);
};

module.exports = { _private };
