/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Alert, List, Tooltip, Popover, Table } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import AddHelmStore from '../../components/AddHelmStore';
import globalUtil from '../../utils/global';
import cookie from '../../utils/cookie';
import styles from './index.less';

const { Option } = Select;
const { TextArea } = Input;

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 14
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
      addStoreVisible: false,
      clicked: false,
      HelmwaRehouseList: []
    };
  }
  componentDidMount() {
    this.getAppStoreList()
    this.setState({
      addStoreVisible: this.props.showaddStoreVisible
    })
  }
  getAppStoreList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'market/HelmwaRehouseList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
      },
      callback: res => {
        this.setState({
          HelmwaRehouseList: res.list,
        })
      },
      handleError: err => {
      }
    });
  };
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
    const { form, onSubmit, handleType } = this.props;
    const isService = handleType && handleType === 'Service' ? 'service' : 'team';
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        onSubmit(fieldsValue, isService);
      }
    });
  };
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({ id: 'placeholder.k8s_component_name' })));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(formatMessage({ id: 'placeholder.nameSpaceReg' }))
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({ id: 'placeholder.max32' })));
    }
  };
  showStoreMoudle = () => {
    this.setState({
      addStoreVisible: !this.state.addStoreVisible,
      clicked: !this.state.clicked
    })
  }
  handleClickChange = () => {
    this.setState({
      clicked: !this.state.clicked
    });
  }
  render() {
    const {
      groups,
      createAppByDockerrunLoading,
      form,
      groupId,
      handleType,
      ButtonGroupState,
      showSubmitBtn = true,
      showCreateGroup = true,
      BtnLoading,
      errorShow,
      description
    } = this.props;
    const { getFieldDecorator } = form;
    const data = this.props.data || {};
    const isService = handleType && handleType === 'Service';
    const { language, addStoreVisible, HelmwaRehouseList } = this.state;
    const is_language = language ? formItemLayout : formItemLayout;
    const columns = [
      {
        title: formatMessage({id:'teamAdd.create.helm.store_name'}),
        dataIndex: 'repo_name',
        key: 'repo_name',
      },
      {
        title: formatMessage({id:'teamAdd.create.helm.store_url'}),
        dataIndex: 'repo_url',
        key: 'repo_url',
      }
    ];
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.appName' })}>
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : data.group_id,
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'placeholder.appName' })}
                style={language ? {
                  display: 'inline-block',
                  width: isService ? '' : 250,
                  marginRight: 10
                } : {
                  display: 'inline-block',
                  width: isService ? '' : 264,
                  marginRight: 10
                }}
                disabled={!!isService}
              >
                {(groups || []).map(group => {
                  return (
                    <Option value={group.group_id}>{group.group_name}</Option>
                  );
                })}
              </Select>
            )}
            {isService ? null : showCreateGroup ? (
              <Button onClick={this.onAddGroup}>{formatMessage({ id: 'teamApply.createApp' })}</Button>
            ) : null}
          </Form.Item>
          {/* 已对接商店地址 */}
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.image.docker_cmd' })}>
            {getFieldDecorator('helm_cmd', {
              initialValue: data.docker_cmd || '',
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.helmCmdMsg' }) }]
            })(
              <TextArea style={{ minHeight: '200px' }} placeholder={formatMessage({ id: 'placeholder.helm_cmd' })} />
            )}
            <Popover
              content={
                <>
                  <Table dataSource={HelmwaRehouseList} columns={columns} pagination={false} />
                  <Button type="link" onClick={this.showStoreMoudle}>{formatMessage({id:'teamAdd.create.helm.Add'})}</Button>
                </>
              }
              title={formatMessage({id:'teamAdd.create.helm.list'})}
              placement="bottomRight"
              trigger="click"
              visible={this.state.clicked}
              onVisibleChange={this.handleClickChange}
            >
              <p className={styles.storeList}>{formatMessage({id:'teamAdd.create.helm.store'})}</p>
            </Popover>
          </Form.Item>

          {errorShow &&
            <Alert
              message={formatMessage({ id: 'teamOther.HelmCmdForm.msg' })}
              description={description}
              type="error"
              closable
              style={{ width: 350, margin: 'auto', marginBottom: 20 }}
            />
          }
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
              {isService && ButtonGroupState
                ?
                <Button
                  onClick={this.handleSubmit}
                  type="primary"
                  loading={BtnLoading}
                >
                  {formatMessage({ id: 'teamAdd.create.btn.createComponent' })}
                </Button>


                : !handleType && (
                  <Button
                    onClick={this.handleSubmit}
                    type="primary"
                    loading={BtnLoading}
                  >
                    {formatMessage({ id: 'teamAdd.create.btn.create' })}
                  </Button>
                )}
            </Form.Item>
          ) : null}
        </Form>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
        {addStoreVisible &&
          <AddHelmStore handleCancel={this.showStoreMoudle}  visible={addStoreVisible} RefreshList={this.getAppStoreList}/>
        }
      </Fragment>
    );
  }
}
