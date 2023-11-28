/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Radio } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import globalUtil from '../../utils/global';
import { pinyin } from 'pinyin-pro';
import cookie from '../../utils/cookie';

const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 15
  }
};
const formItemLayouts = {
  labelCol: {
    span: 10
  },
  wrapperCol: {
    span: 14
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
      addGroup: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      comNames: []
    };
  }
  componentDidMount() {
    const { handleType, groupId } = this.props;
    if(handleType && handleType === 'Service'){
      this.fetchComponentNames(Number(groupId));
    }
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    this.cancelAddGroup();
  };

  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, archInfo } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        if(archInfo && archInfo.length != 2 && archInfo.length != 0){
          fieldsValue.arch = archInfo[0]
        }
        onSubmit(fieldsValue);
      }
    });
  };
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({id: 'placeholder.k8s_component_name'})));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(formatMessage({id: 'placeholder.nameSpaceReg'}))
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({id: 'placeholder.max32'})));
    }
  };
  handleValiateCmd = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({id: 'placeholder.docker_cmd'})));
    }
    if (value) {
      const Reg = /^[^\s]*$/;
      if (!Reg.test(value)) {
        return callback(
          new Error('镜像名称不能包含空格')
        );
      }
      callback();
    }
  };
  // 获取当前选取的app的所有组件的英文名称
  fetchComponentNames = (group_id) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/getComponentNames',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id
      },
      callback: res => {
        if (res && res.bean ) {
          this.setState({
            comNames: res.bean.component_names && res.bean.component_names.length > 0 ? res.bean.component_names : []
          })
      }
    }
    });
  };
  // 生成英文名
  generateEnglishName = (name) => {
    if(name != undefined){
      const { comNames } = this.state;
      const pinyinName = pinyin(name, {toneType: 'none'}).replace(/\s/g, '');
      const cleanedPinyinName = pinyinName.replace(/^[^a-z]+|[^a-z0-9-]+$/g, '').toLowerCase();
      if (comNames && comNames.length > 0) {
        const isExist = comNames.some(item => item === cleanedPinyinName);
        if (isExist) {
          const random = Math.floor(Math.random() * 10000);          
          return `${cleanedPinyinName}${random}`;
        }
        return cleanedPinyinName;
      }
      return cleanedPinyinName;
    }
    return ''
  }
  render() {
    const { form } = this.props;
    const { getFieldDecorator } = this.props.form;
    const {
      groups,
      createAppByDockerrunLoading,
      handleType,
      ButtonGroupState,
      groupId,
      showSubmitBtn = true,
      showCreateGroup = true,
      archInfo
    } = this.props;
    const data = this.props.data || {};
    const disableds = this.props.disableds || [];
    const isService = handleType && handleType === 'Service';
    const {language} = this.state;
    const is_language = language ? formItemLayout : formItemLayouts;
    let arch = 'amd64'
    let archLegnth = archInfo.length
    if(archLegnth == 2){
      arch = 'amd64'
    }else if(archInfo.length == 1){
      arch = archInfo && archInfo[0]
    }
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.form.appName'})}>
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : data.group_id,
              rules: [
                {
                  required: true,
                  message: formatMessage({id: 'placeholder.select'})
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({id: 'placeholder.appName'})}
                style={ language ? {
                  display: 'inline-block',
                  width: isService ? '' : 276,
                  marginRight: 10,textOverflow: 'ellipsis',whiteSpace: 'nowrap'
                } : {
                  display: 'inline-block',
                  width: isService ? '' : 262,
                  marginRight: 10,textOverflow: 'ellipsis',whiteSpace: 'nowrap'
                }}
                disabled={!!isService}
                onChange={this.fetchComponentNames}
              >
                {(groups || []).map(group => (
                  <Option value={group.group_id}>{group.group_name}</Option>
                ))}
              </Select>
            )}
            {isService ? null : showCreateGroup ? (
              <Button onClick={this.onAddGroup}>{formatMessage({id: 'teamApply.createApp'})}</Button>
            ) : null}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.form.service_cname'})}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id: 'placeholder.service_cname'})
                },
                {
                  max: 24,
                  message: formatMessage({id: 'placeholder.max24'})
                }
              ]
            })(
              <Input
                disabled={disableds.indexOf('service_cname') > -1}
                placeholder={formatMessage({id: 'placeholder.service_cname'})}
                style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}
              />
            )}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.form.k8s_component_name'})}>
            {getFieldDecorator('k8s_component_name', {
              initialValue: this.generateEnglishName(form.getFieldValue('service_cname')),
              rules: [
                { required: true, validator: this.handleValiateNameSpace }
              ]
            })(<Input placeholder={formatMessage({id: 'placeholder.k8s_component_name'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
          </Form.Item>

          <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.image.mirrorAddress'})}>
            {getFieldDecorator('docker_cmd', {
              initialValue: data.docker_cmd || '',
              rules: [
                {
                  required: true,
                  validator: this.handleValiateCmd
                }
              ]
            })(<Input placeholder={formatMessage({id: 'placeholder.docker_cmd'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            {formatMessage({id: 'teamAdd.create.image.hint1'})}
            <a
              onClick={() => {
                this.setState({ showUsernameAndPass: true });
              }}
              href="javascript:;"
            >
              {formatMessage({id: 'teamAdd.create.image.hint2'})}
            </a>
          </div>
          <Form.Item
            style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
            {...is_language}
            label={formatMessage({id: 'teamAdd.create.form.user'})}
          >
            {getFieldDecorator('user_name', {
              initialValue: data.user_name || '',
              rules: [{ required: false, message: formatMessage({id: 'placeholder.username_1'}) }]
            })(<Input autoComplete="off" placeholder={formatMessage({id: 'placeholder.username_1'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
          </Form.Item>
          <Form.Item
            style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
            {...is_language}
            label={formatMessage({id: 'teamAdd.create.form.password'})}
          >
            {getFieldDecorator('password', {
              initialValue: data.password || '',
              rules: [{ required: false, message: formatMessage({id: 'placeholder.password_1'}) }]
            })(
              <Input
                autoComplete="new-password"
                type="password"
                placeholder={formatMessage({id: 'placeholder.password_1'})}
              />
            )}
          </Form.Item>
          {archLegnth == 2 && 
          <Form.Item {...is_language} label={formatMessage({id:'enterpriseColony.mgt.node.framework'})}>
            {getFieldDecorator('arch', {
              initialValue: arch,
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
            })(
              <Radio.Group>
                <Radio value='amd64'>amd64</Radio>
                <Radio value='arm64'>arm64</Radio>
              </Radio.Group>
            )}
          </Form.Item>}
          {showSubmitBtn ? (
            <Form.Item
              wrapperCol={{
                xs: {
                  span: 24,
                  offset: 0
                },
                sm: {
                  span: formItemLayout.wrapperCol.span,
                  offset: formItemLayout.labelCol.span
                }
              }}
              label=""
            >
              {isService && ButtonGroupState
                ? this.props.handleServiceBotton(
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByDockerrunLoading}
                    >
                     {formatMessage({id: 'teamAdd.create.btn.createComponent'})}
                    </Button>,
                    false
                  )
                : !handleType && (
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByDockerrunLoading}
                    >
                      {formatMessage({id: 'teamAdd.create.btn.create'})}
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
