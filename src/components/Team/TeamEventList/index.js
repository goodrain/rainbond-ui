/* eslint-disable camelcase */
import {
  Card,
  Col,
  Form,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Table
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../../utils/global';
import roleUtil from '../../../utils/role';
import styles from './index.less';

const { Option } = Select;
const FormItem = Form.Item;

@Form.create()
@connect(({ teamControl, loading, user }) => ({
  regions: teamControl.regions,
  currUser: user.currentUser,
  activitiesLoading: loading.effects['activities/fetchList']
}))
export default class EventList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      pageSize: 8,
      total: 0,
      events: [],
      roles: [],
      joinUsers: [],
      joinSettingShow: false,
      joinUser: null
    };
  }
  componentDidMount() {
    this.loadEvents();
    this.loadJoinUsers();
    this.loadRoles();
  }
  loadEvents = () => {
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'index/fetchEvents',
      payload: {
        team_name: teamName,
        page_size: this.state.pageSize,
        page: this.state.page
      },
      callback: data => {
        if (data) {
          this.setState({
            events: data.list || [],
            total: data.total || data.list.length
          });
        }
      }
    });
  };
  loadRoles = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/fetchTeamRoles',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page_size: 10000,
        page: 1
      },
      callback: data => {
        if (data) {
          this.setState({
            roles: data.list || []
          });
        }
      }
    });
  };
  loadJoinUsers = () => {
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'teamControl/getJoinTeamUsers',
      payload: {
        team_name: teamName
      },
      callback: data => {
        if (data) {
          this.setState({
            joinUsers: data.list || []
          });
        }
      }
    });
  };
  hanldePageChange = page => {
    this.setState({ page }, () => {
      this.loadEvents();
    });
  };
  handleRefused = data => {
    this.props.dispatch({
      type: 'teamControl/setJoinTeamUsers',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        user_id: data.user_id,
        action: false
      },
      callback: () => {
        this.loadJoinUsers();
      }
    });
  };
  handleJoinShow = data => {
    this.setState({ joinSettingShow: true, joinUser: data });
  };
  hideJoinShow = () => {
    this.setState({ joinSettingShow: false, joinUser: null });
  };
  handleJoin = () => {
    const { joinUser } = this.state;
    const { form } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        this.props.dispatch({
          type: 'teamControl/setJoinTeamUsers',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            user_id: joinUser.user_id,
            role_ids: values.role_ids,
            action: true
          },
          callback: () => {
            this.hideJoinShow();
            this.loadJoinUsers();
          }
        });
      }
    });
  };

  renderActivities() {
    const list = this.state.events || [];

    if (!list.length) {
      return (
        <p
          style={{
            textAlign: 'center',
            color: 'ccc',
            paddingTop: 20
          }}
        >
        {formatMessage({id: 'teamManage.tabs.dynamic.notDynamic'})}
        </p>
      );
    }

    return list.map(item => {
      const {
        UserName,
        OptType,
        FinalStatus,
        Status,
        create_time,
        Target
      } = item;

      const linkTo = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
        item.service_alias
      }/overview`;
      return (
        <List.Item key={item.ID}>
          <List.Item.Meta
            title={
              <span>
                <a className={styles.username}>{UserName}</a>
                <span className={styles.event}>
                  {' '}
                  {globalUtil.fetchStateOptTypeText(OptType)}
                </span>
                &nbsp;
                {Target && Target === 'service' && (
                  <Link to={linkTo} className={styles.event}>
                    {item.service_name}
                  </Link>
                )}
                <span>
                  {formatMessage({id: 'teamManage.tabs.dynamic.meta.app'})}
                </span>
                <span
                  style={{
                    color: globalUtil.fetchAbnormalcolor(OptType)
                  }}
                >
                  {globalUtil.fetchOperation(FinalStatus, Status)}
                </span>
              </span>
            }
            description={
              <span className={styles.datatime_float} title={item.updatedAt}>
                {globalUtil.fetchdayTime(create_time)}
              </span>
            }
          />
        </List.Item>
      );
    });
  }
  render() {
    const {
      activitiesLoading,
      // memberPermissions: { isCreate },
      form
    } = this.props;
    const { joinSettingShow, roles, total } = this.state;
    const { getFieldDecorator } = form;
    const isCreate = true;
    const pagination = {
      current: this.state.page,
      pageSize: this.state.pageSize,
      total: this.state.total,
      onChange: v => {
        this.hanldePageChange(v);
      }
    };
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };
    return (
      <div>
        <Row gutter={24}>
          <Col md={12} sm={24}>
            <Card
              bodyStyle={{
                paddingTop: 12
              }}
              title={formatMessage({id: 'teamManage.tabs.dynamic'})}
              loading={activitiesLoading}
            >
              <List
                pagination={total > 8 ? pagination:false}
                loading={activitiesLoading}
                size="large"
              >
                <div className={styles.activitiesList}>
                  {this.renderActivities()}
                </div>
              </List>
            </Card>
          </Col>
          <Col md={12} sm={24}>
            <Card
              bodyStyle={{
                paddingTop: 12
              }}
              title={formatMessage({id: 'teamManage.tabs.dynamic.title.addTeam'})}
            >
              <Table
                pagination={false}
                rowKey={(record,index) => index}
                dataSource={this.state.joinUsers || []}
                columns={[
                  {
                    title: formatMessage({id: 'teamManage.tabs.dynamic.table.user'}),
                    dataIndex: 'user_name'
                  },
                  {
                    title: formatMessage({id: 'teamManage.tabs.dynamic.table.time'}),
                    dataIndex: 'apply_time'
                  },
                  {
                    title: formatMessage({id: 'teamManage.tabs.dynamic.table.operate'}),
                    dataIndex: '',
                    render: (v, data) =>
                      data.is_pass === 0 &&
                      isCreate && (
                        <Fragment>
                          <a onClick={() => this.handleJoinShow(data)}>
                            {formatMessage({id: 'teamManage.tabs.dynamic.table.btn.through'})}
                          </a>
                          <Popconfirm
                            title={formatMessage({id: 'teamManage.tabs.dynamic.table.btn.popconfirm'})}
                            onConfirm={() => {
                              this.handleRefused(data);
                            }}
                          >
                            <a style={{ marginLeft: 6 }}>
                            {formatMessage({id: 'teamManage.tabs.dynamic.table.btn.refuse'})}
                            </a>
                          </Popconfirm>
                        </Fragment>
                      )
                  }
                ]}
              />
            </Card>
          </Col>
        </Row>
        {joinSettingShow && (
          <Modal
            title={formatMessage({id: 'teamManage.tabs.dynamic.modal.title'})}
            visible
            onOk={this.handleJoin}
            onCancel={this.hideJoinShow}
          >
            <Form>
              <FormItem {...formItemLayout} label={formatMessage({id: 'teamManage.tabs.dynamic.form.lable'})}>
                {getFieldDecorator('role_ids', {
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id: 'teamManage.tabs.dynamic.form.placeholder'})
                    }
                  ]
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    mode="multiple"
                    placeholder={formatMessage({id: 'teamManage.tabs.dynamic.form.placeholder'})}
                    style={{ width: '100%' }}
                  >
                    {roles.map(item => {
                      const { ID, name } = item;
                      return (
                        <Option key={ID} value={ID}>
                          {roleUtil.actionMap(name)}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </FormItem>
            </Form>
          </Modal>
        )}
      </div>
    );
  }
}