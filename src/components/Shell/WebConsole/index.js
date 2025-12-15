import { Col, Row, Spin, Tabs, Tree } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import globalUtil from '../../../utils/global';
import styles from './index.less';
import XTerm from '../../../pages/Component/WebConsole/xTerm';

const { TreeNode } = Tree;
const { TabPane } = Tabs;
@connect(
  ({ user, appControl, global, teamControl, enterprise }) => ({
    currUser: user.currentUser,
    appDetail: appControl.appDetail,
    pods: appControl.pods,
    groups: global.groups,
    build_upgrade: appControl.build_upgrade,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise
  }),
  null,
  null,
  { withRef: true }
)
export default class WebConsole extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      loading: false,
      pods: [],
      tabs: [],
      leftWidth: 5,
      appDetail: {},
      activeKey: '',
      ClustersList: [],
      containers: '',
      name: '',
      namespace: '',
      tcpUrl: '',
      region_name: '',
      arr:[]
    };
  }
  componentDidMount() {
    this.handleLoadEnterpriseClusters()
    const urlParams = new URL(window.location.href);
    if(urlParams){
      const bool = urlParams.href.includes("/shell")
      if(bool){
        window.addEventListener('beforeunload', (event) => {
          event.preventDefault();
          event.returnValue = '';
          const { tabs, region_name } = this.state;
          for (let index = 0; index < tabs.length; index++) {
            const { dispatch } = this.props
            dispatch({
              type: 'global/deleteShellPod',
              payload: {
                region_name: region_name,
                pod_name: tabs[index].podName
              },
              callback: res => {
              }
            })
          }
        });
      }
    }
  }
  componentWillUnmount() {
    const { tabs, region_name } = this.state;
    for (let index = 0; index < tabs.length; index++) {
      const { dispatch } = this.props
      dispatch({
        type: 'global/deleteShellPod',
        payload: {
          region_name: region_name,
          pod_name: tabs[index].podName
        },
        callback: res => {
        }
      })
    }
    window.removeEventListener('beforeunload', (event) => {
      event.preventDefault();
      event.returnValue = '';
      const { tabs, region_name } = this.state;
      for (let index = 0; index < tabs.length; index++) {
        const { dispatch } = this.props
        dispatch({
          type: 'global/deleteShellPod',
          payload: {
            region_name: region_name,
            pod_name: tabs[index].podName
          },
          callback: res => {
          }
        })
      }
    })
  }
  // 获取企业的集群信息
  handleLoadEnterpriseClusters = () => {
    const { dispatch } = this.props;
    const eid = globalUtil.getCurrEnterpriseId();
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res.status_code == 200) {
          this.setState({
            ClustersList: res.list,
          }, () => {
            const { ClustersList } = this.state
            const reg = /region_name=([^\/]+)/;
            const hash = window.location.hash || window.location.pathname || '';
            const regionName = hash.match(reg);
            if(regionName && regionName[1] ){
              const regionId = ClustersList.find(item => item.region_name === regionName[1]).region_id
              if(regionId){
                this.onSelect(regionName[1], regionId)
              }
            }
          })
        }
      }
    });
  };

  clusterInfo = (val, url) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/createShellPod',
      payload: {
        region_name: val
      },
      callback: res => {
        const info = res.bean.bean
        const { metadata, spec } = info
        const { name, namespace, } = metadata
        const { containers } = spec
        const { arr }  = this.state 
        arr.push({ containers: containers[0].name,
          name: name,
          namespace: namespace,
          tcpUrl: url})
          this.setState({
            containers: containers[0].name,
            name: name,
            namespace: namespace,
            tcpUrl: url
          })
        this.openConsole(name, containers[0].name)
      }
    })
  }
  remove = key => {
    const { tabs } = this.state;
    const tab = tabs.filter(item => item.key !== key);
    const activeKey = tab.length > 0 ? tab[0].key : '';
    this.setState({ tabs: tab, activeKey });
  };
  onEdit = (targetKey, action) => {
    this[action](targetKey);
    const { name, region_name } = this.state
    const { dispatch } = this.props
    dispatch({
      type: 'global/deleteShellPod',
      payload: {
        region_name: region_name,
        pod_name: name
      },
      callback: res => {
      }
    })


  };
  onChange = key => {
    this.setState({ activeKey: key });
  };
  onSelect = (region_name, region_id) => {
    const eid = globalUtil.getCurrEnterpriseId();
    this.setState({
      region_name: region_name
    })
    this.props.dispatch({
      type: 'region/fetchEnterpriseCluster',
      payload: {
        enterprise_id: eid,
        region_id: region_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.clusterInfo(region_name, res.bean.wsurl)
        }
      }
    });
  };

  openConsole = (podName, containerName) => {
    const activeKey = Math.random()
      .toString(36)
      .slice(-8);
    const tab = {
      podName,
      containerName,
      title: containerName,
      key: activeKey,
    };

    const { tabs } = this.state;
    tabs.push(tab);
    this.setState({ tabs, activeKey });
  };

  updateTitle = (key, title) => {
    const { tabs } = this.state;
    const newTabs = [];
    tabs.forEach(item => {
      if (item.key == key) {
        item.title = title;
      }
      newTabs.push(item);
    });
    this.setState({ tabs: newTabs });
  };



  controllLeft = () => {
    const { leftWidth } = this.state;
    if (leftWidth === 0) {
      this.setState({ leftWidth: 5 });
    } else {
      this.setState({ leftWidth: 0 });
    }
  };

  clearLoading = () => {
    this.setState({ loading: false });
  };

  leftRender = service => {
    const { pods, loading, ClustersList } = this.state;
    const { height } = this.props
    return (
      <div className={height ? styles.menus : styles.menuss}>
        <div className={styles.header}>
          <span>{formatMessage({ id: 'otherEnterprise.shell.list' })}</span>
        </div>

        <Spin spinning={loading} tip="Loading...">
          {ClustersList && ClustersList.length > 0 && (
            <div>
              {ClustersList.map((item) => {
                const { region_alias, region_name, region_id } = item
                return <p onClick={() => this.onSelect(region_name, region_id)} className={styles.region_alias}>{region_alias}</p>
              })}
            </div>
          )
          }
        </Spin>
      </div>
    );
  };

  tabContent = (title,index, key) => {
    const { arr } = this.state;
    const { height } = this.props
    const newHeight = height - 30
    const xx = arr[index]
    const tcpUrl = `${xx.tcpUrl}/event_log`
    return (
      <XTerm
        key={arr[index].name + arr[index].containers}
        tenantID={''}
        serviceID={''}
        WebsocketURL={tcpUrl}
        updateTitle={title => this.updateTitle(key, title)}
        podName={arr[index].name}
        containerName={arr[index].containers}
        namespace={arr[index].namespace}
        height={newHeight}
        type={true}
      />
    );
  };

  render() {
    const { leftWidth, tabs, appDetail, activeKey, containers } = this.state;
    const service = appDetail && appDetail.service;
    const { height } = this.props
    return (
      <Row className={height ? styles.box : styles.boxs}>
        <Col
          className={styles.col}
          style={{ background: '#2f2a2a' }}
          span={leftWidth}
        >
          {this.leftRender(service)}
        </Col>
        <Col className={styles.col} span={24 - leftWidth}>
          <span onClick={this.controllLeft} className={styles.control}>
            {leftWidth > 0 ? (
              <svg
                t="1588476023049"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="4836"
                width="200"
                height="200"
              >
                <path
                  d="M68.608 517.632l207.36 159.744V357.888zM939.52 227.328H83.968c-8.704 0-15.872-7.168-15.872-15.872V144.384c0-8.704 7.168-15.872 15.872-15.872h855.552c8.704 0 15.872 7.168 15.872 15.872v67.072c0 8.704-7.168 15.872-15.872 15.872M939.52 906.24H83.968c-8.704 0-15.872-7.168-15.872-15.872v-67.072c0-8.704 7.168-15.872 15.872-15.872h855.552c8.704 0 15.872 7.168 15.872 15.872v67.072c0 8.704-7.168 15.872-15.872 15.872M939.52 453.632H429.056c-8.704 0-15.872-7.168-15.872-15.872V370.688c0-8.704 7.168-15.872 15.872-15.872h510.464c8.704 0 15.872 7.168 15.872 15.872v67.072c0 8.704-7.168 15.872-15.872 15.872M939.52 679.936H429.056c-8.704 0-15.872-7.168-15.872-15.872v-67.072c0-8.704 7.168-15.872 15.872-15.872h510.464c8.704 0 15.872 7.168 15.872 15.872v67.072c0 8.704-7.168 15.872-15.872 15.872"
                  fill="#ffffff"
                  p-id="4837"
                />
              </svg>
            ) : (
              <svg
                t="1588476580322"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="5067"
                width="200"
                height="200"
              >
                <path
                  d="M112.80000001 356L623.2 356c24.8 0 44.8 21.6 44.8 48s-20 48-44.8 48l-510.4 0c-24.8 0-44.8-21.6-44.8-48s20-48 44.80000001-48z m-1e-8 224L623.2 580c24.8 0 44.8 21.6 44.8 48s-20 48-44.8 48l-510.4-1e-8c-24.8 0-44.8-21.6-44.8-47.99999999s20-48 44.8-48zM116 796L900 796c26.4 0 48 21.6 48 48s-21.6 48-48 48l-784 0c-26.4 0-48-21.6-48-48s21.6-48 48-48zM724 356L948 516l-224 160 0-320zM900 236l-784 0c-26.4 0-48-21.6-48-48s21.6-48 48-48L900 140c26.4 0 48 21.6 48 48s-21.6 48-48 48z"
                  p-id="5068"
                  fill="#ffffff"
                />
              </svg>
            )}
          </span>
          <div className={styles.tabs}>
            {tabs.length > 0 && (
              <Tabs
                defaultActiveKey={`${tabs[tabs.length - 1].key}`}
                onChange={this.onChange}
                activeKey={activeKey}
                type="editable-card"
                onEdit={this.onEdit}
                hideAdd
              >
                {tabs.map((item, index) => {
                  const { title, podName, key, containerName } = item;
                  return (
                    <TabPane
                      tab={
                        <div>
                          <span className={styles.titleTab}>
                            {title || podName}
                          </span>
                        </div>
                      }
                      className={styles.consoleBox}
                      key={key}
                    >
                        {this.tabContent(title, index,key)}
                    </TabPane>
                  );
                })}
              </Tabs>
            )}
          </div>
        </Col>
      </Row>
    );
  }
}
