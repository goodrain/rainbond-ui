import React, { PureComponent, Fragment } from 'react';
import { Form } from 'antd';

@Form.create()
export default class PluginInfo extends PureComponent {
  componentDidMount() {}

  getValue = fun => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        fun(values);
      }
    });
  };
  handleCheckChange = (appname, val, e) => {
    const name = {};
    const thisval = val;
    name[appname] = '**None**';
    if (e.target.checked) {
      this.props.form.setFieldsValue(name);
    } else {
      name[appname] = thisval;
      this.props.form.setFieldsValue(name);
    }
  };

  render() {
    return <Fragment>{this.props.plugin.plugin_alias}</Fragment>;
  }
}
