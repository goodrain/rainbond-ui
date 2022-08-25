/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
import { Button, Form, Modal, Select, Spin } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
    const {
      onCancel,
      visible,
      form,
      loading: submitLoading = false
    } = this.props;
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
        title={formatMessage({id:'appPublish.btn.record.makert.select.title'})}
        visible={visible}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> {formatMessage({id:'popover.cancel'})} </Button>,
          stores && (
            <Button
              type="primary"
              onClick={this.handleSubmit}
              loading={submitLoading}
            >
              {formatMessage({id:'popover.confirm'})}
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
            <FormItem {...formItemLayout} label={formatMessage({id:'appPublish.btn.record.makert.select.store_id'})}>
              {getFieldDecorator('store_id', {
                initialValue: stores[0].name || '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.appShare.select.shop'})
                  }
                ]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder={formatMessage({id:'placeholder.appShare.select.shop'})}
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
              <div className={styles.conformDesc}>{formatMessage({id:'appPublish.btn.record.makert.select.store_id.desc'})}</div>
            </FormItem>
          </Form>
        ) : loading ? (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Spin tip={formatMessage({id:'appPublish.btn.record.makert.select.loading'})} />
          </div>
        ) : (
          <p style={{ textAlign: 'center' }}>{formatMessage({id:'appPublish.btn.record.makert.select.desc'})}</p>
        )}
      </Modal>
    );
  }
}

export default SelectStore;
