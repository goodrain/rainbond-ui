import { Select, Spin } from 'antd';
import { connect } from 'dva';
import React from 'react';
import { formatMessage } from '@/utils/intl';
import globalUtil from '../../utils/global';

const { Option } = Select;
@connect()
class UserRemoteSelect extends React.Component {
  constructor(props) {
    super(props);
    this.lastFetchId = 0;
    this.state = {
      data: [],
      value: [],
      fetching: false
    };
  }
  componentDidMount() {
    this.fetchUser();
  }
  fetchUser = value => {
    this.setState({ data: [], fetching: true });
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();

    dispatch({
      type: 'user/searchEnterpriseNoTeamUser',
      payload: {
        team_name,
        query: value,
        page_size: 99,
        page: 1
      },
      callback: response => {
        if (response) {
          const data = response.list || [];
          this.setState({ data, fetching: false });
        }
      }
    });
  };
  handleChange = value => {
    this.setState({
      value,
      fetching: false
    });
    this.props.onChange && this.props.onChange(value);
  };
  render() {
    const { fetching, data, value } = this.state;
    return (
      <Select
        getPopupContainer={triggerNode => triggerNode.parentNode}
        mode="multiple"
        labelInValue
        value={value}
        placeholder={formatMessage({id:'placeholder.userName.search'})}
        notFoundContent={fetching ? <Spin size="small" /> : null}
        filterOption={false}
        onSearch={this.fetchUser}
        onChange={this.handleChange}
        style={{ width: '100%' }}
      >
        {data.map(d => (
          <Option key={d.user_id}>{d.nick_name}</Option>
        ))}
      </Select>
    );
  }
}

export default UserRemoteSelect;
