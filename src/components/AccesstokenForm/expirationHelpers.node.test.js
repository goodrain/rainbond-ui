const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const parser = require('@babel/parser');
const moment = require('moment');
const { MAX_ACCESS_TOKEN_EXPIRE_TIME, getAccessTokenExpiration } = require('./expirationHelpers');

const NOW = Date.UTC(2030, 0, 1, 12);
const MAX_MS = MAX_ACCESS_TOKEN_EXPIRE_TIME * 1000;
const EXPIRY_MESSAGE = 'otherEnterprise.AccesstokenForm.expiry_range';
const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const ast = parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
const declaration = ast.program.body.find(node => node.type === 'ClassDeclaration' && node.id.name === 'AccesstokenForm');
const methods = declaration.body.body.filter(node => node.key.name !== 'render')
  .map(node => source.slice(node.start, node.end)).join('\n');

function localeMessage(locale) {
  const localePath = path.join(__dirname, '../../locales', locale, 'enterprise.js');
  const localeAst = parser.parse(fs.readFileSync(localePath, 'utf8'), { sourceType: 'module' });
  const properties = localeAst.program.body.filter(node => node.type === 'VariableDeclaration')
    .flatMap(node => node.declarations)
    .filter(node => node.init && node.init.type === 'ObjectExpression')
    .flatMap(node => node.init.properties);
  return properties.find(node => node.key.value === EXPIRY_MESSAGE).value.value;
}

function harness({ age = '', validationError = null, deferred = false, locale = 'en-US' } = {}) {
  const requests = [];
  const fields = [];
  const values = { note: 'local validation fixture', age };
  let validationCallback;
  class PureComponent {
    constructor(props) { this.props = props; }
    setState(next) { this.state = { ...this.state, ...next }; }
  }
  const formatMessage = ({ id }, replacements) => {
    assert.equal(id, EXPIRY_MESSAGE);
    return localeMessage(locale).replace('{max}', replacements.max);
  };
  const ActualForm = new Function(
    'PureComponent', 'moment', 'formatMessage', 'notification',
    'MAX_ACCESS_TOKEN_EXPIRE_TIME', 'getAccessTokenExpiration',
    `return class extends PureComponent { ${methods} };`
  )(PureComponent, moment, formatMessage, { warning() {} },
    MAX_ACCESS_TOKEN_EXPIRE_TIME, getAccessTokenExpiration);
  const instance = new ActualForm({
    form: {
      validateFields(callback) {
        validationCallback = callback;
        if (!deferred) callback(validationError, values);
      },
      setFields(update) { fields.push(update); }
    },
    dispatch(action) { requests.push(action); },
    onOk() {}, onCancel() {}
  });
  return { instance, requests, fields, values,
    finishValidation() { validationCallback(validationError, values); } };
}

function validate(instance, value) {
  const results = [];
  instance.validateExpiry({}, value, error => results.push(error));
  assert.equal(results.length, 1);
  return results[0];
}

test('blank values preserve optional permanent expiry', () => {
  for (const value of [undefined, null, '']) {
    assert.deepEqual(getAccessTokenExpiration(value, NOW), { valid: true, empty: true });
  }
});

test('selected future dates produce whole positive seconds without mutating the date', () => {
  const selected = moment(NOW + 62500);
  assert.deepEqual(getAccessTokenExpiration(selected, NOW), { valid: true, empty: false, age: 62 });
  assert.equal(selected.valueOf(), NOW + 62500);
});

test('the exact signed integer expiry ceiling is accepted and the next second is rejected', () => {
  assert.deepEqual(getAccessTokenExpiration(moment(MAX_MS), NOW), {
    valid: true, empty: false, age: Math.floor((MAX_MS - NOW) / 1000)
  });
  assert.deepEqual(getAccessTokenExpiration(moment(MAX_MS + 1000), NOW), { valid: false, empty: false });
});

test('invalid or expired selections cannot become a permanent age of zero', () => {
  for (const value of [moment.invalid(), new Date(NaN), moment(NOW - 1), moment(NOW), moment(NOW + 999),
    NaN, Infinity, -Infinity, '2040-01-01', { valueOf() { throw new Error('invalid fixture'); } }]) {
    assert.deepEqual(getAccessTokenExpiration(value, NOW), { valid: false, empty: false });
  }
  assert.deepEqual(getAccessTokenExpiration(moment(NOW + 1000), NOW), { valid: true, empty: false, age: 1 });
});

test('invalid clock inputs fail closed for a selected expiry', () => {
  for (const nowMs of [NaN, Infinity, undefined, null, '2030']) {
    // undefined invokes the default clock, so use an already expired date for that case.
    const value = nowMs === undefined ? moment(1) : moment(NOW + 60000);
    assert.deepEqual(getAccessTokenExpiration(value, nowMs), { valid: false, empty: false });
  }
});

