/* eslint-disable react/no-unused-state */
/* eslint-disable prettier/prettier */
import { Button, Checkbox, Col, Form, Modal, notification, Row } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styless from '../CreateTeam/index.less';
const FormItem = Form.Item;

@connect()
@Form.create()
class ConfirmModal extends PureComponent {
  constructor(props) {
    super(props);
    const { data } = this.props;
    const defaultCheckedList =
      data && data.length > 0 && data.map(item => item.graph_id);
    this.state = {
      allCheckedList: defaultCheckedList,
      indeterminate: true,
      checkAll: true
    };
  }
  onChange = checkedList => {
    const { data, form } = this.props;
    const { setFieldsValue } = form;
    this.setState({
      indeterminate: !!checkedList.length && checkedList.length < data.length,
      checkAll: checkedList.length === data.length
    });
    setFieldsValue({ graphIds: checkedList });
  };

  onCheckAllChange = e => {
    const { allCheckedList } = this.state;
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ graphIds: e.target.checked ? allCheckedList : [] });
    this.setState({
      indeterminate: false,
      checkAll: e.target.checked
    });
  };

  onOk = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        this.handleSubmitBatchDelete(vals);
      }
    });
  };

  handleSubmitBatchDelete = vals => {
    const { dispatch, onOk, team_name, app_alias } = this.props;
    dispatch({
      type: 'monitor/batchDeleteServiceMonitorFigure',
      payload: {
        app_alias,
        team_name,
        graph_ids: vals.graphIds
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({
            message: formatMessage({id:'notification.success.delete'})
          });
          onOk();
        }
      }
    });
  };

  render() {
    const { title, onCancel, data, form, loading = false } = this.props;
    const { checkAll, indeterminate } = this.state;
    const defaultCheckedList =
      data && data.length > 0 && data.map(item => item.graph_id);

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };

    return (
      <Modal
        title={title}
        visible
        onOk={this.onOk}
        onCancel={onCancel}
        className={styless.TelescopicModal}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          <Button type="primary" loading={loading} onClick={this.onOk}>
            确定
          </Button>
        ]}
      >
        <div>
          <div
            style={{
              borderBottom: '1px solid #E9E9E9',
              paddingBottom: '10px',
              marginBottom: '10px'
            }}
          >
            <Checkbox
              indeterminate={indeterminate}
              onChange={this.onCheckAllChange}
              checked={checkAll}
            >
              全选
            </Checkbox>
          </div>
          <FormItem {...formItemLayout} label="">
            {getFieldDecorator('graphIds', {
              initialValue: defaultCheckedList || [],
              rules: [{ required: true, message: '请选择监控视图' }]
            })(
              <Checkbox.Group
                style={{ width: '472px' }}
                onChange={this.onChange}
              >
                <Row>
                  {data.map(item => {
                    const { title: name, ID, graph_id: graphId } = item;
                    return (
                      <Col span={12} key={ID} style={{ marginBottom: '5px' }}>
                        <Checkbox value={graphId}>{name}</Checkbox>
                      </Col>
                    );
                  })}
                </Row>
              </Checkbox.Group>
            )}
          </FormItem>
        </div>
      </Modal>
    );
  }
}

export default ConfirmModal;
