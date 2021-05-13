/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
import { Button, Form, Modal, Select, Spin } from 'antd';
import React, { PureComponent } from 'react';
import { fetchMarketAuthority } from '../../utils/authority';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
class SelectStore extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      loading: true,
      storeList: []
    };
  }
  componentDidMount() {
    this.getStoreList();
  }
  getStoreList = () => {
    this.setState({ loading: true });
    const { dispatch, enterprise_id } = this.props;
    dispatch({
      type: 'enterprise/fetchEnterpriseStoreList',
      payload: {
        enterprise_id
      },
      callback: data => {
        if (data) {
          const { list = [] } = data;
          let newList = [];
          if (list.length > 0) {
            newList = list.filter(
              item => item.status === 1 && fetchMarketAuthority(item, 'Write')
            );
          }
          this.setState({ storeList: newList, loading: false });
        } else {
          this.setState({ loading: false });
        }
      }
    });
  };
  handleSubmit = () => {
    const { onOk, form } = this.props;
    const { validateFields } = form;
    validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  render() {
    const { onCancel, visible, form } = this.props;
    const { getFieldDecorator } = form;
    const { storeList, loading } = this.state;
    const stores = storeList && storeList.length > 0 && storeList;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };
    return (
      <Modal
        title="选择应用商店"
        visible={visible}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          stores && (
            <Button type="primary" onClick={this.handleSubmit}>
              确定
            </Button>
          )
        ]}
      >
        {stores ? (
          <Form
            onSubmit={this.handleSubmit}
            layout="horizontal"
            hideRequiredMark
          >
            <FormItem {...formItemLayout} label="发布商店" hasFeedback>
              {getFieldDecorator('store_id', {
                initialValue: stores[0].name || '',
                rules: [
                  {
                    required: true,
                    message: '请选择发布的商店'
                  }
                ]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder="请选择发布的商店"
                >
                  {stores.map(item => {
                    const { name, alias } = item;
                    return (
                      <Option key={`store${name}`} value={name}>
                        {alias || name}
                      </Option>
                    );
                  })}
                </Select>
              )}
              <div className={styles.conformDesc}>选择需要发布的商店名称</div>
            </FormItem>
          </Form>
        ) : loading ? (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Spin tip="应用商店列表加载中..." />
          </div>
        ) : (
          <p style={{ textAlign: 'center' }}>暂无推送权限的应用商店</p>
        )}
      </Modal>
    );
  }
}

export default SelectStore;