test('actual submit preserves the blank permanent value without generating credentials', t => {
  t.mock.method(Date, 'now', () => NOW);
  for (const age of [undefined, null, '']) {
    const h = harness({ age });
    // The default parameter represents an omitted form value; exercise undefined explicitly too.
    h.values.age = age;
    h.instance.handleSubmit();
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].type, 'user/addAccessToken');
    assert.equal(h.requests[0].payload.age, age);
    assert.deepEqual(h.fields, []);
  }
});

test('actual submit converts a valid selection and never executes a network effect', t => {
  t.mock.method(Date, 'now', () => NOW);
  const h = harness({ age: moment(NOW + 62500) });
  h.instance.handleSubmit();
  assert.equal(h.requests.length, 1);
  assert.deepEqual(h.requests[0].payload, { note: 'local validation fixture', age: 62 });
  assert.deepEqual(h.fields, []);
});

test('actual submit rejects invalid values with a field error and no dispatch', t => {
  t.mock.method(Date, 'now', () => NOW);
  for (const age of [moment.invalid(), moment(NOW), moment(NOW + 999), moment(MAX_MS + 1000)]) {
    const h = harness({ age });
    h.instance.handleSubmit();
    assert.equal(h.requests.length, 0);
    assert.equal(h.instance.state.loading, false);
    assert.equal(h.fields.length, 1);
    assert.equal(h.fields[0].age.value, age);
    assert.equal(h.fields[0].age.errors[0].message, h.instance.getExpiryError());
  }
});

test('actual submit rechecks an expiry that becomes invalid after form validation started', t => {
  let nowMs = NOW;
  t.mock.method(Date, 'now', () => nowMs);
  const age = moment(NOW + 1000);
  const h = harness({ age, deferred: true });
  assert.equal(validate(h.instance, age), undefined);
  h.instance.handleSubmit();
  nowMs += 1001;
  h.finishValidation();
  assert.equal(h.requests.length, 0);
  assert.equal(h.fields.length, 1);
  assert.equal(h.fields[0].age.errors[0].message, h.instance.getExpiryError());
});

test('an existing form validation error never dispatches', t => {
  t.mock.method(Date, 'now', () => NOW);
  const h = harness({ age: moment(NOW + 60000), validationError: { note: 'required' } });
  h.instance.handleSubmit();
  assert.equal(h.requests.length, 0);
  assert.deepEqual(h.fields, []);
});

for (const timezone of ['UTC', 'Asia/Shanghai']) {
  test(`actual validator and calendar retain the final allowed day in ${timezone}`, t => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = timezone;
    t.after(() => {
      if (previousTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = previousTimezone;
    });
    t.mock.method(Date, 'now', () => NOW);
    const h = harness();
    const maximum = moment(MAX_MS);
    const maximumValue = maximum.valueOf();
    for (const blank of [undefined, null, '']) assert.equal(validate(h.instance, blank), undefined);
    assert.equal(validate(h.instance, maximum), undefined);
    assert.equal(h.instance.disabledDate(maximum), false);
    assert.equal(maximum.valueOf(), maximumValue, 'calendar guard must not mutate the selected moment');
    assert.equal(h.instance.disabledDate(maximum.clone().add(1, 'day')), true);
    assert.equal(h.instance.disabledDate(moment(NOW)), true, 'today remains disabled');
    assert.equal(h.instance.disabledDate(moment(NOW).subtract(1, 'day')), true);
    assert.equal(h.instance.disabledDate(moment(NOW).add(1, 'day')), false);
    assert.equal(h.instance.disabledDate(null), null);
    assert.equal(validate(h.instance, maximum.clone().add(1, 'second')), h.instance.getExpiryError());
    assert.equal(validate(h.instance, moment(NOW + 999)), h.instance.getExpiryError());
    assert.equal(validate(h.instance, moment.invalid()), h.instance.getExpiryError());
    const localMaximum = timezone === 'UTC' ? '2038-01-19 03:14:07' : '2038-01-19 11:14:07';
    assert.equal(h.instance.getExpiryError(), `Choose an expiration time in the future and no later than ${localMaximum}.`);
    const chinese = harness({ locale: 'zh-CN' });
    assert.equal(chinese.instance.getExpiryError(), `请选择未来且不晚于 ${localMaximum} 的过期时间`);
    const submitted = harness({ age: maximum });
    submitted.instance.handleSubmit();
    assert.equal(submitted.requests.length, 1);
    assert.equal(submitted.requests[0].payload.age, Math.floor((MAX_MS - NOW) / 1000));
  });
}

test('the actual form wires its optional age validator and retains time selection', () => {
  const render = declaration.body.body.find(node => node.key.name === 'render');
  const renderSource = source.slice(render.start, render.end);
  assert.match(renderSource, /getFieldDecorator\('age',\s*\{[\s\S]*required: false[\s\S]*validator: this\.validateExpiry/);
  assert.match(renderSource, /disabledDate=\{this\.disabledDate\}/);
  assert.match(renderSource, /disabledTime=\{this\.disabledDateTime\}/);
  assert.match(renderSource, /showTime=\{/);
});
