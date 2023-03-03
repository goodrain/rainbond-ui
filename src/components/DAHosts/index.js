import { Col, Icon, Input, notification, Row } from 'antd';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

class DAHosts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: [{ host: '' }]
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
    values[index].host = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  setValues(arr) {
    const setArr = arr || [];
    if (!setArr.length) {
      setArr.push({ host: ''});
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
            host: valArr[i].split('=')[0]
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
    this.setState({ values: values.concat({ host: ''}) });
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
      res.push(`${values[i].host}`);
    }
    const { onChange } = this.props;
    if (onChange) {
      onChange(res.join(';'));
    }
  }

  render() {
    const hostPlaceholder = this.props.hostPlaceholder || '请填写域名地址';
    const { values } = this.state;
    return (
      <div>
        {values.map((item, index) => {
          const first = index === 0;
          return (
            <Row key={index}>
              <Col span={20}>
                <Input
                  name="host"
                  onChange={e => {
                    this.onKeyChange(e.target.value, index);
                  }}
                  value={item.host}
                  placeholder={hostPlaceholder}
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

export default DAHosts;
