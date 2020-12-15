/* eslint-disable react/jsx-no-bind */
import React, { Component } from 'react';
import { Row, Col, Input, Icon } from 'antd';

class Parameterinput extends Component {
  constructor(props) {
    super(props);
    const { editInfo } = this.props;
    this.state = {
      values:
        editInfo && editInfo.length > 0 ? editInfo : [{ key: '', value: '' }]
    };
  }
  onKeyChange = (index, e) => {
    const { values } = this.state;
    values[index].key = e.target.value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onValueChange = (index, e) => {
    const { values } = this.state;
    values[index].value = e.target.value;
    this.triggerChange(values);
    this.setValues(values);
  };
  setValues(arr = []) {
    if (!(arr && arr.length)) {
      arr.push({ key: '', value: '' });
    }
    this.setState({ values: arr });
  }
  add = () => {
    const { values } = this.state;
    this.setState({ values: values.concat({ key: '', value: '' }) });
  };
  initFromProps(values) {
    this.setState({ values });
  }

  remove = (index) => {
    const { values } = this.state;
    values.splice(index, 1);
    this.setValues(values);
    this.triggerChange(values);
  };

  triggerChange(values) {
    const { onChange } = this.props;
    if (onChange) {
      onChange(values);
    }
  }

  render() {
    const keyPlaceholder = this.props.keyPlaceholder || '请输入key值';
    const valuePlaceholder = this.props.valuePlaceholder || '请输入value值';
    const { values } = this.state;
    return (
      <div>
        {values &&
          values.length > 0 &&
          values.map((item, index) => {
            return (
              <Row key={index}>
                <Col span={10}>
                  <Input
                    name="key"
                    onChange={this.onKeyChange.bind(this, index)}
                    value={item.key}
                    placeholder={keyPlaceholder}
                  />
                </Col>
                <Col span={1} style={{ textAlign: 'center' }}>
                  :
                </Col>
                <Col span={10}>
                  <Input
                    name="value"
                    onChange={this.onValueChange.bind(this, index)}
                    value={item.value}
                    placeholder={valuePlaceholder}
                  />
                </Col>
                <Col span={3} style={{ textAlign: 'center' }}>
                  {index == 0 ? (
                    <Icon
                      type="plus-circle"
                      onClick={this.add}
                      style={{ fontSize: '20px' }}
                    />
                  ) : (
                    <Icon
                      type="minus-circle"
                      style={{ fontSize: '20px' }}
                      onClick={this.remove.bind(this, index)}
                    />
                  )}
                </Col>
              </Row>
            );
          })}
      </div>
    );
  }
}
export default Parameterinput;
