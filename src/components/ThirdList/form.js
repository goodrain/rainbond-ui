/* eslint-disable react/sort-comp */
/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/first */
import {
  Button,
  Checkbox,
  Col,
  Form,
  Icon,
  Input,
  Row,
  Select,
  Spin,
  Switch,
  Tabs,
  Radio,
  Divider
} from 'antd';
import { connect } from 'dva';
import React, { Fragment } from 'react';
import { formatMessage } from '@/utils/intl';
import AddGroup from '../../components/AddOrEditGroup';
import globalUtil from '../../utils/global';
import handleAPIError from '../../utils/error';
import { pinyin } from 'pinyin-pro';
import styles from './Index.less';
import {
  getServiceNameRules,
  getK8sComponentNameRules,
  getCodeVersionRules,
  getOpenWebhookRules,
  getArchRules,
  getGroupNameRules,
  getK8sAppRules
} from './validations';

const { Option, OptGroup } = Select;
const { TabPane } = Tabs;

const formItemLayout = {
  labelCol: {
    span: 24
  },
  wrapperCol: {
    span: 24
  }
};

const formItemLayoutOrder = {
  labelCol: {
    span: 21
  },
  wrapperCol: {
    span: 3
  }
};
@connect(
  ({ user, global, loading }) => ({
    currUser: user.currentUser,
    groups: global.groups,
    createAppByCodeLoading: loading.effects['createApp/createThirtAppByCode']
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      addGroup: false,
      tags: [],
      tabType: 'branches',
      tagsLoading: true,
      Loading: true,
      showSubdirectories: false,
      checkedList: []
    };
  }
  componentWillMount() {
    this.handleCodeWarehouseType(this.props);
  }
  componentDidUpdate(nextProps) {
    if (nextProps.type !== this.props.type) {
      this.handleCodeWarehouseType(nextProps);
    }
  }
  onTabChange = tabType => {
    this.setState({ tabType, tagsLoading: true }, () => {
      this.handleCodeWarehouseType(this.props);
    });
  };
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };

  handleCodeWarehouseType = props => {
    const { dispatch, type, thirdInfo } = props;
    const { tabType } = this.state;
    dispatch({
      type: 'global/codeWarehouseType',
      payload: {
        type: tabType,
        full_name: thirdInfo ? thirdInfo.project_full_name : '',
        oauth_service_id: type
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            tags: res.bean ? res.bean[tabType] : [],
            tagsLoading: false,
            Loading: false
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
        this.setState({
          tagsLoading: false,
          Loading: false
        });
      }
    });
  };

  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, thirdInfo, onSubmit, archInfo } = this.props;
    const { tagsLoading } = this.state;
    const group_id = globalUtil.getAppID()
    if (tagsLoading) {
      return null;
    }
    form.validateFields((err, values) => {
      if (!err) {
        if (archInfo && archInfo.length !== 2 && archInfo.length !== 0) {
          values.arch = archInfo[0]
        }
        if (group_id) {
          values.group_id = group_id
        }
        if (!values.k8s_app || !values.group_name) {
          values.group_name = values.service_cname
          values.k8s_app = this.generateEnglishName(values.service_cname)
        }
        const info = Object.assign({}, values);
        info.project_id = thirdInfo.project_id;
        info.project_url = values.subdirectories
          ? `${thirdInfo.project_url}?dir=${values.subdirectories}`
          : thirdInfo.project_url;
        info.project_full_name = thirdInfo.project_full_name;
        if (onSubmit) {
          onSubmit(info);
        }
      }
    });
  };

  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    this.cancelAddGroup();
  };
  // 生成英文名
  generateEnglishName = (name) => {
    if (!name) {
      return '';
    }

    const { comNames } = this.state;
    const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
    const cleanedPinyinName = pinyinName.toLowerCase();

    // 检查名称是否已存在
    if (comNames && comNames.length > 0) {
      const isExist = comNames.some(item => item === cleanedPinyinName);
      if (isExist) {
        const random = Math.floor(Math.random() * 10000);
        return `${cleanedPinyinName}${random}`;
      }
    }

    return cleanedPinyinName;
  };
  onChange = checkedValues => {
    this.setState({
      checkedList: checkedValues,
      showSubdirectories: checkedValues.includes('subdirectories')
    });
  };
  render() {
    const {
      groups,
      createAppByCodeLoading,
      ServiceComponent,
      thirdInfo,
      groupId,
      form,
      showSubmitBtn = true,
      showCreateGroup = true,
      handleType,
      archInfo,
    } = this.props;
    const { getFieldDecorator } = form;
    const {
      tags,
      addGroup,
      tagsLoading,
      Loading,
      checkedList,
      showSubdirectories
    } = this.state;
    const group_id = globalUtil.getAppID()
    let arch = 'amd64'
    let archLength = archInfo.length
    if (archLength === 2) {
      arch = 'amd64'
    } else if (archInfo.length === 1) {
      arch = archInfo && archInfo[0]
    }
    return (
      <Fragment>
        <Spin spinning={Loading}>
          <Form
            onSubmit={this.handleSubmit}
            layout="vertical"
            hideRequiredMark
          >
            <Form.Item
              {...formItemLayout}
              label={formatMessage({ id: 'versionUpdata_6_1.serviceName' })}
            >
              {getFieldDecorator('service_cname', {
                initialValue: thirdInfo ? thirdInfo.project_name : '',
                rules: getServiceNameRules()
              })(<Input placeholder={formatMessage({ id: 'versionUpdata_6_1.serviceName.placeholder' })} />)}
            </Form.Item>
            <Form.Item
              {...formItemLayout}
              label={formatMessage({ id: 'versionUpdata_6_1.serviceName.k8sComponentName' })}
            >
              {getFieldDecorator('k8s_component_name', {
                initialValue: this.generateEnglishName(form.getFieldValue('service_cname') || ''),
                rules: getK8sComponentNameRules()
              })(<Input placeholder={formatMessage({ id: 'versionUpdata_6_1.serviceName.k8sComponentName.placeholder' })} />)}
            </Form.Item>
            <Form.Item
              {...formItemLayout}
              label={formatMessage({ id: 'versionUpdata_6_1.codeVersion' })}
            >
              {getFieldDecorator('code_version', {
                initialValue: tags && tags.length > 0 && tags[0],
                rules: getCodeVersionRules()
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder={formatMessage({ id: 'versionUpdata_6_1.codeVersion.placeholder' })}
                >
                  <OptGroup
                    label={
                      <Tabs
                        defaultActiveKey="branches"
                        onChange={this.onTabChange}
                        className={styles.selectTabs}
                      >
                        <TabPane tab="分支" key="branches" />
                        <TabPane tab="Tags" key="tags" />
                      </Tabs>
                    }
                  >
                    {!tagsLoading && tags && tags.length > 0 ? (
                      tags.map(item => {
                        return (
                          <Option
                            key={item}
                            value={item}
                            style={{ textAlign: 'left' }}
                          >
                            {item}
                          </Option>
                        );
                      })
                    ) : (
                      <Option value="loading">
                        <Spin spinning={tagsLoading} />
                      </Option>
                    )}
                  </OptGroup>
                </Select>
              )}
            </Form.Item>
            
            <Checkbox.Group
              style={{ width: '100%', marginBottom: '10px' }}
              onChange={this.onChange}
              value={checkedList}
            >
              <Row>
                <Col span={24}>
                  <Checkbox value="subdirectories">{formatMessage({ id: 'versionUpdata_6_1.subdirectories' })}</Checkbox>
                </Col>
              </Row>
            </Checkbox.Group>

            {showSubdirectories && (
              <Form.Item
                {...formItemLayout}
                label={formatMessage({ id: 'versionUpdata_6_1.subdirectories' })}
              >
                {getFieldDecorator('subdirectories')(
                  <Input placeholder={formatMessage({ id: 'versionUpdata_6_1.subdirectories.placeholder' })} />
                )}
              </Form.Item>
            )}
            <Form.Item
              {...formItemLayout}
              label={formatMessage({ id: 'versionUpdata_6_1.openWebhook' })}
            >
              {getFieldDecorator('open_webhook', {
                initialValue: false,
                rules: getOpenWebhookRules()
              })(<Switch />)}
            </Form.Item>
            {archLength === 2 &&
              <Form.Item {...formItemLayout} label={formatMessage({ id: 'versionUpdata_6_1.arch' })}>
                {getFieldDecorator('arch', {
                  initialValue: arch,
                  rules: getArchRules()
                })(
                  <Radio.Group>
                    <Radio value='amd64'>amd64</Radio>
                    <Radio value='arm64'>arm64</Radio>
                  </Radio.Group>
                )}
              </Form.Item>}

            {!group_id &&
            <div style={{ width: '100%' }}>
              <Divider />
              <div className="advanced-btn" style={{ marginBottom: 16 }}>
                <Button
                  type="link"
                  style={{
                    fontWeight: 500,
                    fontSize: 16,
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={() => this.setState({ showAdvanced: !this.state.showAdvanced })}
                >
                  <Icon type={this.state.showAdvanced ? "up" : "down"} style={{ marginRight: 6 }} />
                      {formatMessage({ id: 'kubeblocks.database.create.form.advanced.title' })}
                </Button>
              </div>
              {this.state.showAdvanced && (
                <div
                  className="userpass-card"
                  style={{
                    margin: '24px 0',
                    background: '#fafbfc',
                    border: '1px solid #e6e6e6',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px #f0f1f2',
                    padding: 24,
                  }}>
                  <div className="advanced-divider" style={{ margin: '0 0 16px 0' }} />
                  <Form.Item
                    label={formatMessage({ id: 'popover.newApp.appName' })}
                    colon={false}
                    {...formItemLayout}
                    style={{ marginBottom: 18 }}
                  >
                    {getFieldDecorator('group_name', {
                      initialValue: this.props.form.getFieldValue('service_cname') || '',
                      rules: getGroupNameRules()
                    })(<Input
                      placeholder={formatMessage({ id: 'popover.newApp.appName.placeholder' })}
                      style={{
                        borderRadius: 6,
                        height: 40,
                        fontSize: 15,
                        boxShadow: '0 1px 3px #f0f1f2',
                        border: '1px solid #e6e6e6',
                        transition: 'border 0.2s, box-shadow 0.2s'
                      }}
                    />
                    )}
                  </Form.Item>
                  <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
                    {getFieldDecorator('k8s_app', {
                      initialValue: this.generateEnglishName(this.props.form.getFieldValue('group_name') || ''),
                      rules: getK8sAppRules()
                    })(<Input
                      placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })}
                      style={{
                        borderRadius: 6,
                        height: 40,
                        fontSize: 15,
                        boxShadow: '0 1px 3px #f0f1f2',
                        border: '1px solid #e6e6e6',
                        transition: 'border 0.2s, box-shadow 0.2s'
                      }}
                    />
                    )}
                  </Form.Item>
                </div>
              )}
            </div>}

            {showSubmitBtn ? (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                {ServiceComponent && this.props.ButtonGroupState
                  ? this.props.handleServiceBotton(
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      {formatMessage({ id: 'versionUpdata_6_1.createComponent' })}
                    </Button>,
                    false
                  )
                  : !ServiceComponent && (
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      {formatMessage({ id: 'versionUpdata_6_1.confirmCreate' })}
                    </Button>
                  )}
              </div>
            ) : null}
          </Form>
        </Spin>
        {addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Fragment>
    );
  }
}

export default Index;
