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

module.exports = {
  KEY_VALUE_JSON_FIELDS,
  buildEditableAttributeFields,
  formatRawJsonAttributeDisplayValue,
  formatRawJsonAttributeValue,
  isRawJsonAttribute,
  parseRawJsonAttributeValue
};
