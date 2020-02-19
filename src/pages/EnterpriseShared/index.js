import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Card,
  Button,
  Col,
  Row,
  Menu,
  Dropdown,
  Icon,
  Spin,
  Tabs,
  Input,
  Pagination,
} from 'antd';
import { routerRedux } from 'dva/router';
import DataCenterImg from '../../../public/images/dataCenter.png';
import WarningImg from '../../../public/images/warning.png';
import userUtil from '../../utils/user';

import PageHeaderLayout from '../../layouts/PageHeaderLayout';

import styles from './index.less';

const { Search } = Input;

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
}))
export default class EnterpriseTeams extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      teamList: [],
      userTeamList: [],
      exitTeamName: '',
      userTeamsLoading: true,
      adminer,
    };
  }
  componentDidMount() {
    const { user } = this.props;
    if (user) {
      this.load();
    }
  }

  load = () => {
    this.getUserTeams();
  };

  handleSearchTeam = name => {
    this.setState(
      {
        page: 1,
        name,
      },
      () => {
        this.getUserTeams();
      }
    );
  };

  getUserTeams = () => {
    const { dispatch, user } = this.props;
    const { page, page_size, name } = this.state;
    dispatch({
      type: 'global/fetchUserTeams',
      payload: {
        enterprise_id: user.enterprise_id,
        user_id: user.user_id,
        name: '',
        page,
        page_size,
        name,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            userTeamList: res.list,
            userTeamsLoading: false,
          });
        }
      },
    });
  };

  render() {
    const { userTeamList, adminer, userTeamsLoading } = this.state;
    const moreSvg = () => (
      <svg
        t="1581212425061"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="1314"
        width="32"
        height="32"
      >
        <path
          d="M512 192m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1315"
          fill="#999999"
        />
        <path
          d="M512 512m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1316"
          fill="#999999"
        />
        <path
          d="M512 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1317"
          fill="#999999"
        />
      </svg>
    );

    const managementMenu = exitTeamName => {
      return (
        <Menu>
          <Menu.Item>
            <a href="javascript:;" onClick={() => {}}>
              删除团队
            </a>
          </Menu.Item>
        </Menu>
      );
    };

    const operation = (
      <Col span={4} style={{ textAlign: 'right' }} className={styles.btns}>
        {adminer && (
          <Button
            type="primary"
            onClick={this.onAddTeam}
            style={{ marginRight: '5px' }}
          >
            云端同步
          </Button>
        )}
        <Button type="primary" onClick={this.onJoinTeam}>
          +
        </Button>
      </Col>
    );

    const managementTemas = (
      <div>
        <Row
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Col span={18} style={{ textAlign: 'left' }}>
            <Search
              style={{ width: '396px' }}
              placeholder="请输入名称进行搜索"
              onSearch={this.handleSearchTeam}
            />
          </Col>
          {operation}
        </Row>

        {userTeamList.map((item, index) => {
          const {
            team_id,
            team_alias,
            region,
            owner_name,
            role,
            team_name,
          } = item;
          return (
            <Card
              key={team_id}
              style={{ marginBottom: '10px' }}
              hoverable
              bodyStyle={{ padding: 0 }}
            >
              <Row type="flex" align="middle" className={styles.pl24}>
                <Col span={3}>
                  <div className={styles.lt}>
                    <p>
                      <Icon type="arrow-down" />{index}
                    </p>
                  </div>
                </Col>

                <Col
                  span={12}
                  onClick={() => {
                    this.props.dispatch(
                      routerRedux.replace(
                        `/team/${team_name}/region/${region}/index`
                      )
                    );
                  }}
                >
                  {team_alias}
                </Col>
                <Col span={5}>{owner_name}</Col>
                <Col span={3}>{role}</Col>
                <Col span={1} className={styles.bor}>
                  <Dropdown
                    overlay={managementMenu(team_name)}
                    placement="bottomLeft"
                  >
                    <Button style={{ border: 'none' }}>
                      <Icon component={moreSvg} />
                    </Button>
                  </Dropdown>
                </Col>
              </Row>
            </Card>
          );
        })}
      </div>
    );

    return (
      <PageHeaderLayout
        title="——"
        content="将当前平台和云应用市场进行互联，同步应用，插件，数据中心等资源应用下载完成后，方可在 从应用市场安装 直接安装"
      >
        {userTeamsLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <div>{managementTemas}</div>
        )}
      </PageHeaderLayout>
    );
  }
}
