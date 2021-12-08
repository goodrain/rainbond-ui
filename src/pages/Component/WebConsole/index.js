import { Col, Row, Spin, Tabs, Tree } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import globalUtil from '../../../utils/global';
import styles from './index.less';
import XTerm from './xTerm';

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
      activeKey: ''
    };
  }
  componentDidMount() {
    this.loadDetail();
  }
  onEdit = (targetKey, action) => {
    this[action](targetKey);
  };
  onChange = key => {
    this.setState({ activeKey: key });
  };
  onSelect = selectedKeys => {
    if (selectedKeys.length > 0) {
      const podNameAndContainerName = selectedKeys[0];
      if (podNameAndContainerName.indexOf('.') > -1) {
        const names = podNameAndContainerName.split('.');
        const podName = names[0];
        const containerName = names[1];
        this.setState({ podName, containerName });
        this.openConsole(podName, containerName);
      }
    } else {
      const { podName, containerName } = this.state;
      if (podName && containerName) {
        this.openConsole(podName, containerName);
      }
    }
  };

  openConsole = (podName, containerName) => {
    const activeKey = Math.random()
      .toString(36)
      .slice(-8);
    const tab = {
      podName,
      containerName,
      title: containerName,
      key: activeKey
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

  fetchPods = isAssignment => {
    this.setState({ loading: true });
    const {
      appDetail: {
        service: { service_id }
      }
    } = this.state;
    this.props.dispatch({
      type: 'appControl/fetchPods',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: globalUtil.getComponentID()
      },
      callback: data => {
        let pods = [];
        if (data.list && data.list.new_pods) {
          pods = data.list.new_pods;
        }
        if (data.list && data.list.old_pods) {
          pods = pods.concat(data.list.old_pods);
        }
        this.clearLoading();
        if (
          isAssignment &&
          pods &&
          pods.length > 0 &&
          pods[0].container &&
          pods[0].container.length > 0
        ) {
          const noPlugContainers = pods[0].container.filter(item =>
            item.container_name.includes(service_id)
          );

          const container_name =
            noPlugContainers && noPlugContainers.length > 0
              ? noPlugContainers[0].container_name
              : pods[0].container[0].container_name;
          const activeKey = Math.random()
            .toString(36)
            .slice(-8);

          const tab = {
            podName: pods[0].pod_name,
            containerName: container_name,
            title: container_name,
            key: activeKey
          };
          this.setState({ tabs: [tab], activeKey, pods });
        } else {
          this.setState({ pods });
        }
      }
    });
  };

  loadDetail = () => {
    this.props.dispatch({
      type: 'appControl/fetchDetail',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: globalUtil.getComponentID()
      },
      callback: appDetail => {
        this.setState({ appDetail }, () => {
          this.fetchPods(true);
        });
      }
    });
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

  remove = key => {
    const { tabs } = this.state;
    const tab = tabs.filter(item => item.key !== key);
    const activeKey = tab.length > 0 ? tab[0].key : '';
    this.setState({ tabs: tab, activeKey });
  };

  leftRender = service => {
    const { pods, loading } = this.state;
    let defaultSelectedKeys = [];
    if (
      pods &&
      pods.length > 0 &&
      pods[0].container &&
      pods[0].container.length > 0
    ) {
      defaultSelectedKeys = [pods[0].container[0].container_name];
    }
    return (
      <div className={styles.menus}>
        <div className={styles.header}>
          <span>实例列表</span>
          <span
            className={styles.sync}
            onClick={() => {
              this.fetchPods(false);
            }}
          >
            <svg
              t="1588475055820"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="3297"
              width="20"
              height="20"
            >
              <path
                d="M134.4 518.4c19.2 0 38.4-19.2 38.4-38.4 0-185.6 153.6-339.2 339.2-339.2 115.2 0 217.6 57.6 281.6 147.2h-44.8c-19.2 0-38.4 19.2-38.4 38.4s19.2 38.4 38.4 38.4h140.8c19.2 0 38.4-19.2 38.4-38.4V192c0-19.2-19.2-38.4-38.4-38.4s-38.4 19.2-38.4 38.4v44.8C768 128 646.4 64 512 64 281.6 64 96 249.6 96 480c0 19.2 19.2 38.4 38.4 38.4z m755.2-76.8c-19.2 0-38.4 19.2-38.4 38.4 0 185.6-153.6 339.2-339.2 339.2-102.4 0-204.8-51.2-262.4-128h38.4c19.2 0 38.4-19.2 38.4-38.4s-19.2-38.4-38.4-38.4H147.2c-19.2 0-38.4 19.2-38.4 38.4v140.8c0 19.2 19.2 38.4 38.4 38.4s38.4-19.2 38.4-38.4v-57.6C262.4 838.4 384 896 512 896c230.4 0 416-185.6 416-416 0-19.2-19.2-38.4-38.4-38.4z"
                p-id="3298"
                fill="#ffffff"
              />
            </svg>
          </span>
        </div>

        <Spin spinning={loading} tip="Loading...">
          {pods && pods.length > 0 && (
            <Tree
              defaultExpandAll
              onSelect={this.onSelect}
              defaultSelectedKeys={defaultSelectedKeys}
            >
              {pods.map(pod => {
                const { pod_name: podName } = pod;
                let title = podName;
                if (title.includes('deployment')) {
                  title = title.slice(title.indexOf('-') + 1);
                }
                return (
                  <TreeNode title={`实例/${title}`} key={podName}>
                    {pod.container.map(container => {
                      const { container_name: containerName } = container;
                      let titleName = `容器/${containerName}`;
                      if (containerName.includes('default-tcpmesh')) {
                        titleName = `默认Mesh容器`;
                      } else if (containerName.includes('plugin')) {
                        titleName = `插件容器`;
                      } else if (containerName.includes(service.k8s_component_name)) {
                        titleName = `组件容器`;
                      }
                      

                      return (
                        <TreeNode
                          isLeaf
                          title={titleName}
                          key={`${podName}.${containerName}`}
                        />
                      );
                    })}
                  </TreeNode>
                );
              })}
            </Tree>
          )}
        </Spin>
      </div>
    );
  };

  tabContent = (podName, containerName, key) => {
    const { appDetail } = this.state;
    return (
      <XTerm
        key={podName + containerName}
        tenantID={appDetail.service.tenant_id}
        serviceID={appDetail.service.service_id}
        WebsocketURL={appDetail.event_websocket_url}
        updateTitle={title => this.updateTitle(key, title)}
        podName={podName}
        containerName={containerName}
        namespace={appDetail.service.namespace}
      />
    );
  };

  render() {
    const { leftWidth, tabs, appDetail, activeKey } = this.state;
    const service = appDetail && appDetail.service;
    return (
      <Row className={styles.box}>
        <Col
          className={styles.col}
          style={{ background: '#2f2a2a' }}
          span={leftWidth}
        >
          {service && this.leftRender(service)}
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
            {tabs.length > 0 && service && (
              <Tabs
                defaultActiveKey={`${tabs[tabs.length - 1].key}`}
                onChange={this.onChange}
                activeKey={activeKey}
                type="editable-card"
                onEdit={this.onEdit}
                hideAdd
              >
                {tabs.map(item => {
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
                      // eslint-disable-next-line react/no-array-index-key
                      key={key}
                    >
                      {this.tabContent(podName, containerName, key)}
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
