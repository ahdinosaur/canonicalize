/* jshint esversion: 6 */
/* jslint node: true */
'use strict';

module.exports = serialize;

function serialize (object) {
  if (typeof object === 'number' && isNaN(object)) {
    throw new Error('NaN is not allowed');
  }

  if (typeof object === 'number' && !isFinite(object)) {
    throw new Error('Infinity is not allowed');
  }

  if (typeof object === 'string' && !isWellFormed(object)) {
    throw new Error('Strings must be valid Unicode and not contain any surrogate pairs');
  }

  if (object === null || typeof object !== 'object') {
    return JSON.stringify(object);
  }

  if (object.toJSON instanceof Function) {
    return serialize(object.toJSON());
  }

  if (Array.isArray(object)) {
    return serializeArray(object);
  }

  return serializeObject(object);
}

function serializeArray (arr) {
  let values = '';
  for (let ci = 0; ci < arr.length; ci++) {
    const cv = arr[ci];
    const comma = ci === 0 ? '' : ',';
    const value = cv === undefined || typeof cv === 'symbol' ? null : cv;
    values += `${comma}${serialize(value)}`;
  }
  return `[${values}]`;
}

function serializeObject (object) {
  const sortedKeys = sort(Object.keys(object));
  let values = '';
  for (let ci = 0; ci < sortedKeys.length; ci++) {
    const cv = sortedKeys[ci];
    if (object[cv] === undefined || typeof object[cv] === 'symbol') {
      continue;
    }
    const comma = values.length === 0 ? '' : ',';
    values += `${comma}${serialize(cv)}:${serialize(object[cv])}`;
  }
  return `{${values}}`;
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

function isWellFormed (str) {
  if (typeof String.prototype.isWellFormed === 'function') {
    return str.isWellFormed();
  }

  // https://github.com/tc39/proposal-is-usv-string
  // https://github.com/zloirock/core-js/blob/d6ad38c/packages/core-js/modules/esnext.string.is-well-formed.js
  const length = str.length;
  for (let i = 0; i < length; i++) {
    const charCode = str.charCodeAt(i);
    // single UTF-16 code unit
    if ((charCode & 0xF800) !== 0xD800) continue;
    // unpaired surrogate
    if (charCode >= 0xDC00 || ++i >= length || (str.charCodeAt(i) & 0xFC00) !== 0xDC00) return false;
  }
  return true;
}
