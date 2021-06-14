import { Form, Input, Modal } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { addGroup } from '../../services/application';
import globalUtil from '../../utils/global';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
@connect()
@Form.create()
export default class EditGroupName extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      appLoading: false
    };
  }

  handleSubmit = e => {
    e.preventDefault();
    const {
      form,
      onOk,
      teamName,
      regionName,
      dispatch,
      isAddGroup = true,
      isGetGroups = true
    } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      const setTeamName = teamName || globalUtil.getCurrTeamName();
      const setRegionName = regionName || globalUtil.getCurrRegionName();
      const parameters = { team_name: setTeamName, region_name: setRegionName };
      if (!err && onOk) {
        if (isAddGroup) {
          this.handleLoading(true);
          addGroup({
            ...parameters,
            ...vals,
            noModels: true
          })
            .then(res => {
              const groupId = res && res.bean && res.bean.group_id;
              if (groupId && isGetGroups) {
                dispatch({
                  type: 'global/fetchGroups',
                  payload: parameters,
                  callback: () => {
                    onOk(groupId);
                    this.handleLoading(false);
                  },
                  handleError: () => {
                    this.handleLoading(false);
                  }
                });
              } else {
                if (groupId) {
                  onOk(vals);
                }
                this.handleLoading(false);
              }
            })
            .catch(() => {
              this.handleLoading(false);
            });
        } else {
          onOk(vals);
        }
      }
    });
  };
  handleLoading = appLoading => {
    this.setState({
      appLoading
    });
  };
  render() {
    const {
      title,
      onCancel,
      form,
      group_name: groupName,
      note,
      loading = false
    } = this.props;
    const { getFieldDecorator } = form;
    const { appLoading } = this.state;
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
        title={title || '新建应用'}
        visible
        confirmLoading={appLoading || loading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.handleSubmit}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="应用名称">
            {getFieldDecorator('group_name', {
              initialValue: groupName || '',
              rules: [
                { required: true, message: '请填写应用名称' },
                {
                  max: 24,
                  message: '最大长度24位'
                }
              ]
            })(<Input placeholder="请填写应用名称" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="应用备注">
            {getFieldDecorator('note', {
              initialValue: note || '',
              rules: [
                {
                  max: 255,
                  message: '最大长度255位'
                }
              ]
            })(<Input.TextArea placeholder="请填写应用备注信息" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
