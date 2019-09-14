/*
 * Coindesk API client weakmap for private properties.
 */

const internal = new WeakMap();

let _private = (key) => {
  if (!internal.has(key)) internal.set(key, {});
  return internal.get(key);
};

module.exports = { _private };
