import { Button, Form, Input } from 'antd';
import { connect } from 'dva';
import React, { Component } from 'react';
import { formatMessage } from '@/utils/intl';

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
      type === 'HTTP' ? formatMessage({id: 'teamGateway.strategy.placeholder.http'}) : formatMessage({id: 'teamGateway.strategy.placeholder.tcp'});
    const teamPlaceholder = type === 'HTTP' ? formatMessage({id: 'appGateway.placeholder.domain'}) : formatMessage({id: 'appGateway.placeholder.port'});
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
            {formatMessage({id: 'teamGateway.strategy.btn.search'})}
          </Button>
        </FormItem>
      </Form>
    );
  }
}

export default Search;
