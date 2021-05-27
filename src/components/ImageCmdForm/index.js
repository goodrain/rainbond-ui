/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import AddGroup from '../../components/AddOrEditGroup';
import globalUtil from '../../utils/global';

const { Option } = Select;
const { TextArea } = Input;

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};

@connect(
  ({ global, loading }) => ({
    groups: global.groups,
    createAppByDockerrunLoading:
      loading.effects['createApp/createAppByDockerrun']
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showUsernameAndPass: false,
      addGroup: false
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = vals => {
    const { setFieldsValue } = this.props.form;

    this.props.dispatch({
      type: 'application/addGroup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals
      },
      callback: group => {
        if (group) {
          // 获取群组
          this.props.dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName()
            },
            callback: () => {
              setFieldsValue({ group_id: group.group_id });
              this.cancelAddGroup();
            }
          });
        }
      }
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        onSubmit(fieldsValue);
      }
    });
  };
  render() {
    const {
      groups,
      createAppByDockerrunLoading,
      form,
      groupId,
      handleType,
      ButtonGroupState,
      showSubmitBtn = false,
      showCreateGroup = false
    } = this.props;
    const { getFieldDecorator } = form;
    const data = this.props.data || {};
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="应用名称">
            {getFieldDecorator('group_id', {
              initialValue:
                handleType && handleType === 'Service'
                  ? Number(groupId)
                  : data.group_id,
              rules: [{ required: true, message: '请选择' }]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder="请选择要所属应用"
                style={{
                  display: 'inline-block',
                  width: handleType && handleType === 'Service' ? '' : 292,
                  marginRight: 15
                }}
                disabled={!!(handleType && handleType === 'Service')}
              >
                {(groups || []).map(group => {
                  return (
                    <Option value={group.group_id}>{group.group_name}</Option>
                  );
                })}
              </Select>
            )}
            {handleType && handleType === 'Service' ? null : showCreateGroup ? (
              <Button onClick={this.onAddGroup}>新建应用</Button>
            ) : null}
          </Form.Item>
          <Form.Item {...formItemLayout} label="组件名称">
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [{ required: true, message: '要创建的组件还没有名字' }]
            })(<Input placeholder="请为创建的组件起个名字吧" />)}
          </Form.Item>

          <Form.Item {...formItemLayout} label="命令">
            {getFieldDecorator('docker_cmd', {
              initialValue: data.docker_cmd || '',
              rules: [{ required: true, message: '请输入DockerRun命令' }]
            })(
              <TextArea placeholder="例如： docker run -d -p 8080:8080 -e PWD=1qa2ws --name=tomcat_demo tomcat" />
            )}
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: '-16px' }}>
            这是一个私有仓库?
            <a
              onClick={() => {
                this.setState({ showUsernameAndPass: true });
              }}
              href="javascript:;"
            >
              填写仓库账号密码
            </a>
          </div>
          <Form.Item
            style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
            {...formItemLayout}
            label="仓库用户名"
          >
            {getFieldDecorator('user_name', {
              initialValue: data.user_name || '',
              rules: [{ required: false, message: '请输入仓库用户名' }]
            })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
          </Form.Item>
          <Form.Item
            style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
            {...formItemLayout}
            label="仓库密码"
          >
            {getFieldDecorator('password', {
              initialValue: data.password || '',
              rules: [{ required: false, message: '请输入仓库密码' }]
            })(
              <Input
                autoComplete="new-password"
                type="password"
                placeholder="请输入仓库密码"
              />
            )}
          </Form.Item>
          {showSubmitBtn ? (
            <Form.Item
              wrapperCol={{
                xs: { span: 24, offset: 0 },
                sm: {
                  span: formItemLayout.wrapperCol.span,
                  offset: formItemLayout.labelCol.span
                }
              }}
              label=""
            >
              {handleType && handleType === 'Service' && ButtonGroupState
                ? this.props.handleServiceBotton(
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByDockerrunLoading}
                    >
                      新建组件
                    </Button>,
                    false
                  )
                : !handleType && (
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByDockerrunLoading}
                    >
                      确认创建
                    </Button>
                  )}
            </Form.Item>
          ) : null}
        </Form>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Fragment>
    );
  }
}
