import { Col, Icon, Input, notification, Row, Select } from 'antd';
import React, { Component } from 'react';

const { Option } = Select;
class DAinputs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: [{ name: '', mountPath: '', key: '' }]
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
  onNameChange = (value, index) => {
    const { values } = this.state;
    values[index].name = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onValueChange = (value, index) => {
    const { values } = this.state;
    values[index].mountPath = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onKeyChange = (value, index) => {
    const { values } = this.state;
    values[index].key = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  setValues(arr) {
    const setArr = arr || [];
    if (!setArr.length) {
      setArr.push({ name: '', mountPath: '', key: '' });
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
      values: values.concat({ name: '', mountPath: '', key: '' })
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
        name: values[i].name,
        mountPath: values[i].mountPath,
        key: values[i].key
      });
    }
    const { onChange } = this.props;
    if (onChange) {
      onChange(res);
    }
  }

  render() {
    const namePlaceholder = this.props.namePlaceholder || 'name';
    const mountPathPlaceholder = this.props.repPlaceholder || 'value';
    const keyPlaceholder = this.props.keyPlaceholder || 'key';
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
                  name="name"
                  onChange={e => {
                    this.onNameChange(e.target.value, index);
                  }}
                  value={item.name}
                  placeholder={namePlaceholder}
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
                  name="mountPath"
                  onChange={e => {
                    this.onValueChange(e.target.value, index);
                  }}
                  value={item.mountPath}
                  placeholder={mountPathPlaceholder}
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
                  name="key"
                  onChange={e => {
                    this.onKeyChange(e.target.value, index);
                  }}
                  value={item.key}
                  placeholder={keyPlaceholder}
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
