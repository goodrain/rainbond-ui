const KEY_VALUE_JSON_FIELDS = ['nodeSelector', 'labels', 'annotations'];

function isRawJsonAttribute(name, attribute = {}) {
  return attribute.save_type === 'json' && KEY_VALUE_JSON_FIELDS.indexOf(name) === -1;
}

function formatRawJsonAttributeValue(value) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch (e) {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

function formatRawJsonAttributeDisplayValue(value) {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

function parseRawJsonAttributeValue(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return JSON.parse(value);
}

function buildEditableAttributeFields(fields, currentField) {
  if (!currentField || fields.indexOf(currentField) > -1) {
    return fields;
  }
  return [currentField].concat(fields);
}

function normalizeBooleanAttributeValue(value) {
  return value === true || value === 'true';
}

function normalizeKeyValueAttributeValue(value) {
  const normalizeDisplayValue = itemValue => {
    if (itemValue === undefined || itemValue === null) {
      return '';
    }
    if (typeof itemValue === 'object') {
      return JSON.stringify(itemValue);
    }
    return String(itemValue);
  };
  if (Array.isArray(value)) {
    return value
      .filter(
        item =>
          item &&
          typeof item === 'object' &&
          Object.prototype.hasOwnProperty.call(item, 'key')
      )
      .map(item => ({
        ...item,
        key: String(item.key),
        value: normalizeDisplayValue(item.value)
      }));
  }
  if (typeof value === 'string') {
    try {
      return normalizeKeyValueAttributeValue(JSON.parse(value));
    } catch (error) {
      return [];
    }
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).map(key => ({
      key,
      value: normalizeDisplayValue(value[key])
    }));
  }
  return [];
}

module.exports = {
  KEY_VALUE_JSON_FIELDS,
  buildEditableAttributeFields,
  formatRawJsonAttributeDisplayValue,
  formatRawJsonAttributeValue,
  isRawJsonAttribute,
  normalizeBooleanAttributeValue,
  normalizeKeyValueAttributeValue,
  parseRawJsonAttributeValue
};
