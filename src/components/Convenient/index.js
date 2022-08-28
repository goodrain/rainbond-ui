import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  Icon,
  Modal,
  notification,
  Row,
  Select,
  Spin
} from 'antd';
import { connect } from 'dva';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect()
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
      app_page_size: 10,
      app_page: 1,
      component_page_size: 10,
      component_page: 1,
      isAddApps: false,
      isAddComponents: false,
      Loading: true
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
        params: { eid }
      },
      onOk
    } = this.props;
    const { userTeamList, apps, components } = this.state;
    const {
      team_name: teamName,
      region: regionName,
      apps: appName,
      component: componentName
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
            service_cname
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
        message: '请至少选择一个'
      });
      return null;
    }

    dispatch({
      type: 'user/addCollectionView',
      payload: {
        enterprise_id: eid,
        name,
        url: result
      },
      callback: res => {
        if (res && res.status_code === 200) {
          onOk && onOk();
        }
      }
    });
  };

  // 团队
  getUserTeams = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/fetchMyTeams',
      payload: {
        enterprise_id: eid,
        page: 1,
        page_size: 999
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            userTeamList: res.list,
            Loading: false
          });
        }
      }
    });
  };

  addApps = () => {
    this.setState(
      {
        app_page_size: this.state.app_page_size + 10
      },
      () => {
        this.fetchTeamApps();
      }
    );
  };

  // 应用
  fetchTeamApps = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { app_page, app_page_size } = this.state;

    dispatch({
      type: 'global/fetchEnterpriseApps',
      payload: {
        enterprise_id: eid,
        page: app_page,
        page_size: app_page_size
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const listNum = res.total_count || 0;
          const isAdd = !!(listNum && listNum > app_page_size);
          this.setState({ isAddApps: isAdd, apps: res.list, Loading: false });
        }
      }
    });
  };

  addComponents = () => {
    const { form } = this.props;
    const { getFieldValue } = form;
    const ID = getFieldValue('apps');
    this.setState(
      {
        component_page_size: this.state.component_page_size + 10
      },
      () => {
        this.fetchComponents(ID);
      }
    );
  };
  // 组件
  fetchComponents = ID => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { component_page_size, component_page } = this.state;
    dispatch({
      type: 'global/fetchAppComponents',
      payload: {
        app_id: ID,
        enterprise_id: eid,
        page: component_page,
        page_size: component_page_size
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const listNum = res.total_count || 0;
          const isAdd = !!(listNum && listNum > component_page_size);
          this.setState({
            isAddComponents: isAdd,
            components: res.list,
            Loading: false
          });
        }
      }
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
        setFieldsValue({
          region: region_list[0].region_name
        });
      });
    }
  };

  handleAppChange = ID => {
    const { form } = this.props;
    const { setFieldsValue } = form;
    const { apps } = this.state;
    let obj = null;
    apps.map(item => {
      if (item.ID === ID) {
        obj = item;
      }
    });
    if (obj) {
      setFieldsValue({ team_name: obj.tenant_name });
      setFieldsValue({ region: obj.region_name });
    }
    setFieldsValue({ component: '' });
    this.fetchComponents(ID);
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { onOk, onCancel, title } = this.props;
    const {
      userTeamList,
      apps,
      components,
      region_list,
      Loading,
      isAddApps,
      isAddComponents
    } = this.state;

    const userTeams = userTeamList && userTeamList.length > 0 && userTeamList;
    const appList = apps && apps.length > 0 && apps;
    const componentList = components && components.length > 0 && components;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 17 }
      }
    };

    return (
      <Modal
        title={title}
        width={600}
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}>  <FormattedMessage id='button.confirm'/></Button>,
          userTeams && (
            <Button type="primary" onClick={this.handleSubmit}>
              <FormattedMessage id='button.add'/>
            </Button>
          )
        ]}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          {Loading ? (
            <Spin />
          ) : (
            !userTeams && (
              <Alert
                message=  {<FormattedMessage id='enterpriseOverview.Convenient.not'/>}
                type="warning"
                style={{ marginBottom: '20px' }}
              />
            )
          )}
          <Row>
            {userTeams && (
              <Col span={12}>
                <FormItem {...formItemLayout}  label={<FormattedMessage id='enterpriseOverview.Convenient.team'/>}hasFeedback>
                  {getFieldDecorator('team_name')(
                    <Select
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      style={{ width: '100%' }}
                      onChange={this.handleTeamChange}
                      placeholder={formatMessage({id:'enterpriseOverview.Convenient.select_team'})}
                    >
                      {userTeams.map(item => (
                        <Option key={item.team_name} value={item.team_name}>
                          {item.team_alias}
                        </Option>
                      ))}
                    </Select>
                  )}
                </FormItem>
              </Col>
            )}
            {userTeams && (
              <Col span={12}>
                <FormItem {...formItemLayout} label="" hasFeedback>
                  {getFieldDecorator('region')(
                    <Select
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      placeholder={formatMessage({id:'enterpriseOverview.Convenient.select_cluster'})}
                      style={{ width: '100%' }}
                    >
                      {region_list &&
                        region_list.map(item => (
                          <Option
                            key={item.region_name}
                            value={item.region_name}
                          >
                            {item.region_alias}
                          </Option>
                        ))}
                    </Select>
                  )}
                </FormItem>
              </Col>
            )}
            {appList && (
              <Col span={12}>
                <FormItem {...formItemLayout} label={<FormattedMessage id='enterpriseOverview.Convenient.app'/>} hasFeedback>
                  {getFieldDecorator('apps')(
                    <Select
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      style={{ width: '100%' }}
                      placeholder={formatMessage({id:'enterpriseOverview.Convenient.select'})}
                      dropdownRender={menu => (
                        <div>
                          {menu}
                          {isAddApps && (
                            <div>
                              <Divider style={{ margin: '4px 0' }} />
                              <div
                                style={{
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                                onMouseDown={e => e.preventDefault()}
                                onClick={this.addApps}
                              >
                                <Icon type="plus" /> <FormattedMessage id='enterpriseOverview.Convenient.more'/>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      onChange={this.handleAppChange}
                    >
                      {appList.map(item => (
                        <Option key={item.ID} value={item.ID}>
                          {item.group_name}
                        </Option>
                      ))}
                    </Select>
                  )}
                </FormItem>
              </Col>
            )}
          </Row>

          <Row>
            {componentList && (
              <Col span={12}>
                <FormItem {...formItemLayout} label={<FormattedMessage id='enterpriseOverview.Convenient.component'/>} hasFeedback>
                  {getFieldDecorator('component')(
                    <Select
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      placeholder={formatMessage({id:'enterpriseOverview.Convenient.select_component'})}
                      dropdownRender={menu => (
                        <div>
                          {menu}
                          {isAddComponents && (
                            <div>
                              <Divider style={{ margin: '4px 0' }} />
                              <div
                                style={{
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                                onMouseDown={e => e.preventDefault()}
                                onClick={this.addComponents}
                              >
                                <Icon type="plus" /> <FormattedMessage id='enterpriseOverview.Convenient.more'/>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      style={{ width: '100%' }}
                    >
                      {componentList.map(item => (
                        <Option
                          key={item.service_alias}
                          value={item.service_alias}
                        >
                          {item.service_cname}
                        </Option>
                      ))}
                    </Select>
                  )}
                </FormItem>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>
    );
  }
}
