/* eslint-disable no-nested-ternary */
import { Button, Form, Modal, Radio, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import AddGroup from '../AddOrEditGroup';
import globalUtil from '../../utils/global';
import styles from '../CreateTeam/index.less';

const { Option } = Select;
const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};

@connect(({ global }) => ({ groups: global.groups }), null, null, {
  withRef: true
})
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      addGroup: false,
      is_deploy: true
    };
  }
  componentDidMount() {
    this.handleChangeVersion()
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

  handleChangeVersion = (e) => {
    const { is_deploy } = this.state;
    const { onChangeSelect, showCreate } = this.props
    if (e) {
      let obj = { group_version: e }
      onChangeSelect(obj, is_deploy)
    } else {
      let obj = { group_version: showCreate.versions_info ? showCreate.versions_info[0].version : showCreate.versions[0].app_version }
      onChangeSelect(obj, is_deploy)
      
    }
  };

  fetchGroup = () => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      }
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { is_deploy } = this.state;
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        onSubmit(fieldsValue, is_deploy);
        this.setState({ is_deploy: true });
      }
    });
  };

  renderSuccessOnChange = () => {
    this.setState({
      is_deploy: !this.state.is_deploy
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const {
      groups,
      onCancel,
      showCreate,
      addAppLoading,
      disabled,
      btnStatus
    } = this.props;
    const data = this.props.data || {};
    const versionsInfo =
      showCreate &&
      showCreate.versions_info &&
      showCreate.versions_info.length > 0 &&
      showCreate.versions_info;

    const appVersions =
      showCreate &&
      showCreate.versions &&
      showCreate.versions.length > 0 &&
      showCreate.versions;

    return (
      <Modal
        className={styles.TelescopicModal}
        visible={showCreate}
        onCancel={onCancel}
        onOk={this.handleSubmit}
        title="要安装到哪个应用?"
        footer={[
          <div style={{display:'flex',marginLeft:'120px'}}>
          <Button onClick={onCancel}>取消</Button>
          <div>
            {
              btnStatus && btnStatus == 'Installable' ? (
                <Button
                  onClick={this.handleSubmit}
                  type="primary"
                  style={{ marginRight: '5px' }}
                  loading={addAppLoading || disabled}
                >
                  {formatMessage({id:'button.install'})}
                </Button>
              ) :
                btnStatus == 'AlreadyInstalled' ? (
                  <Button
                    type="primary"
                    style={{ marginRight: '5px' }}
                    disabled
                  >
                    已安装
                  </Button>
                ) :
                  btnStatus == 'Upgradeable' ? (
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      style={{ marginRight: '5px' }}
                      loading={addAppLoading || disabled}
                    >
                      升级
                    </Button>
                  ) : (
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      style={{ marginRight: '5px' }}
                      loading={addAppLoading || disabled}
                    >
                      {formatMessage({id:'button.install'})}
                    </Button>
                  )
            }
            </div>
          </div>
        ]}
      >
        <Form onSubmit={this.handleOk} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="安装版本">
            {getFieldDecorator('group_version', {
              initialValue: versionsInfo
                ? versionsInfo[0].version
                : appVersions
                  ? appVersions[0].app_version
                  : '',
              rules: [
                {
                  required: true,
                  message: '请选择版本'
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                onChange={this.handleChangeVersion}
                style={{ width: '220px' }}
              >
                {versionsInfo
                  ? versionsInfo.map((item, index) => {
                    return (
                      <Option key={index} value={item.version}>
                        {item.version}
                      </Option>
                    );
                  })
                  : appVersions &&
                  appVersions.map((item, index) => {
                    return (
                      <Option key={index} value={item.app_version}>
                        {item.app_version}
                      </Option>
                    );
                  })}
              </Select>
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
