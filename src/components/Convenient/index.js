import React, { PureComponent } from 'react';
import { Modal, Form, Select, Button, Row, Col } from 'antd';
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
      Loading: true,
    };
  }
  componentDidMount() {
    this.getUserTeams();
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
    const { userTeamList } = this.state;

    let name = '';
    userTeamList.map(item => {
      if (item.team_name === values.team_name) {
        name = item.team_alias;
      }
    });
    const result = `/team/${values.team_name}/region/${values.region}/index`;
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
  fetchTeamApps = regionName => {
    const { form } = this.props;
    const { getFieldValue } = form;
    console.log('region', getFieldValue('region'));
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        query: {
          region_name: regionName || getFieldValue('region'),
        },
        team_name: getFieldValue('team_name'),
        region_name: regionName || getFieldValue('region'),
      },
      callback: res => {
        this.setState({ apps: res, Loading: false });
      },
    });
  };

  // 组件
  loadComponents = () => {
    const { dispatch, currentTeam, currentRegion, currentAppID } = this.props;
    const { queryName } = this.state;
    if (currentAppID) {
      dispatch({
        type: 'groupControl/fetchApps',
        payload: {
          team_name: currentTeam.team_name,
          region_name: currentRegion.team_region_name,
          group_id: currentAppID,
          page: 1,
          page_size: 50,
          query: queryName,
        },
        callback: data => {
          if (data && data._code == 200) {
            this.setState({
              components: data.list || [],
              Loading: false,
            });
          }
        },
      });
    }
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
        this.fetchTeamApps(region_list[0]);
      });
    }
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { onOk, onCancel, title } = this.props;
    const { userTeamList, apps, region_list } = this.state;

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
        width={600}
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
            <Col span={12}>
              <FormItem {...formItemLayout} label="团队名称" hasFeedback>
                {getFieldDecorator('team_name', {
                  rules: [
                    {
                      required: true,
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
            <Col span={12}>
              <FormItem {...formItemLayout} label="数据中心" hasFeedback>
                {getFieldDecorator('region', {
                  rules: [
                    {
                      required: true,
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
          </Row>
        </Form>
      </Modal>
    );
  }
}
