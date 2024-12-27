import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { Icon, Button, notification } from 'antd';
import ImageName from './image-name';
import ImageCmd from './image-cmd';
import ImageCompose from './image-compose';
import ImageNameDemo from './ImageName-Demo'
import roleUtil from '../../utils/newRole';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import globalUtil from '../../utils/global';
import ImgRepostory from '../../components/ImgRepostory';
import AddOrEditImageRegistry from '../../components/AddOrEditImageRegistry';
import rainbondUtil from '../../utils/rainbond';


import { createEnterprise, createTeam } from '../../utils/breadcrumb';

@connect(
  ({ teamControl, enterprise, global, region, user }) => ({
    rainbondInfo: global.rainbondInfo,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    cluster_info: region.cluster_info,
    currentUser: user.currentUser
  }),
  null,
  null,
  { pure: false }
)
export default class Main extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      archInfo: [],
      teamAppCreatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_app_create'),
      imageList: [],
      clusters: [],
      imageHubLoading: false,
    }
  }
  componentWillMount() {
    this.handleArchCpuInfo()
    this.getImageHub()
    this.loadClusters()
  }
  handleArchCpuInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'index/fetchArchOverview',
      payload: {
        region_name: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            archInfo: res.list
          })
        }
      }
    });
  }
  getImageHub = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'global/fetchPlatformImageHub',
      callback: data => {
        if (data) {
          this.setState({
            imageList: data.list
          });
        }
      }
    })
  }
  loadClusters = () => {
    const {
      dispatch,
      currentUser
    } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: currentUser?.enterprise_id
      },
      callback: res => {
        if (res && res.list) {
          const clusters = [];
          res.list.map((item, index) => {
            item.key = `cluster${index}`;
            clusters.push(item);
            return item;
          });

          this.setState({ clusters });
        } else {
          this.setState({ clusters: [] });
        }
      }
    });
  };
  handleTabChange = key => {
    if (key === 'add') {
      this.setState({
        visible: true
      })
    } else {
      const { dispatch } = this.props;
      const group_id = globalUtil.getGroupID()
      dispatch(
        routerRedux.push(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/image/${key}?group_id=${group_id}`
        )
      );
    }
  };
  handleAddImageHub = (values) => {
    const { dispatch } = this.props
    dispatch({
      type: 'global/addPlatformImageHub',
      payload: {
        secret_id: values.secret_id,
        domain: values.domain,
        username: values.username,
        password: values.password,
        hub_type: values.hub_type
      },
      callback: res => {
        if (res && res.response_data && res.response_data.code == 200) {
          notification.success({
            message: formatMessage({ id: 'notification.success.add' })
          })
          this.getImageHub()
        }
        this.setState({
          imageHubLoading: false,
          visible: false

        })
      }
    })
  }
  handelClone = () => {
    this.setState({
      visible: false
    })
  }
  render() {
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      match,
      rainbondInfo
    } = this.props;
    const { imageList, clusters, imageHubLoading } = this.state;
    const map = {
      custom: ImageName,
      Dockercompose: ImageCompose,
      ImageNameDemo: ImageNameDemo,
    };

    const tabList = [
      {
        key: 'custom',
        tab: formatMessage({ id: 'teamAdd.create.image.tabImage' }),
      },
      {
        key: 'Dockercompose',
        tab: 'Docker Compose',
      }
    ];

    if (imageList && imageList.length > 0) {
      imageList.forEach(item => {
        map[item.secret_id] = ImgRepostory
        tabList.push({
          key: item.secret_id,
          tab: `${item.hub_type} (${item.secret_id})`
        })
      })
    }
    if (rainbondUtil.officialDemoEnable(rainbondInfo)) {
      tabList.push({
        key: 'ImageNameDemo',
        tab: formatMessage({ id: 'teamAdd.create.code.demo' }),
      },)
    }
    tabList.push({
      key: 'add',
      tab: <Icon type="plus" style={{
        display: 'flex',
        padding: '12px 0px 5px',
        marginRight: '0 !important'
      }} />
    })

    const { archInfo, teamAppCreatePermission: { isAccess } } = this.state
    if (!isAccess) {
      return roleUtil.noPermission()
    }
    let { type } = match.params;
    type = type.split('?')[0];
    if (!type) {
      type = 'custom';
    }
    const Com = map[type];
    const group_id = globalUtil.getGroupID()
    return (
      <PageHeaderLayout
        title={formatMessage({ id: 'versionUpdata_6_1.createComponent' })}
        onTabChange={this.handleTabChange}
        content={formatMessage({ id: 'versionUpdata_6_1.createComponent.content' })}
        tabActiveKey={type}
        tabList={tabList}
        titleSvg={pageheaderSvg.getSvg('dockerSvg', 18)}
        extraContent={
          <Button onClick={() => {
            const { dispatch } = this.props;
            dispatch(
              routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard?group_id=${group_id}`)
            );
          }} type="default">
            <Icon type="home" />{formatMessage({ id: 'versionUpdata_6_1.wizard' })}
          </Button>
        }
      >
        {Com ? <Com archInfo={archInfo} {...this.props} key={type} /> : <FormattedMessage id="teamAdd.create.error" />}
        {this.state.visible && (
          <AddOrEditImageRegistry
            loading={imageHubLoading}
            imageList={imageList}
            clusters={clusters}
            onOk={this.handleAddImageHub}
            onCancel={this.handelClone}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
