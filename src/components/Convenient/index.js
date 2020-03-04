import React, { PureComponent } from 'react';
import { Modal, Form, Select, Button, Row, Col, notification } from 'antd';
import { connect } from 'dva';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const Option = Select.Option;

@Form.create()
@connect(({ user }) => ({
  user: user.currentUser,
}))
export default class Convenient extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      selectedTeam: '',
      teamInfo: '',
      userTeamList: [],
      region_list: [],
      apps: [],
      components: [],
      Loading: true,
    };
  }
  componentDidMount() {
    this.getUserTeams();
    this.fetchTeamApps();
  }

  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.handleCollectionView(values);
      }
    });
  };

  handleCollectionView = values => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
      onOk,
    } = this.props;
    const { userTeamList, apps, components } = this.state;
    const {
      team_name: teamName,
      region: regionName,
      apps: appName,
      component: componentName,
    } = values;

    let name = '';
    let result = '';

    if (componentName && components && components.length > 0) {
      components.map(item => {
        if (item.service_alias === componentName) {
          const {
            service_alias,
            tenant_name,
            region_name,
            service_cname,
          } = item;
          result = `/team/${tenant_name}/region/${region_name}/components/${service_alias}/overview`;
          name = service_cname;
        }
      });
    } else if (appName && apps && apps.length > 0) {
      apps.map(item => {
        if (item.ID === appName) {
          const { group_name, tenant_name, region_name, ID } = item;
          name = group_name;
          result = `/team/${tenant_name}/region/${region_name}/apps/${ID}`;
        }
      });
    } else if (
      teamName &&
      regionName &&
      userTeamList &&
      userTeamList.length > 0
    ) {
      userTeamList.map(item => {
        if (item.team_name === teamName) {
          name = item.team_alias;
        }
      });
      result = `/team/${teamName}/region/${regionName}/index`;
    } else {
      notification.warning({
        message: '请至少选择一个',
      });
      return null;
    }
    dispatch({
      type: 'user/addCollectionView',
      payload: {
        enterprise_id: eid,
        name,
        url: result,
      },
      callback: res => {
        if (res && res._code == 200) {
          onOk && onOk();
        }
      },
    });
  };

  // 团队
  getUserTeams = () => {
    const {
      dispatch,
      user,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/fetchUserTeams',
      payload: {
        enterprise_id: eid,
        user_id: user.user_id,
        page: 1,
        page_size: 999,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            userTeamList: res.list,
            Loading: false,
          });
        }
      },
    });
  };

  // 应用
  fetchTeamApps = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseApps',
      payload: {
        enterprise_id: eid,
        page: 1,
        page_size: 999,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({ apps: res.list, Loading: false });
        }
      },
    });
  };

  handleTeamChange = value => {
    const { form } = this.props;
    const { setFieldsValue } = form;
    const { userTeamList } = this.state;
    let region_list = [];
    userTeamList.map(item => {
      if (item.team_name === value) {
        region_list = item.region_list;
      }
    });
    if (region_list && region_list.length > 0) {
      this.setState({ region_list }, () => {
        setFieldsValue({ region: region_list[0] });
      });
    }
  };

  handleAppChange = value => {
    const { form } = this.props;
    const { setFieldsValue } = form;
    const { apps } = this.state;
    let components = [];
    apps.map(item => {
      if (item.ID === value) {
        components = item.service_list;
      }
    });
    if (components && components.length > 0) {
      this.setState({ components });
    }
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { onOk, onCancel, title } = this.props;
    const { userTeamList, apps, components, region_list } = this.state;

    const userTeam = userTeamList && userTeamList.length > 0 && userTeamList;

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
        title={title}
        width={1000}
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          <Button type="primary" onClick={this.handleSubmit}>
            添加
          </Button>,
        ]}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          {/* {this.state.teams.length === 0 && (
              <div>暂无团队可以添加，可以先创建团队。</div>
            )} */}

          <Row>
            <Col span={6}>
              <FormItem {...formItemLayout} label="团队名称" hasFeedback>
                {getFieldDecorator('team_name', {
                  rules: [
                    {
                      required: false,
                      message: '请选择团队',
                    },
                  ],
                })(
                  <Select
                    style={{ width: '100%' }}
                    onChange={this.handleTeamChange}
                  >
                    {userTeam &&
                      userTeam.map(team => (
                        <Option value={team.team_name}>
                          {team.team_alias}
                        </Option>
                      ))}
                  </Select>
                )}
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem {...formItemLayout} label="数据中心" hasFeedback>
                {getFieldDecorator('region', {
                  rules: [
                    {
                      required: false,
                      message: '请选择数据中心',
                    },
                  ],
                })(
                  <Select style={{ width: '100%' }}>
                    {region_list &&
                      region_list.map(item => (
                        <Option value={item}>{item}</Option>
                      ))}
                  </Select>
                )}
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem {...formItemLayout} label="应用" hasFeedback>
                {getFieldDecorator('apps', {
                  rules: [
                    {
                      required: false,
                      message: '请选择应用',
                    },
                  ],
                })(
                  <Select
                    style={{ width: '100%' }}
                    onChange={this.handleAppChange}
                  >
                    {apps &&
                      apps.map(item => (
                        <Option value={item.ID}>{item.group_name}</Option>
                      ))}
                  </Select>
                )}
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem {...formItemLayout} label="组件" hasFeedback>
                {getFieldDecorator('component', {
                  rules: [
                    {
                      required: false,
                      message: '请选择组件',
                    },
                  ],
                })(
                  <Select style={{ width: '100%' }}>
                    {components &&
                      components.map(item => (
                        <Option value={item.service_alias}>
                          {item.service_cname}
                        </Option>
                      ))}
                  </Select>
                )}
              </FormItem>
            </Col>
          </Row>
        </Form>
      </Modal>
    );
  }
}
