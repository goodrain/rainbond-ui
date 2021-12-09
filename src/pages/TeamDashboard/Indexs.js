/* eslint-disable react/sort-comp */
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  Row,
  Select,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import EditableLinkGroup from '../../components/EditableLinkGroup';
import IndexTable from '../../components/IndexTable';
import ScrollerX from '../../components/ScrollerX';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import sourceUtil from '../../utils/source-unit';
import userUtil from '../../utils/user';
import styles from './Index.less';

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ user, index, loading, global }) => ({
  currUser: user.currentUser,
  index,
  events: index.events,
  pagination: index.pagination,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  projectLoading: loading.effects['project/fetchNotice'],
  activitiesLoading: loading.effects['activities/fetchList'],
  loading
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      disk: {},
      memory: {},
      companyInfo: {}
    };
  }
  componentDidMount() {
    this.loadOverview();
    this.loadApps();
    this.loadEvents();
    this.timer = setInterval(() => {
      this.loadApps();
      this.loadOverview();
    }, 10000);

    if (this.isPublicRegion()) {
      this.getCompanyInfo();
      this.getRegionResource();
    }
  }
  componentWillUnmount() {
    clearInterval(this.timer);
  }
  getLinks() {
    const codelinks = [
      {
        title: '自定义源码',
        icontype: 'code',
        href: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/code/custom`
      }
    ];
    const imagelinks = [
      {
        title: '指定镜像',
        icontype: 'laptop',
        href: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/image/custom`
      },
      {
        title: 'DockerRun命令',
        icontype: 'laptop',
        href: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/image/dockerrun`
      },
      {
        title: 'Dockercompose',
        icontype: 'laptop',
        href: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/image/Dockercompose`
      },
      {
        title: '从应用市场安装',
        icontype: 'appstore-o',
        href: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/market`
      }
    ];
    const { enterprise } = this.props;
    if (rainbondUtil.OauthbTypes(enterprise, 'github')) {
      codelinks.push({
        title: 'Github项目',
        icontype: 'github',
        href: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/code/github`
      });
    }
    if (rainbondUtil.OauthbTypes(enterprise, 'gitlab')) {
      codelinks.push({
        title: 'Gitlab仓库',
        icontype: 'gitlab',
        href: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/code/goodrain`
      });
    }
    codelinks.push(...imagelinks);
    return codelinks;
  }

  getRegionResource() {
    this.props.dispatch({
      type: 'global/getRegionSource',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: this.props.currUser.enterprise_id,
        region: globalUtil.getCurrRegionName()
      },
      callback: data => {
        if (data) {
          this.setState({
            memory: data.bean.memory || {},
            disk: data.bean.disk
          });
        }
      }
    });
  }
  getCompanyInfo = () => {
    this.props.dispatch({
      type: 'global/getCompanyInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: this.props.currUser.enterprise_id
      },
      callback: data => {
        if (data) {
          this.setState({ companyInfo: data.bean });
        }
      }
    });
  };

  isPublicRegion() {
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const region = userUtil.hasTeamAndRegion(
      this.props.currUser,
      teamName,
      regionName
    );
    if (region) {
      return region.region_scope === 'public';
    }
    return false;
  }

  loadOverview = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'index/fetchOverview',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (res) {
          dispatch({
            type: 'global/setNouse',
            payload: {
              isNouse: false
            }
          });
        }
      },
      handleError: res => {
        if (res && res.code === 10400) {
          dispatch({
            type: 'global/setNouse',
            payload: {
              isNouse: true
            }
          });
        }
      }
    });
  };

  loadEvents = () => {
    this.props.dispatch({
      type: 'index/fetchEvents',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page: 1,
        page_size: 6
      }
    });
  };
  loadApps = () => {
    const { dispatch, form, index } = this.props;
    const { pagination } = index;
    let searchKey = {
      searchKey: '',
      service_status: ''
    };
    // 获取搜索信息
    form.validateFields((err, fieldsValue) => {
      searchKey = fieldsValue;
    });

    const payload = {
      team_name: globalUtil.getCurrTeamName(),
      region_name: globalUtil.getCurrRegionName(),
      page: pagination.currentPage,
      page_size: pagination.pageSize,
      order: (pagination.order || '').replace('end', ''),
      fields: pagination.fields,
      ...searchKey
    };
    dispatch({
      type: 'index/fetchApps',
      payload,
      callback: res => {

      }
    });
  };

  renderSimpleForm() {
    const { getFieldDecorator } = this.props.form;
    const status = [
      {
        value: 'all',
        text: '全部'
      },
      {
        value: 'running',
        text: '运行中'
      },
      {
        value: 'closed',
        text: '已关闭'
      },
      {
        value: 'abnormal',
        text: '运行异常'
      }
    ];
    return (
      <Form
        onSubmit={this.handleSearch}
        layout="inline"
        style={{
          paddingBottom: 8
        }}
      >
        <Row
          gutter={{
            md: 8,
            lg: 24,
            xl: 48
          }}
        >
          <Col md={8} sm={24}>
            <FormItem label="组件名称">
              {getFieldDecorator('query_key')(<Input placeholder="请输入" />)}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="组件状态">
              {getFieldDecorator('service_status', { initialValue: 'all' })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder="请选择"
                >
                  {status.map(item => (
                    <Option key={item.value} value={item.value}>
                      {item.text}
                    </Option>
                  ))}
                </Select>
              )}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <span className={styles.submitButtons}>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button
                style={{
                  marginLeft: 8
                }}
                onClick={this.handleFormReset}
              >
                重置
              </Button>
            </span>
          </Col>
        </Row>
      </Form>
    );
  }
  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    dispatch({
      type: 'index/savePage',
      payload: {
        currentPage: 1
      }
    });
    setTimeout(() => {
      this.loadApps();
    });
  };
  handleSearch = e => {
    e.preventDefault();
    this.loadApps();
    const { dispatch } = this.props;
    dispatch({
      type: 'index/savePage',
      payload: {
        currentPage: 1
      }
    });
    setTimeout(() => {
      this.loadApps();
    });
  };
  handleListChange = (pagination, filtersArg, sorter) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'index/savePage',
      payload: {
        currentPage: pagination.current,
        pageSize: pagination.pageSize,
        order: sorter.field ? sorter.order : '',
        fields: sorter.field ? sorter.field : ''
      }
    });
    setTimeout(() => {
      this.loadApps();
    });
  };
  renderActivities() {
    const list = this.props.events || [];

    if (!list.length) {
      return (
        <p
          style={{
            textAlign: 'center',
            color: 'ccc',
            paddingTop: 20
          }}
        >
          暂无动态
        </p>
      );
    }

    const statusCNMap = {
      '': '进行中',
      complete: '完成',
      failure: '失败',
      timeout: '超时'
    };

    return list.map(item => {
      const linkTo = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
        item.service_alias
      }/overview`;
      return (
        <List.Item key={item.ID}>
          <List.Item.Meta
            title={
              <span>
                <a className={styles.username}>{item.nick_name}</a>
                <span className={styles.event}>{item.type_cn}</span>
                <Link to={linkTo} className={styles.event}>
                  {item.service_cname}
                </Link>
                <span className={styles.datetime}>
                  应用
                  {statusCNMap[item.final_status]
                    ? `${statusCNMap[item.final_status]}`
                    : ''}
                </span>
              </span>
            }
            description={
              <span className={styles.datatime_float} title={item.updatedAt}>
                {moment(item.start_time).fromNow()}
              </span>
            }
          />
        </List.Item>
      );
    });
  }
  render() {
    const {
      index,
      projectLoading,
      activitiesLoading,
      currUser,
      pagination
    } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const team = userUtil.getTeamByTeamName(currUser, team_name);

    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.avatar}>
          <Avatar
            size="large"
            src={require('../../../public/images/team-icon.png')}
          />
        </div>
        <div className={styles.content}>
          <div className={styles.contentTitle}>{team.team_alias}</div>
          <div>
            创建于{' '}
            {moment(team.create_time)
              .locale('zh-cn')
              .format('YYYY-MM-DD')}
          </div>
        </div>
      </div>
    );

    let money = `${this.state.companyInfo.balance || 0} 元`;
    if (this.state.companyInfo.owed_amt > 0) {
      money = `欠费 ${this.state.companyInfo.owed_amt} 元`;
    }
    const extraContent = (
      <div className={styles.extraContent}>
        <div className={styles.statItem}>
          <p>应用总数</p>
          <p>{index.overviewInfo.team_app_num || 0}</p>
        </div>
        <div className={styles.statItem}>
          <p>组件总数</p>
          <p>{index.overviewInfo.team_service_num || 0}</p>
        </div>
        <div className={styles.statItem}>
          <p>团队成员</p>
          <p>{index.overviewInfo.user_nums || 0}</p>
        </div>
        {this.isPublicRegion() ? (
          <Fragment>
            <div className={styles.statItem}>
              <p>账户余额</p>
              <p>{money}</p>
            </div>
            <div className={styles.statItem}>
              <p>已使用内存</p>
              <Tooltip
                title={`总计：${this.state.memory.limit || 0} 过期时间：${this
                  .state.memory.expire_date || '-'}`}
              >
                <p>
                  {`${sourceUtil.unit(
                    index.overviewInfo.team_service_memory_count || 0,
                    'MB'
                  )}`}
                </p>
              </Tooltip>
            </div>
            <div className={styles.statItem}>
              <p>已使用磁盘</p>
              <Tooltip
                title={`总计：${this.state.disk.limit || 0} 过期时间：${this
                  .state.disk.expire_date || '-'}`}
              >
                <p>
                  {`${sourceUtil.unit(
                    index.overviewInfo.team_service_total_disk || 0,
                    'MB'
                  )}`}
                </p>
              </Tooltip>
            </div>
          </Fragment>
        ) : (
          <Fragment>
            <div className={styles.statItem}>
              <p>已使用内存</p>
              <p>
                {`${sourceUtil.unit(
                  index.overviewInfo.team_service_memory_count || 0,
                  'MB'
                )}`}
              </p>
            </div>
            <div className={styles.statItem}>
              <p>已使用磁盘</p>
              <p>
                {`${sourceUtil.unit(
                  index.overviewInfo.team_service_total_disk || 0,
                  'MB'
                )}`}
              </p>
            </div>
          </Fragment>
        )}
      </div>
    );

    return (
      <PageHeaderLayout
        breadcrumbList={[
          {
            title: '首页',
            href: '/'
          }
        ]}
        content={pageHeaderContent}
        extraContent={extraContent}
      >
        <Row gutter={24}>
          <Col xl={16} lg={24} md={24} sm={24} xs={24}>
            <Card
              bordered={false}
              style={{
                marginBottom: 24
              }}
            >
              <div className={styles.tableList}>
                <div className={styles.tableListForm}>
                  {this.renderSimpleForm()}
                </div>
                <ScrollerX sm={600}>
                  <IndexTable
                    list={index.apps}
                    pagination={pagination}
                    onChange={this.handleListChange}
                  />
                </ScrollerX>
              </div>
            </Card>
          </Col>
          <Col xl={8} lg={24} md={24} sm={24} xs={24}>
            <Card
              style={{
                marginBottom: 24
              }}
              title="快速创建应用"
              bordered={false}
              bodyStyle={{
                padding: 0
              }}
            >
              <EditableLinkGroup
                onAdd={() => {}}
                links={this.getLinks()}
                linkElement={Link}
              />
            </Card>

            <Card
              bodyStyle={{
                padding: 0
              }}
              bordered={false}
              className={styles.activeCard}
              title="动态"
              loading={activitiesLoading}
            >
              <List loading={activitiesLoading} size="large">
                <div className={styles.activitiesList}>
                  {this.renderActivities()}
                </div>
              </List>
            </Card>
          </Col>
        </Row>
      </PageHeaderLayout>
    );
  }
}
