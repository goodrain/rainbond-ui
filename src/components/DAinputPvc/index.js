import { Col, Icon, Input, notification, Row, Select } from 'antd';
import React, { Component } from 'react';

const { Option } = Select;
class DAinputs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: [{ name: '', mountPath: '', claimName: '', subPath: '' }]
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
  onMountPathChange = (value, index) => {
    const { values } = this.state;
    values[index].mountPath = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onClaimNameChange = (value, index) => {
    const { values } = this.state;
    values[index].claimName = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onSubPathChange = (value, index) => {
    const { values } = this.state;
    values[index].subPath = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  setValues(arr) {
    const setArr = arr || [];
    if (!setArr.length) {
      setArr.push({ name: '', mountPath: '', claimName: '', subPath: '' });
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
      values: values.concat({ name: '', mountPath: '', claimName: '', subPath: ''  })
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
        claimName: values[i].claimName,
        subPath: values[i].subPath
      });
    }
    const { onChange } = this.props;
    if (onChange) {
      onChange(res);
    }
  }

  render() {
    const namePlaceholder =  'name';
    const mountPathPlaceholder =  'mountPath';
    const claimNamePlaceholder =  'claimName';
    const subPathPlaceholder = 'subPath';
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
                  name="claimName"
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
                    this.onMountPathChange(e.target.value, index);
                  }}
                  value={item.mountPath}
                  placeholder={mountPathPlaceholder}
                />
              </Col>
              <Col
                span={4}
                style={{
                  textAlign: 'center',
                  marginRight: '30px'
                }}
              >
                <Input
                  name="claimName"
                  onChange={e => {
                    this.onClaimNameChange(e.target.value, index);
                  }}
                  value={item.claimName}
                  placeholder={claimNamePlaceholder}
                />
              </Col>
              
              <Col
                span={4}
                style={{
                  textAlign: 'center',
                  marginRight: '30px'
                }}
              >
                <Input
                  name="subPath"
                  onChange={e => {
                    this.onSubPathChange(e.target.value, index);
                  }}
                  value={item.subPath}
                  placeholder={subPathPlaceholder}
                />
              </Col>
              <Col span={2}>
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
