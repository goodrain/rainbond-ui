/* eslint-disable react/sort-comp */
import { Button, Col, Input, Row } from 'antd';
import React, { Component } from 'react';

class KvInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: [{ key: '', value: '' }]
    };
    this.initFromProps();
  }
  add = () => {
    const { values } = this.state;
    this.setState({ values: values.concat({ key: '', value: '' }) });
  };
  componentWillReceiveProps(nextProps) {
    if ('value' in nextProps) {
      const { value } = nextProps;
      this.initFromProps(value);
    }
  }

  initFromProps(value) {
    var value = value || this.props.value;
    if (value) {
      const res = [];
      const valArr = value.split(',');
      for (let i = 0; i < valArr.length; i++) {
        if (valArr[i].split('=')[0] !== '') {
          res.push({
            key: valArr[i].split('=')[0],
            value: valArr[i].split('=')[1]
          });
        }
      }
      this.setValues(res);
    }
  }
  setValues(arr) {
    arr = arr || [];
    if (!arr.length) {
      arr.push({ key: '', value: '' });
    }
    this.setState({ values: arr });
  }
  remove = index => {
    const { values } = this.state;
    values.splice(index, 1);
    this.setValues(values);
    this.triggerChange(values);
  };
  triggerChange(values) {
    const res = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i].key !== '') {
        res.push(`${values[i].key}=${values[i].value}`);
      }
    }
    const { onChange } = this.props;
    if (onChange) {
      onChange(res.join(','));
    }
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
  render() {
    const keyPlaceholder = this.props.keyPlaceholder || '请输入key值';
    const valuePlaceholder = this.props.valuePlaceholder || '请输入value值';
    const { values } = this.state;
    return (
      <div>
        {values.map((item, index) => {
          return (
            <Row key={index}>
              <Col span={8}>
                <Input
                  name="key"
                  onChange={this.onKeyChange.bind(this, index)}
                  value={item.key}
                  placeholder={keyPlaceholder}
                />
              </Col>
              <Col span={2} style={{ textAlign: 'center' }}>
                =
              </Col>
              <Col span={8}>
                <Input
                  name="value"
                  onChange={this.onValueChange.bind(this, index)}
                  value={item.value}
                  placeholder={valuePlaceholder}
                />
              </Col>
              <Col span={6} style={{ textAlign: 'center' }}>
                {index == 0 ? (
                  <Button onClick={this.add} type="primary">
                    添加
                  </Button>
                ) : (
                  <Button onClick={this.remove.bind(this, index)}>删除</Button>
                )}
              </Col>
            </Row>
          );
        })}
      </div>
    );
  }
}

export default KvInput;
