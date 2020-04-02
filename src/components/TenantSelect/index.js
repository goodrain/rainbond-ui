import React, { Component } from 'react';
import { connect } from 'dva';
import { Select } from 'antd';

const Option = Select.Option;

@connect(({}) => ({}))
class TenantSelect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      tenant: undefined,
    };
  }
  componentDidMount() {
    this.handleSearch();
  }

  handleSearch = value => {
    const { eid, dispatch } = this.props;
    dispatch({
      type: 'global/searchTenant',
      payload: {
        eid,
        tenant: value,
      },
      callback: res => {
        if (res && res._code === 200 && res.bean) {
          this.setState({ data: res.bean.list || [] });
        }
      },
    });
  };

  handleChange = value => {
    this.setState({ tenant: value }, () => {
      this.props.onChange && this.props.onChange(value);
    });
  };

  handleSelect = value => {
    const { onSelect } = this.props;
    onSelect && onSelect(value);
  };
  componentWillUnmount() {
    this.setState({ data: [], tenant: '' });
  }

  render() {
    const options = this.state.data.map((d, index) => (
      <Option value={d.team_name} key={index}>
        {d.team_alias}
      </Option>
    ));
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
