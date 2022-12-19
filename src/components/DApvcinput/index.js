import { Col, Icon, Input, notification, Row, Select } from 'antd';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
const { Option } = Select;
class DAinputs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: [{ key: '', value: '' }]
    };
  }
  componentDidMount() {
    this.initFromProps();
  }

  onkeyChange = (value, index) => {
    const { values } = this.state;
    values[index].key = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onvalueChange = (value, index) => {
    const { values } = this.state;
    values[index].value = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  setValues(arr) {
    const setArr = arr || [];
    if (!setArr.length) {
      setArr.push({ key: '', value: '' });
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
        message: formatMessage({id:'notification.warn.add_max'})
      });
      return null;
    }
    this.setState({
      values: values.concat({ key: '', value: '' })
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
        value: values[i].value
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
    const { values } = this.state;
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
                    this.onkeyChange(e.target.value, index);
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
                <Input
                  name="value"
                  onChange={e => {
                    this.onvalueChange(e.target.value, index);
                  }}
                  value={item.value}
                  placeholder={repPlaceholder}
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
