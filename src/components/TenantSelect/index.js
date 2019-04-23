import React, { Component } from 'react';
import { connect } from 'dva';
import { Select } from 'antd';

const Option = Select.Option;

@connect(({ }) => ({}))
class TenantSelect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      tenant: undefined
    }
  }

  handleSearch = (value) => {
    this.props.dispatch({
      type: 'global/searchTenant',
      payload: {
        tenant: value
      },
      callback: data => {
        if (data) {
          this.setState({ data: (data.list || []) })
        }
      }
    })
  }

  handleChange = (value) => {
    this.setState({ tenant: value }, () => {
      this.props.onChange && this.props.onChange(value)
    })
  }

  handleSelect = (value) => {
    const { onSelect } = this.props;
    onSelect && onSelect(value)
  }
  componentWillUnmount() {
    this.setState({ data: [], tenant: '' })
  }

  render() {
    var options = this.state.data.map((d, index) => <Option value={d.team_name} key={index}>{d.team_alias}</Option>);
    return (
      <Select
        showSearch
        placeholder={this.props.placeholder}
        value={this.state.tenant}
        defaultActiveFirstOption={false}
        showArrow={false}
        filterOption={false}
        onChange={this.handleChange}
        notFoundContent={null}
        onSearch={this.handleSearch}
        style={this.props.style}
        onSelect={this.handleSelect}
      >
        {options}
      </Select>
    );
  }
}

export default TenantSelect;