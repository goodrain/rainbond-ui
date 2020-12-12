/* eslint-disable react/jsx-no-bind */
import { Icon, Input, Row } from 'antd';
import React, { Component } from 'react';
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
    if (!arr.length) {
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
              <Row style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  name="item_key"
                  value={item.item_key}
                  maxLength={255}
                  style={{ width: '300px' }}
                  placeholder={keyPlaceholder}
                  onChange={this.onKeyChange.bind(this, index)}
                />
                <span style={{ textAlign: 'center', padding: '0 10px' }}>
                  :
                </span>
                <div>
                  <TextArea
                    name="item_value"
                    rows={1}
                    value={item.item_value}
                    maxLength={65533}
                    style={{ width: '360px', marginRight: '10px' }}
                    placeholder={valuePlaceholder}
                    onChange={this.onValueChange.bind(this, index)}
                  />
                </div>
                <div style={{ textAlign: 'center' }}>
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
                </div>
              </Row>
            );
          })}
      </div>
    );
  }
}
export default Parameterinput;
