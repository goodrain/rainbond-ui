import React, { PureComponent } from 'react';
import { Button, Modal, Form, Select } from 'antd';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const Option = Select.Option;

@Form.create()
class SelectStore extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      actions: [],
      storeList: [],
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
        enterprise_id,
      },
      callback: data => {
        if (data) {
          this.setState({ storeList: data.list, loading: false });
        }
      },
    });
  };
  handleSubmit = () => {
    const { onOk, form } = this.props;
    const { validateFields } = form;
    validateFields((err, values) => {
      if (!err) {
        onOk && onOk(values);
      }
    });
  };
  render() {
    const { onCancel, visible, form } = this.props;
    const { getFieldDecorator } = form;
    const { storeList } = this.state;
    const stores = storeList && storeList.length > 0 && storeList;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
      },
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
          ),
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
                initialValue: stores[0].market_id || '',
                rules: [
                  {
                    required: true,
                    message: '请选择发布的商店',
                  },
                ],
              })(
                <Select placeholder="请选择发布的商店">
                  {stores.map((item, index) => {
                    return (
                      <Option key={`store${index}`} value={item.market_id}>
                        {item.name}
                      </Option>
                    );
                  })}
                </Select>
              )}
              <div className={styles.conformDesc}>选择需要发布的商店名称</div>
            </FormItem>
          </Form>
        ) : (
          <p>
            当前企业暂无开通应用商店，请前往应用市场申请开通{' '}
            <a target="_blank" href="https://market.goodrain.com/manage">
              去开通
            </a>
          </p>
        )}
      </Modal>
    );
  }
}

export default SelectStore;
