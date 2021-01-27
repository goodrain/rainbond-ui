import { Select } from 'antd';
import { connect } from 'dva';
import React, { Component } from 'react';
import cookie from '../../utils/cookie';

const { Option } = Select;

@connect()
class TenantSelect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      tenant: undefined
    };
  }
  componentDidMount() {
    this.handleSearch();
  }
  componentWillUnmount() {
    this.setState({ data: [], tenant: '' });
  }

  handleSearch = value => {
    const { eid, dispatch } = this.props;
    dispatch({
      type: 'global/searchTenant',
      payload: {
        eid,
        tenant: value
      },
      callback: res => {
        if (res && res.status_code === 200 && res.bean) {
          this.setState({ data: res.bean.list || [] });
        }
      }
    });
  };

  handleChange = value => {
    const { onChange } = this.props;
    this.setState({ tenant: value }, () => {
      if (onChange) {
        onChange(value);
      }
    });
  };

  handleSelect = value => {
    const { onSelect } = this.props;
    const { data } = this.state;
    if (onSelect) {
      const info = data.filter(item => item.team_name === value);
      if (info && info.length > 0) {
        cookie.set('region_name', info[0].region);
        cookie.set('team_name', value);
      }

      onSelect(value);
    }
  };

  render() {
    const { placeholder, style } = this.props;
    const { data, tenant } = this.state;

    return (
      <Select
        showSearch
        placeholder={placeholder}
        value={tenant}
        defaultActiveFirstOption={false}
        showArrow={false}
        filterOption={false}
        onChange={this.handleChange}
        notFoundContent={null}
        onSearch={this.handleSearch}
        style={style}
        onSelect={this.handleSelect}
      >
        {data.map(d => (
          <Option value={d.team_name} key={d.team_alias}>
            {d.team_alias}
          </Option>
        ))}
      </Select>
    );
  }
}

export default TenantSelect;
