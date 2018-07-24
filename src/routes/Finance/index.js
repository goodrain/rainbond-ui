import React, { PureComponent } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Link } from 'dva/router';
import { Card, Row, Col, DatePicker } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from '../List/BasicList.less';
import globalUtil from '../../utils/global';
import InvoiceEcharts from '../../components/InvoiceEcharts';
import PayHistory from '../../components/PayHistory';
import ConsumeDetail from '../../components/ConsumeDetail';
import userUtil from '../../utils/user';

@connect(({ user, list, loading }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
}))
export default class BasicList extends PureComponent {
  constructor(props) {
    super(props);
    const params = this.getParam();
    this.state = {
      date: moment(new Date().getTime()).format('YYYY-MM-DD'),
      companyInfo: {},
      disk: {},
      memory: {},
      list: [],
      datalist: [],
      showPayHistory: false,
      showConsumeDetail: false,
      scope: params.type || 'finance',
    };
  }
  getParam() {
    return this.props.match.params;
  }
  // 获取某个数据中心的资源详情  // 新-- 数据中心列表
  getRegionResource() {
    this.props.dispatch({
      type: 'global/getRegionSource',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: this.props.user.enterprise_id,
        //  region: globalUtil.getCurrRegionName()
        region: '',
      },
      callback: (data) => {
        this.setState({ datalist: data.list });
      },
    });
  }
  // 获取企业信息 //新-- 企业信息
  getCompanyInfo = () => {
    this.props.dispatch({
      type: 'global/getCompanyInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: this.props.user.enterprise_id,
      },
      callback: (data) => {
        this.setState({ companyInfo: data.bean });
      },
    });
  };
  // 获取某数据中心下某一天的资源费用数据
  getRegionOneDayMoney = () => {
    this.props.dispatch({
      type: 'global/getRegionOneDayMoney',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: this.props.user.enterprise_id,
        date: this.state.date,
        region: globalUtil.getCurrRegionName(),
      },
      callback: (data) => {
        this.setState({ list: data.list || [] });
      },
    });
  };
  componentDidMount() {
    this.getCompanyInfo();
  }
  showConsumeDetail = () => {
    this.setState({ showConsumeDetail: true });
  };
  hideConsumeDetail = () => {
    this.setState({ showConsumeDetail: false });
  };
  showPayHistory = () => {
    this.setState({ showPayHistory: true });
  };
  hidePayHistory = () => {
    this.setState({ showPayHistory: false });
  };
  handleTabChange = (key) => {
    this.setState({ scope: key });
  };
  handleDateChange = (date, str) => {
    this.setState({ date: str }, () => {
      this.getRegionOneDayMoney();
    });
  };
  finance = () => {
    const { loading } = this.props;
    const list = this.state.list || [];
    const datalist = this.state.datalist;
    const companyInfo = this.state.companyInfo || {};

    const Info = ({ title, value, bordered }) => (
      <div className={styles.headerInfo}>
        <span>{title}</span>
        <p>{value}</p>
        {bordered && <em />}
      </div>
    );

    const extraContent = (
      <div className={styles.extraContent}>
        <DatePicker
          onChange={this.handleDateChange}
          allowClear={false}
          defaultValue={moment(this.state.date, 'YYYY-MM-DD')}
        />
      </div>
    );
    return (
      <div className={styles.standardList}>
        {this.state.showPayHistory && (<PayHistory onCancel={this.hidePayHistory} />)}
        {this.state.showConsumeDetail && (<ConsumeDetail onCancel={this.hideConsumeDetail} />)}
        <Card bordered={false}>
          <Row>
            <Col sm={8} xs={24}>
              <Info title="企业账户" value={`${companyInfo.balance || 0}元`} bordered />
              <p style={{ textAlign: 'center' }}>
                <a
                  target="_blank"
                  href="https://www.goodrain.com/spa/#/personalCenter/my/recharge"
                  style={{ paddingRight: '10px' }}
                >
                  充值
                </a>
                <Link
                  to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/invoiceManage`}
                >
                  发票管理
                </Link>
              </p>
            </Col>
            <Col sm={8} xs={24}>
              <Info
                title="上一小时按需消费"
                value={`${companyInfo.last_hour_cost || 0}元`}
                bordered
              />
            </Col>
            <Col sm={8} xs={24}>
              <Info
                title="本月账单"
                value={`消耗${companyInfo.cost || 0}元 / 充值${companyInfo.recharge || 0} 元`}
              />
              <p style={{ textAlign: 'center' }}>
                <a
                  href="javascript:;"
                  onClick={this.showConsumeDetail}
                  style={{ paddingRight: '10px' }}
                >
                  消耗明细
                </a>
                <a href="javascript:;" onClick={this.showPayHistory}>
                  充值明细
                </a>
              </p>
            </Col>
          </Row>
        </Card>
        <InvoiceEcharts enterprise_id={this.props.user.enterprise_id} />
      </div>
    );
  };
  manage = () => <Card />;

  renderContent = () => {
    const { user } = this.props;
    const { loading, isChecked } = this.state;

    // 不是系统管理员
    if (!userUtil.isSystemAdmin(user) && !userUtil.isCompanyAdmin(user)) {
      this.props.dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/Exception/403`));
      return null;
    }

    if (this.state.scope === 'finance') {
      return this.finance();
    }

    if (this.state.scope === 'manage') {
      return this.manage();
    }
  };

  render() {
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.content}>
          <div>企业管理员管理中心</div>
        </div>
      </div>
    );

    const tabList = [
      {
        key: 'finance',
        tab: '财务',
      },
      {
        key: 'manage',
        tab: '管理',
      },
    ];

    return (
      <PageHeaderLayout
        tabList={tabList}
        tabActiveKey={this.state.scope}
        onTabChange={this.handleTabChange}
        content={pageHeaderContent}
      >
        {this.renderContent()}
      </PageHeaderLayout>
    );
  }
}
