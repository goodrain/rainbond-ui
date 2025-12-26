/* eslint-disable react/sort-comp */
import { Col, Icon, Input, Row } from 'antd';
import React, { Component } from 'react';
import { formatMessage } from '@/utils/intl';

class DAinput extends Component {
  constructor(props) {
    super(props);
    const { valueArr } = this.props;
    const setArr = valueArr && valueArr.map((item) => {
      return { ip: item };
    });
    this.state = {
      values: props.valueArr ? setArr : [{ ip: '' }]
    };
  }
  handleNodes = (value, index) => {
    const { values } = this.state;
    values[index].ip = value;
    this.triggerChange(values);
    this.setValues(values);
  };
  setValues(arr) {
    const setArr = arr || [];
    if (!setArr.length) {
      setArr.push('');
    }
    this.setState({ values: setArr });
  }
  initFromProps(value) {
    const setValue = value;
    if (setValue) {
      this.setValues(setValue);
    }
  }
  add = () => {
    const { values } = this.state;
    if (values.length > 99) {
      return null;
    }
    this.setState({
      values: values.concat({ ip: '' })
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
        ip: values[i].ip
      });
    }
    const { onChange } = this.props;
    if (onChange) {
      onChange(res);
    }
  }
  render() {
    const regexPlaceholder = `${formatMessage({id:'enterpriseColony.Advanced.end'})}`;
    const { values } = this.state;
    return (
      <div>
        {values.map((item, index) => {
          const first = index === 0;
          return (
            <Row key={index} style={{ width: '100%', display: 'flex' }}>
              <Col span={24} style={{ marginRight: '10px' }}>
                <Input
                  name="ip"
                  onChange={e => {
                    this.handleNodes(e.target.value, index);
                  }}
                  value={item.ip}
                  placeholder={regexPlaceholder}
                  style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}
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
