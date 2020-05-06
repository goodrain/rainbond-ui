import { Col, Row, Tabs, Tree } from 'antd';
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
    currentEnterprise: enterprise.currentEnterprise,
  }),
  null,
  null,
  { withRef: true }
)
export default class WebConsole extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      podLoading: true,
      pods: [],
      tabs: [],
      leftWidth: 5,
      appDetail: {},
    };
  }
  componentDidMount() {
    this.loadDetail();
    this.fetchPods();
  }
  componentWillUnmount() {}

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
    const tab = {
      podName,
      containerName,
      title: containerName,
      key: Math.random()
        .toString(36)
        .slice(-8),
    };
    this.setState({ tabs: [...this.state.tabs, tab] });
  };

  updateTitle = (key, title) => {
    const { tabs } = this.state;
    const newTabs = [];
    tabs.forEach(item => {
      if (item.key === key) {
        item.title = title;
      }
      newTabs.push(item);
    });
    this.setState({ tabs: newTabs });
  };

  fetchPods = () => {
    this.setState({ podLoading: true });
    this.props.dispatch({
      type: 'appControl/fetchPods',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: globalUtil.getComponentID(),
      },
      callback: data => {
        let pods = [];
        if (data.list && data.list.new_pods) {
          pods = data.list.new_pods;
        }
        if (data.list && data.list.old_pods) {
          pods = pods.concat(data.list.old_pods);
        }
        this.setState({ pods, podLoading: false });
      },
    });
  };

  loadDetail = () => {
    this.props.dispatch({
      type: 'appControl/fetchDetail',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: globalUtil.getComponentID(),
      },
      callback: appDetail => {
        this.setState({ appDetail });
      },
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

  closeConsole = key => {
    const { tabs } = this.state;
    const newTabs = [];
    tabs.forEach(item => {
      if (item.key !== key) {
        newTabs.push(item);
      }
    });
    this.setState({ tabs: newTabs });
  };

  leftRender() {
    const { pods } = this.state;
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
          <span className={styles.sync} onClick={this.fetchPods}>
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
        {pods && pods.length > 0 && (
          <Tree
            defaultExpandAll
            onSelect={this.onSelect}
            defaultSelectedKeys={defaultSelectedKeys}
          >
            {pods.map(pod => {
              let title = pod.pod_name;
              if (title.includes('deployment')) {
                title = title.slice(title.indexOf('-') + 1);
              }
              return (
                <TreeNode title={`实例/${title}`} key={pod.pod_name}>
                  {pod.container.map(container => {
                    return (
                      <TreeNode
                        isLeaf
                        title={`容器/${container.container_name}`}
                        key={`${pod.pod_name}.${container.container_name}`}
                      />
                    );
                  })}
                </TreeNode>
              );
            })}
          </Tree>
        )}
      </div>
    );
  }
  render() {
    const { leftWidth, tabs, appDetail } = this.state;
    return (
      <Row className={styles.box}>
        <Col className={styles.col} span={leftWidth}>
          {this.leftRender()}
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
                type="card"
              >
                {tabs.map(item => {
                  return (
                    <TabPane
                      tab={
                        <div>
                          <span className={styles.titleTab}>
                            {item.title || item.podName}
                          </span>
                          <span
                            onClick={() => this.closeConsole(item.key)}
                            className={styles.closeTab}
                          >
                            <svg
                              t="1588610556840"
                              viewBox="0 0 1024 1024"
                              version="1.1"
                              xmlns="http://www.w3.org/2000/svg"
                              p-id="6284"
                            >
                              <path
                                d="M583.168 523.776L958.464 148.48c18.944-18.944 18.944-50.176 0-69.12l-2.048-2.048c-18.944-18.944-50.176-18.944-69.12 0L512 453.12 136.704 77.312c-18.944-18.944-50.176-18.944-69.12 0l-2.048 2.048c-19.456 18.944-19.456 50.176 0 69.12l375.296 375.296L65.536 899.072c-18.944 18.944-18.944 50.176 0 69.12l2.048 2.048c18.944 18.944 50.176 18.944 69.12 0L512 594.944 887.296 970.24c18.944 18.944 50.176 18.944 69.12 0l2.048-2.048c18.944-18.944 18.944-50.176 0-69.12L583.168 523.776z"
                                fill="#ffffff"
                                p-id="6285"
                              />
                            </svg>
                          </span>
                        </div>
                      }
                      className={styles.consoleBox}
                      // eslint-disable-next-line react/no-array-index-key
                      key={item.key}
                    >
                      {appDetail && appDetail.service && (
                        <XTerm
                          tenantID={appDetail.service.tenant_id}
                          serviceID={appDetail.service.service_id}
                          WebsocketURL={appDetail.event_websocket_url}
                          updateTitle={title =>
                            this.updateTitle(item.key, title)
                          }
                          podName={item.podName}
                          containerName={item.containerName}
                        />
                      )}
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
