import { Button, Form, Input } from 'antd';
import { connect } from 'dva';
import React, { Component } from 'react';

const FormItem = Form.Item;

@connect(({}) => ({}))
class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search_conditions: ''
    };
  }
  handleSearch = e => {
    const { onSearch } = this.props;
    onSearch && onSearch(this.state.search_conditions);
  };
  handelChange = e => {
    this.setState({ search_conditions: e.target.value });
  };
  handleEnter = () => {
    this.handleSearch();
  };
  render() {
    const { type, appID } = this.props;
    const appPlaceholder =
      type === 'HTTP' ? '搜索域名/应用/组件' : '搜索端口/应用/组件';
    const teamPlaceholder = type === 'HTTP' ? '搜索域名/组件' : '搜索端口/组件';
    return (
      <Form layout="inline" style={{ display: 'inline-block' }}>
        <FormItem>
          <Input
            placeholder={(!appID && appPlaceholder) || teamPlaceholder}
            onChange={this.handelChange}
            onPressEnter={this.handleEnter}
            style={{ width: 250 }}
          />
        </FormItem>
        <FormItem>
          <Button type="primary" onClick={this.handleSearch} icon="search">
            搜索
          </Button>
        </FormItem>
      </Form>
    );
  }
}

export default Search;
