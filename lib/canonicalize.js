/* jshint esversion: 6 */
/* jslint node: true */
'use strict';

module.exports = serialize;

function serialize (value) {
  const type = typeof value;

  switch (type) {
    case 'undefined':
    case 'symbol':
      return undefined;
    case 'boolean':
      if (value) return 'true';
      else return 'false';
    case 'string':
      if (!isWellFormed(value)) {
        throw new Error('Strings must be valid Unicode and not contain any surrogate pairs');
      }
      if (value.length < 5000 && !hasEscapeSequence(value)) {
        return '"' + value + '"';
      }
      return JSON.stringify(value);
    case 'number':
      if (isNaN(value)) {
        throw new Error('NaN is not allowed');
      }
      if (!isFinite(value)) {
        throw new Error('Infinity is not allowed');
      }
      return JSON.stringify(value);
    case 'object':
      break;
    default:
      return JSON.stringify(value);
  }

  if (value === null) {
    return JSON.stringify(value);
  }

  if (value.toJSON instanceof Function) {
    return serialize(value.toJSON());
  }

  if (Array.isArray(value)) {
    return serializeArray(value);
  }

  return serializeObject(value);
}

function serializeArray (arr) {
  let str = '[';
  const length = arr.length;
  for (let i = 0; i < length; i++) {
    const val = arr[i];
    if (i !== 0) str += ',';
    if (val === undefined || typeof val === 'symbol') {
      str += 'null';
    } else {
      str += serialize(val);
    }
  }
  return str + ']';
}

function serializeObject (obj) {
  const sortedKeys = sort(Object.keys(obj));
  let str = '{';
  const length = sortedKeys.length;
  for (let i = 0; i < length; i++) {
    const key = sortedKeys[i];
    const val = obj[key];
    if (val === undefined || typeof val === 'symbol') {
      continue;
    }
    if (i !== 0 && str.length !== 0) {
      str += ',';
    }
    str += serialize(key) + ':' + serialize(val);
  }
  return str + '}';
}

// https://github.com/BridgeAR/safe-stable-stringify/blob/26dc000/index.js#L35-L51
function sort (array) {
  // Insertion sort is very efficient for small input sizes but it has a bad
  // worst case complexity. Thus, use native array sort for bigger values.
  if (array.length > 2e2) {
    return array.sort();
  }
  for (let i = 1; i < array.length; i++) {
    const currentValue = array[i];
    let position = i;
    while (position !== 0 && array[position - 1] > currentValue) {
      array[position] = array[position - 1];
      position--;
    }
    array[position] = currentValue;
  }
  return array;
}

// https://github.com/BridgeAR/safe-stable-stringify/blob/26dc000/index.js#L22-L33
// eslint-disable-next-line no-control-regex
const stringEscapeSequencesRegExp = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]|[\ud800-\udbff](?![\udc00-\udfff])|(?:[^\ud800-\udbff]|^)[\udc00-\udfff]/;

function hasEscapeSequence (str) {
  return stringEscapeSequencesRegExp.test(str);
}

const stringSurrogateRegex = /\p{Surrogate}/u;

function isWellFormed (str) {
  if (typeof String.prototype.isWellFormed === 'function') {
    return str.isWellFormed();
  }

  return !stringSurrogateRegex.test(str);
}
