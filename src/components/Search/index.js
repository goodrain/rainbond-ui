import React, { Component } from 'react';
import { Form, Input, Select, Button, Icon, message } from 'antd';
import { connect } from 'dva';
const FormItem = Form.Item;

@connect(({}) => ({}))
class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search_conditions: '',
    };
  }
  handleSearch = e => {
    const { onSearch } = this.props;
		onSearch && onSearch(this.state.search_conditions);
  };
  handelChange = (e) => {
		this.setState({ search_conditions: e.target.value})
	}
	handleEnter=()=>{
		this.handleSearch()
	}
  render() {
    return (
      <Form layout="inline" style={{ display: 'inline-block'}}>
        <FormItem>
            <Input placeholder="搜索域名/应用/组件"  onChange={this.handelChange.bind(this)} onPressEnter={this.handleEnter} style={{width:250}} />
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
