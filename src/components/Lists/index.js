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
                <Icon type="arrow-down" />
                {index}
              </p>
            </div>
          </Col>

          <Col
            span={6}
            onClick={() => {
              this.props.dispatch(
                routerRedux.replace(`/team/${team_name}/region/${region}/index`)
              );
            }}
          >
            {team_alias}
          </Col>
          <Col span={3}>{owner_name}</Col>
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
  }
}
