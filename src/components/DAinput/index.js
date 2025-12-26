import { Col, Icon, Input, notification, Row } from 'antd';
import React, { Component } from 'react';
import { formatMessage } from '@/utils/intl';

class DAinput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: [{ key: '', value: '' }]
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
  onValueChange = (value, index) => {
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
      const res = [];
      const valArr = setValue.split(';');
      for (let i = 0; i < valArr.length; i++) {
        res.push({
          key: valArr[i].split('=')[0],
          value: valArr[i].split('=')[1]
        });
      }
      this.setValues(res);
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
    this.setState({ values: values.concat({ key: '', value: '' }) });
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
      res.push(`${values[i].key}=${values[i].value}`);
    }
    const { onChange } = this.props;
    if (onChange) {
      onChange(res.join(';'));
    }
  }

  render() {
    const keyPlaceholder = this.props.keyPlaceholder || formatMessage({id:'placeholder.contiguration.msg.key'});
    const valuePlaceholder = this.props.valuePlaceholder || formatMessage({id:'placeholder.contiguration.msg.value'});
    const { values } = this.state;
    return (
      <div>
        {values.map((item, index) => {
          const first = index === 0;
          return (
            <Row key={index}>
              <Col span={9}>
                <Input
                  name="key"
                  onChange={e => {
                    this.onKeyChange(e.target.value, index);
                  }}
                  value={item.key}
                  placeholder={keyPlaceholder}
                />
              </Col>
              <Col span={2} style={{ textAlign: 'center' }}>
                :
              </Col>
              <Col span={9}>
                <Input
                  name="value"
                  onChange={e => {
                    this.onValueChange(e.target.value, index);
                  }}
                  value={item.value}
                  placeholder={valuePlaceholder}
                />
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

export default DAinput;
