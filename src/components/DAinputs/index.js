import { Col, Icon, Input, notification, Row, Select } from 'antd';
import React, { Component } from 'react';

const { Option } = Select;
class DAinputs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: [{ regex: '', replacement: '', flag: '' }],
      data: ['last', 'break', 'redirect', 'permanent']
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
  onRegexChange = (value, index) => {
    const { values } = this.state;
    values[index].regex = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onReplacementChange = (value, index) => {
    const { values } = this.state;
    values[index].replacement = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onFlagChange = (value, index) => {
    const { values } = this.state;
    values[index].flag = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  setValues(arr) {
    const setArr = arr || [];
    if (!setArr.length) {
      setArr.push({ regex: '', replacement: '', flag: '' });
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
      values: values.concat({ regex: '', replacement: '', flag: '' })
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
        regex: values[i].regex,
        replacement: values[i].replacement,
        flag: values[i].flag
      });
    }
    const { onChange } = this.props;
    if (onChange) {
      onChange(res);
    }
  }

  render() {
    const regexPlaceholder = this.props.regexPlaceholder || 'regex';
    const repPlaceholder = this.props.repPlaceholder || 'replacement';
    const flagPlaceholder = this.props.flagPlaceholder || 'flag';
    const { values, data } = this.state;
    return (
      <div>
        {values.map((item, index) => {
          const first = index === 0;
          return (
            <Row key={index}>
              <Col span={6}>
                <Input
                  name="regex"
                  onChange={e => {
                    this.onRegexChange(e.target.value, index);
                  }}
                  value={item.regex}
                  placeholder={regexPlaceholder}
                />
              </Col>
              <Col
                span={7}
                style={{
                  textAlign: 'center',
                  marginLeft: '6px',
                  marginRight: '6px'
                }}
              >
                <Input
                  name="replacement"
                  onChange={e => {
                    this.onReplacementChange(e.target.value, index);
                  }}
                  value={item.replacement}
                  placeholder={repPlaceholder}
                />
              </Col>
              <Col span={6}>
                <Select
                  name="flag"
                  allowClear
                  value={item.flag}
                  onChange={e => {
                    this.onFlagChange(e, index);
                  }}
                >
                  <Select.Option value="last">last</Select.Option>
                  <Select.Option value="break">break</Select.Option>
                  <Select.Option value="redirect">redirect</Select.Option>
                  <Select.Option value="permanent">permanent</Select.Option>
                </Select>
              </Col>
              <Col span={4} style={{ textAlign: 'center' }}>
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
