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
  Tabs
} from 'antd';
import { connect } from 'dva';
import React, { Fragment } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import Application from '../../../public/images/application.svg';
import Branches from '../../../public/images/branches.svg';
import Component from '../../../public/images/component.svg';
import Unlock from '../../../public/images/unlock.svg';
import AddGroup from '../../components/AddOrEditGroup';
import styles from './Index.less';

const { Option, OptGroup } = Select;
const { TabPane } = Tabs;

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
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
      }
    });
  };

  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, thirdInfo, onSubmit } = this.props;
    const { tagsLoading } = this.state;
    if (tagsLoading) {
      return null;
    }
    form.validateFields((err, values) => {
      if (!err) {
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
    return (
      <Fragment>
        <Spin spinning={Loading}>
          <Form
            onSubmit={this.handleSubmit}
            layout="horizontal"
            hideRequiredMark
          >
            <Form.Item
              className={styles.clearConform}
              {...formItemLayout}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Application} alt="" />
                  应用&nbsp;:
                </div>
              }
            >
              {getFieldDecorator('group_id', {
                initialValue: ServiceComponent ? Number(groupId) : '',
                rules: [{ required: true, message: '请选择' }]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder="请选择要所属应用"
                  style={{
                    display: 'inline-block',
                    width: ServiceComponent ? '' : 292,
                    marginRight: 15
                  }}
                  disabled={!!ServiceComponent}
                >
                  {(groups || []).map(group => (
                    <Option
                      key={group.group_id}
                      value={group.group_id}
                      style={{ textAlign: 'left' }}
                    >
                      {group.group_name}
                    </Option>
                  ))}
                </Select>
              )}
              {ServiceComponent ? null : showCreateGroup ? (
                <Button onClick={this.onAddGroup}>
                  {formatMessage({id:'popover.newApp.title'})}
                </Button>
              ) : null}
            </Form.Item>
            <Form.Item
              className={styles.clearConform}
              {...formItemLayout}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Component} alt="" />
                  组件名称&nbsp;:
                </div>
              }
            >
              {getFieldDecorator('service_cname', {
                initialValue: thirdInfo ? thirdInfo.project_name : '',
                rules: [{ required: true, message: '要创建的组件还没有名字' }]
              })(<Input placeholder="请为创建的组件起个名字吧" />)}
            </Form.Item>

            <Form.Item
              className={styles.clearConform}
              {...formItemLayout}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Branches} alt="" />
                  代码版本&nbsp;:
                </div>
              }
            >
              {getFieldDecorator('code_version', {
                initialValue: tags && tags.length > 0 && tags[0],
                rules: [{ required: true, message: '请输入代码版本' }]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder="请输入代码版本"
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
                <Col span={24} style={{ textAlign: 'right' }}>
                  <Checkbox value="subdirectories">填写子目录路径</Checkbox>
                </Col>
              </Row>
            </Checkbox.Group>

            {showSubdirectories && (
              <Form.Item
                className={styles.clearConform}
                {...formItemLayout}
                label={
                  <div className={styles.clearConformMinTitle}>
                    <Icon type="unordered-list" />
                    子目录路径&nbsp;:
                  </div>
                }
              >
                {getFieldDecorator('subdirectories')(
                  <Input placeholder="请输入子目录路径" />
                )}
              </Form.Item>
            )}
            <Form.Item
              className={styles.clearConform}
              {...formItemLayoutOrder}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Unlock} alt="" />
                  是否开启自动构建&nbsp;:
                </div>
              }
            >
              {getFieldDecorator('open_webhook', {
                initialValue: false,
                rules: [{ required: true, message: '请选择' }]
              })(<Switch />)}
            </Form.Item>

            {showSubmitBtn ? (
              <div style={{ textAlign: 'center' }}>
                {ServiceComponent && this.props.ButtonGroupState
                  ? this.props.handleServiceBotton(
                      <Button
                        onClick={this.handleSubmit}
                        type="primary"
                        loading={createAppByCodeLoading}
                      >
                        新建组件
                      </Button>,
                      false
                    )
                  : !ServiceComponent && (
                      <Button
                        onClick={this.handleSubmit}
                        type="primary"
                        loading={createAppByCodeLoading}
                      >
                        确认创建
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
