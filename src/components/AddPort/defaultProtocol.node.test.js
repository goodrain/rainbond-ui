const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');

function compile(filename) {
  return babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false,
    presets: [
      [require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default
    ],
    plugins: [
      [require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
      [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]
    ]
  }).code;
}

const componentCode = compile(path.join(__dirname, 'index.js'));
const creationPortsCode = compile(path.join(__dirname, '../AppCreateConfigPort/index.js'));

// Keep the production class, field decorators and real rc-form store. Visual
// fixtures use native controls so these checks need no browser or port API.
async function withAddPort(props, verify) {
  const dom = new JSDOM('<!doctype html><div id="port-root"></div>', { url: 'http://127.0.0.1/' });
  const globals = {
    window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    MessageChannel: undefined,
    requestAnimationFrame: callback => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout
  };
  const previous = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
  Object.entries(globals).forEach(([key, value]) => Object.defineProperty(global, key, { configurable: true, writable: true, value }));
  dom.window.requestAnimationFrame = globals.requestAnimationFrame;
  dom.window.cancelAnimationFrame = clearTimeout;
  const ReactDOM = require('react-dom');
  const { act } = require('react-dom/test-utils');
  const NativeForm = require('antd/lib/form').default;
  const Form = ({ children, onSubmit }) => React.createElement('form', { onSubmit }, children);
  Form.create = NativeForm.create;
  Form.Item = ({ children }) => React.createElement('div', null, children);
  class Input extends React.Component {
    render() { return React.createElement('input', { ...this.props, value: this.props.value === undefined ? '' : this.props.value }); }
  }
  class Select extends React.Component {
    render() {
      const { value, onChange, disabled, children } = this.props;
      return React.createElement('select', { value, disabled, onChange: event => onChange(event.target.value) }, children);
    }
  }
  Select.Option = ({ value, children }) => React.createElement('option', { value }, children);
  const antd = { Form, Input, Select, Modal: ({ children }) => React.createElement('section', null, children) };
  const module = { exports: {} };
  new Function('module', 'exports', 'require', componentCode)(module, module.exports, name => {
    if (name === 'react') return React;
    if (name === 'antd') return antd;
    if (name === 'dva') return { connect: () => Component => Component };
    if (name === 'umi') return { FormattedMessage: ({ id }) => React.createElement('span', null, id) };
    if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
    if (name === '../../utils/cookie') return { get: () => 'zh-CN' };
    throw new Error(`Unexpected import: ${name}`);
  });
  const AddPort = module.exports.default;
  const root = document.getElementById('port-root');
  const submitted = [];
  let instance;
  const render = overrides => act(() => {
    ReactDOM.render(React.createElement(AddPort, {
      protocols: ['http', 'tcp', 'udp'], onOk: values => submitted.push(values),
      ...props, ...overrides, wrappedComponentRef: value => { instance = value; }
    }), root);
  });
  try {
    render();
    await verify({
      form: instance.props.form,
      get instance() { return instance; },
      select: () => root.querySelector('select'),
      rerender: render,
      changeProtocol(value) {
        act(() => {
          const select = root.querySelector('select');
          select.value = value;
          select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
        });
      },
      setFields: values => act(() => { instance.props.form.setFieldsValue(values); }),
      submit: () => act(() => { instance.handleSubmit({ preventDefault() {} }); }),
      submitted
    });
  } finally {
    act(() => { ReactDOM.unmountComponentAtNode(root); });
    dom.window.close();
    Object.entries(previous).forEach(([key, descriptor]) => {
      if (descriptor) Object.defineProperty(global, key, descriptor);
      else delete global[key];
    });
  }
}

test('a VM port starts with TCP while its protocol remains editable', async () => {
  await withAddPort({ extendMethod: 'vm' }, fixture => {
    assert.equal(fixture.form.getFieldValue('protocol'), 'tcp');
    assert.equal(fixture.select().value, 'tcp');
    assert.equal(fixture.select().disabled, false);
    assert.deepEqual(Array.from(fixture.select().options, option => option.value), ['http', 'tcp', 'udp']);
  });
});

test('the existing KubeBlocks TCP default and protocol restriction remain unchanged', async () => {
  await withAddPort({ extendMethod: 'kubeblocks_component' }, fixture => {
    assert.equal(fixture.form.getFieldValue('protocol'), 'tcp');
    assert.equal(fixture.select().disabled, true);
  });
});

for (const extendMethod of [undefined, 'stateless', 'stateful']) {
  test(`a container port keeps HTTP by default (${extendMethod || 'no extension'})`, async () => {
    await withAddPort({ extendMethod }, fixture => {
      assert.equal(fixture.form.getFieldValue('protocol'), 'http');
      assert.equal(fixture.select().disabled, false);
    });
  });
}

test('a VM user can choose HTTP or UDP and unrelated rerenders do not reset the selected protocol', async () => {
  await withAddPort({ extendMethod: 'vm' }, async fixture => {
    fixture.changeProtocol('http');
    assert.equal(fixture.form.getFieldValue('protocol'), 'http');
    fixture.rerender({ protocols: ['http', 'tcp', 'udp'], isDockerfile: true });
    assert.equal(fixture.select().value, 'http');
    fixture.changeProtocol('udp');
    fixture.rerender({ isDockerfile: false });
    assert.equal(fixture.form.getFieldValue('protocol'), 'udp');
    fixture.setFields({ port: '22' });
    fixture.submit();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(fixture.submitted.length, 1);
    assert.equal(fixture.submitted[0].protocol, 'udp');
    assert.equal(fixture.submitted[0].port, '22');
  });
});

test('prepopulated protocol values survive VM default registration and subsequent renders', async () => {
  await withAddPort({ extendMethod: 'vm' }, fixture => {
    fixture.setFields({ port: '3389', protocol: 'udp' });
    fixture.rerender({ isImageApp: true });
    assert.equal(fixture.form.getFieldValue('port'), '3389');
    assert.equal(fixture.form.getFieldValue('protocol'), 'udp');
    assert.equal(fixture.select().value, 'udp');
  });
});

test('the original creation configuration passes the service extension to AddPort', () => {
  const box = () => null;
  const Form = Object.assign(box, { create: () => Component => Component, Item: box });
  const Collapse = Object.assign(() => null, { Panel: box });
  const AddPortToken = () => null;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', `${creationPortsCode}\nexports.CreationPorts = Ports;`)(module, module.exports, name => {
    if (name === 'react') return React;
    if (name === 'antd') return { Form, Collapse, ...Object.fromEntries(['Alert', 'Button', 'Col', 'Icon', 'Input', 'Row', 'Switch', 'Table', 'Tooltip', 'Tag'].map(key => [key, box])) };
    if (name === 'dva') return { connect: () => Component => Component };
    if (name === 'umi') return { FormattedMessage: box };
    if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
    if (name === '../../utils/app') return { isImageApp: () => false, isDockerfile: () => false };
    if (name === '../../components/AddPort') return AddPortToken;
    return {};
  });
  const CreationPorts = module.exports.CreationPorts;
  const instance = new CreationPorts({ appDetail: { service: { extend_method: 'vm' } } });
  instance.state.showAddPort = true;
  const find = element => {
    if (!React.isValidElement(element)) return undefined;
    if (element.type === AddPortToken) return element;
    return React.Children.toArray(element.props.children).map(find).find(Boolean);
  };
  const addPort = find(instance.render());
  assert.ok(addPort, 'the creation view must render its AddPort component');
  assert.equal(addPort.props.extendMethod, 'vm');
});
