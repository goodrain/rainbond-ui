/* eslint-disable react/jsx-no-bind */
import React, { Component } from 'react';
import { Row, Col, Input, Icon } from 'antd';
const { TextArea } = Input;

class Parameterinput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: [{ item_key: '', item_value: '' }]
    };
  }
  componentDidMount() {
    const { editInfo } = this.props;
    if (editInfo && editInfo.length > 0 && editInfo[0].item_key) {
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState({
        values: editInfo
      });
    }
  }

  onKeyChange = (index, e) => {
    const { values } = this.state;
    values[index].item_key = e.target.value;
    this.triggerChange(values);
    this.setValues(values);
  };
  onValueChange = (index, e) => {
    const { values } = this.state;
    values[index].item_value = e.target.value;
    this.triggerChange(values);
    this.setValues(values);
  };
  setValues(arr = []) {
    if (!(arr && arr.length)) {
      arr.push({ item_key: '', item_value: '' });
    }
    this.setState({ values: arr });
  }
  add = () => {
    const { values } = this.state;
    this.setState({ values: values.concat({ item_key: '', item_value: '' }) });
  };
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
    const {
      keyPlaceholder = '请输入key值',
      valuePlaceholder = '请输入value值'
    } = this.props;
    const { values } = this.state;
    return (
      <div>
        {values &&
          values.length > 0 &&
          values.map((item, index) => {
            return (
              <Row
                style={{ display: 'flex', alignItems: 'center' }}
                key={index}
              >
                <Col span={10}>
                  <Input
                    name="item_key"
                    value={item.item_key}
                    maxLength={255}
                    placeholder={keyPlaceholder}
                    onChange={this.onKeyChange.bind(this, index)}
                  />
                </Col>
                <Col span={1} style={{ textAlign: 'center' }}>
                  :
                </Col>
                <Col span={10}>
                  <TextArea
                    name="item_value"
                    rows={1}
                    value={item.item_value}
                    maxLength={65533}
                    placeholder={valuePlaceholder}
                    onChange={this.onValueChange.bind(this, index)}
                  />
                </Col>
                <Col span={3} style={{ textAlign: 'center' }}>
                  {index === 0 ? (
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
