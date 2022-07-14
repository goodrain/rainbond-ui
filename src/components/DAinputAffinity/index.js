import { Col, Icon, Input, notification, Row, Select } from 'antd';
import React, { Component } from 'react';

const { Option } = Select;
class DAinputs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: [{ key: '', operator: '', values: '' }]
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
  onValuesChange = (value, index) => {
    const { values } = this.state;
    values[index].values = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  setValues(arr) {
    const setArr = arr || [];
    if (!setArr.length) {
      setArr.push({ key: '', operator: '', values: '' });
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
      values: values.concat({ key: '', operator: '', values: '' })
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
        values: values[i].values
      });
    }
    const { onChange } = this.props;
    if (onChange) {
      onChange(res);
    }
  }

  render() {
    const keyPlaceholder = this.props.keyPlaceholder || 'key';
    const repPlaceholder = this.props.repPlaceholder || 'operator';
    const valuesPlaceholder = this.props.valuesPlaceholder || 'values';
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
                    marginRight: '27px'
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
                  name="operator"
                  allowClear
                  value={item.operator}
                  onChange={e => {
                    this.onOperatorChange(e, index);
                  }}
                >
                  <Select.Option value="In">In</Select.Option>
                  <Select.Option value="NotIn">NotIn</Select.Option>
                  <Select.Option value="Exists">Exists</Select.Option>
                  <Select.Option value="DoesNotExist">DoesNotExist</Select.Option>
                  <Select.Option value="Gt">Gt</Select.Option>
                  <Select.Option value="Lt">Lt</Select.Option>
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
                  name="values"
                  onChange={e => {
                    this.onValuesChange(e.target.value, index);
                  }}
                  value={item.values}
                  placeholder={valuesPlaceholder}
                />
              </Col>
              
              <Col span={1}>
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
