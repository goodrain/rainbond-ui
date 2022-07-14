import { Col, Icon, Input, notification, Row, Select } from 'antd';
import React, { Component } from 'react';

const { Option } = Select;
class DAinputs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: [{ key: '', operator: '', value: '', effect: '' }]
    };
  }
  componentDidMount() {
    this.initFromProps();
  }

  componentWillReceiveProps(nextProps) {
    if ('value' in nextProps) {
      const { value } = nextProps;
      this.initFromProps(value);
    }
  }
  onKeyChange = (value, index) => {
    const { values } = this.state;
    values[index].key = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onOperatorChange = (value, index) => {
    const { values } = this.state;
    values[index].operator = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onValueChange = (value, index) => {
    const { values } = this.state;
    values[index].value = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onEffectChange = (value, index) => {
    const { values } = this.state;
    values[index].effect = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  setValues(arr) {
    const setArr = arr || [];
    if (!setArr.length) {
      setArr.push({ key: '', operator: '', value: '', effect: '' });
    }
    this.setState({ values: setArr });
  }
  initFromProps(value) {
    const setValue = value || this.props.value;
    if (setValue) {
      this.setValues(setValue);
    }
  }
  add = () => {
    const { values } = this.state;
    if (values.length > 100) {
      notification.warning({
        message: '最多添加100个'
      });
      return null;
    }
    this.setState({
      values: values.concat({ key: '', operator: '', value: '', effect: ''  })
    });
  };

  remove = index => {
    const { values } = this.state;
    values.splice(index, 1);
    this.setValues(values);
    this.triggerChange(values);
  };
  triggerChange(values) {
    const res = [];
    for (let i = 0; i < values.length; i++) {
      res.push({
        key: values[i].key,
        operator: values[i].operator,
        value: values[i].value,
        effect: values[i].effect
      });
    }
    const { onChange } = this.props;
    if (onChange) {
      onChange(res);
    }
  }

  render() {
    const keyPlaceholder = this.props.keyPlaceholder || 'key';
    const repPlaceholder = this.props.repPlaceholder || 'value';
    const valuePlaceholder = this.props.valuePlaceholder || 'value';
    const { values, data } = this.state;
    return (
      <div>
        {values.map((item, index) => {
          const first = index === 0;
          return (
            <Row key={index}>
              <Col
                span={4}
                style={{
                  textAlign: 'center',
                  marginRight: '30px'
                }}
              >
                <Input
                  name="key"
                  onChange={e => {
                    this.onKeyChange(e.target.value, index);
                  }}
                  value={item.key}
                  placeholder={keyPlaceholder}
                />
              </Col>
              <Col
                span={4}
                style={{
                  textAlign: 'center',
                  marginRight: '27px'
                }}
              >
                <Select
                  name="value"
                  allowClear
                  value={item.value}
                  onChange={e => {
                    this.onValueChange(e, index);
                  }}
                >
                  <Select.Option value="Exists">Exists</Select.Option>
                  <Select.Option value="Equal">Equal</Select.Option>
                </Select>
              </Col>
              <Col
                span={4}
                style={{
                  textAlign: 'center',
                  marginRight: '27px'
                }}
              >
                <Input
                  name="operator"
                  onChange={e => {
                    this.onOperatorChange(e.target.value, index);
                  }}
                  value={item.operator}
                  placeholder={repPlaceholder}
                />
              </Col>
              <Col span={4}>
                <Select
                  name="effect"
                  allowClear
                  value={item.effect}
                  onChange={e => {
                    this.onEffectChange(e, index);
                  }}
                >
                  <Select.Option value="NoSchedule">NoSchedule</Select.Option>
                  <Select.Option value="PreferNoSchedule">PreferNoSchedule</Select.Option>
                  <Select.Option value="NoExecute">NoExecute</Select.Option>
                </Select>
              </Col>
              <Col span={2} style={{ textAlign: 'center' }}>
                <Icon
                  type={first ? 'plus-circle' : 'minus-circle'}
                  style={{ fontSize: '20px' }}
                  onClick={() => {
                    if (first) {
                      this.add();
                    } else {
                      this.remove(index);
                    }
                  }}
                />
              </Col>
            </Row>
          );
        })}
      </div>
    );
  }
}

export default DAinputs;
