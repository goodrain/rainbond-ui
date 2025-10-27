/* eslint-disable camelcase */
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { Icon, Button, message } from 'antd';
import { formatMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/newRole';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import styles from './Index.less';
import DatabaseCreateForm from '../../components/DatabaseCreateForm';

// 数据库创建页面主组件
@connect(
  ({ teamControl, global, enterprise, user, kubeblocks }) => ({
    rainbondInfo: global.rainbondInfo,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    enterprises: global.enterprise,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    currUser: user.currentUser,
    databaseTypes: kubeblocks.databaseTypes
  }),
  null,
  null,
  { pure: false }
)
export default class Main extends PureComponent {
  constructor(props) {
    super(props);
    this.formRef = React.createRef();
    this.state = {
      // 检查用户是否有创建应用的权限
      teamAppCreatePermission: roleUtil.queryPermissionsInfo(
        this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team,
        'team_app_create'
      ),
      loading: false // 提交按钮的加载状态
    };
  }

  componentDidMount() {
    // 获取数据库类型列表
    this.fetchDatabaseTypes();
  }

  // 获取数据库类型列表
  fetchDatabaseTypes = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'kubeblocks/fetchKubeBlocksDatabaseTypes',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName()
      }
    });
  };

  handleTabChange = () => {};
  

  handleSubmit = (values) => {
    if (!values.service_cname) {
      message.error('请填写组件名称');
      return;
    }

    if (!values.database_type) {
      message.error('请选择数据库类型');
      return;
    }

    this.props.dispatch(
      routerRedux.push({
        pathname: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/database-config`,
        query: {
          database_type: values.database_type,
          service_cname: values.service_cname,
          k8s_app: values.k8s_component_name || values.k8s_app,
          group_name: values.group_name,
          group_id: values.group_id
        }
      })
    );
  };

  render() {
    const {
      rainbondInfo,
      currentEnterprise,
      currentTeam,
      currentRegionName,
      dispatch
    } = this.props;

    const { teamAppCreatePermission: { isAccess }, loading } = this.state;
    const { databaseTypes } = this.props;

    if (!isAccess) {
      return roleUtil.noPermission();
    }

    // 处理数据库类型选项
    const databaseTypeOptions = Array.isArray(databaseTypes)
      ? databaseTypes.map(item => ({ label: item.type, value: item.type }))
      : [];

    const tabList = [
      {
        key: 'config',
        tab: formatMessage({ id: 'kubeblocks.database.create.tab' })
      }
    ];

    let { type } = this.props.match.params;
    type = type ? type.split('?')[0] : 'config';
    if (!type) {
      type = 'config';
    }

    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: formatMessage({ id: 'kubeblocks.database.create.title' }) });

    const group_id = globalUtil.getGroupID() || '';
    const isAppOverview = this.props.location?.query?.type || '';

    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={formatMessage({ id: 'kubeblocks.database.create.title' })}
        onTabChange={this.handleTabChange}
        content={<p>{formatMessage({ id: 'kubeblocks.database.create.subtitle' })}</p>}
        tabActiveKey={type}
        tabList={tabList}
        titleSvg={pageheaderSvg.getPageHeaderSvg('database', 18)}
        isContent
        extraContent={
          <Button
            onClick={() => {
              dispatch(
                routerRedux.push(
                  `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard?group_id=${group_id}&type=${isAppOverview}`
                )
              );
            }}
            type="default"
          >
            <Icon type="rollback" />
            {formatMessage({ id: 'button.return' })}
          </Button>
        }
      >
        <div className={styles.formWrap} style={{ width: '600px' }}>
          <DatabaseCreateForm
            ref={this.formRef}
            databaseTypes={databaseTypeOptions}
            loading={loading}
            onSubmit={this.handleSubmit}
          />
        </div>
      </PageHeaderLayout>
    );
  }
}
