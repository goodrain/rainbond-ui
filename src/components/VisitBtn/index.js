/* eslint-disable react/sort-comp */
import {
  Alert,
  Button,
  Card,
  Dropdown,
  Icon,
  Menu,
  Modal,
  notification,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import globalUtil from '../../utils/global';
import { openInNewTab } from '../../utils/utils';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less';

/*
  access_type : no_port|无端口、
                http_port|http协议，可以对外访问 、
                not_http_outer|非http、
                可以对外访问的、
                not_http_inner|非http对内，如mysql,
                http_inner| http对内
*/

@connect(({ user, appControl, global }) => ({
  visitInfo: appControl.visitInfo,
  currUser: user.currentUser
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      componentTimers: this.props.timers
    };
    this.mount = false;
  }
  componentDidMount() {
    this.mount = true;
    this.fetchVisitInfo();
  }

  componentWillReceiveProps(nextProps) {
    const { timers: newTimers } = nextProps;
    const { timers } = this.props;
    if (newTimers !== timers) {
      this.setState(
        {
          componentTimers: newTimers
        },
        () => {
          if (newTimers) {
            this.fetchVisitInfo();
          } else {
            this.closeTimer();
          }
        }
      );
    }
  }
  componentWillUnmount() {
    this.closeTimer();
    this.mount = false;
    this.props.dispatch({ type: 'appControl/clearVisitInfo' });
  }

  getHttpLinks = accessInfo => {
    let res = [];
    if (accessInfo.length > 0) {
      for (let i = 0; i < accessInfo.length; i++) {
        res = res.concat(accessInfo[i].access_urls || []);
      }
    }
    return res;
  };

  showModal = () => {
    this.setState({ showModal: true });
  };
  hiddenModal = () => {
    this.setState({ showModal: false });
  };
  fetchVisitInfo = () => {
    if (!this.mount) return;
    const { app_alias: appAlias, dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchVisitInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.handleTimers(
            'timer',
            () => {
              this.fetchVisitInfo();
            },
            5000
          );
        }
      },
      handleError: err => {
        this.handleError(err);
        this.handleTimers(
          'timer',
          () => {
            this.fetchVisitInfo();
          },
          10000
        );
      }
    });
  };
  handleError = err => {
    const { componentTimers } = this.state;
    if (!componentTimers) {
      return null;
    }
    if (err && err.data && err.data.msg_show) {
      notification.warning({
        message: formatMessage({ id: 'notification.warn.error' }),
        description: err.data.msg_show
      });
    }
  };
  handleTimers = (timerName, callback, times) => {
    const { componentTimers } = this.state;
    if (!componentTimers) {
      return null;
    }
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };
  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };

  handleClickLink = item => {
    // window.open(item.key);
    openInNewTab(item.key);
  };
  handleClickLinkTcp = item => {
    openInNewTab(`http://${item}`);
  };
  renderNoHttpOuterTitle = item => (
    <div>
      <span
        style={{
          marginRight: 16
        }}
      >
        访问地址：{item.access_urls[0]}
      </span>
      <span>访问协议： {item.protocol}</span>
    </div>
  );
  renderNoPort = visitInfo => {
    const { showModal } = this.state;
    const demo = visitInfo;
    const appAlias = this.props.app_alias;
    return (
      <Fragment>
        <Tooltip
          title={formatMessage({ id: 'tooltip.visit' })}
          placement="topRight"
        >
          <Button type={this.props.btntype} onClick={this.showModal}>
            {/* 访问 */}
            <FormattedMessage id='componentOverview.header.right.visit' />
          </Button>
        </Tooltip>
        {showModal && (
          <Modal
            title="提示"
            visible
            onCancel={this.hiddenModal}
            footer={[<Button onClick={this.hiddenModal}> 关闭 </Button>]}
          >
            <div
              style={{
                textAlign: 'center',
                fontSize: 16
              }}
            >
              如需要提供访问服务, 请
              <Link
                onClick={this.hiddenModal}
                to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${appAlias}/port`}
              >
                配置端口
              </Link>
            </div>
          </Modal>
        )}
      </Fragment>
    );
  };

  showConnectInfo = infoArr => {
    return (
      <Table
        rowKey={(record,index) => index}
        className={styles.tdPadding}
        bordered
        columns={[
          {
            title: '变量名',
            dataIndex: 'attr_name',
            key: 'attr_name',
            align: 'center'
          },
          {
            title: '变量值',
            dataIndex: 'attr_value',
            key: 'attr_value',
            align: 'center'
          },
          {
            title: '说明',
            dataIndex: 'name',
            key: 'name',
            align: 'center'
          }
        ]}
        pagination={false}
        dataSource={infoArr}
        bordered={false}
      />
    );
  };
  renderHttpPort = visitInfo => {
    const { showModal } = this.state;
    const demo = visitInfo;
    const appAlias = this.props.app_alias;
    const links = this.getHttpLinks(demo.access_info || {});
    if (links.length === 1) {
      return (
        <Tooltip title={formatMessage({ id: 'tooltip.visit' })}>
          <Button
            type={this.props.btntype}
            onClick={() => {
              // window.open(links[0]);
              openInNewTab(links[0]);
            }}
          >
            {/* 访问 */}
            <FormattedMessage id='componentOverview.header.right.visit' />
          </Button>
        </Tooltip>
      );
    } else if (links.length === 0) {
      return (
        <Fragment>
          <Tooltip
            title={formatMessage({ id: 'tooltip.visit' })}
            placement="topRight"
          >
            <Button type={this.props.btntype} onClick={this.showModal}>
              {/* 访问 */}
              <FormattedMessage id='componentOverview.header.right.visit' />
            </Button>
          </Tooltip>
          {showModal && (
            <Modal
              title="提示"
              visible
              onCancel={this.hiddenModal}
              footer={[<Button onClick={this.hiddenModal}> 关闭 </Button>]}
            >
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 16
                }}
              >
                http协议端口需打开外部访问服务, 去
                <Link
                  onClick={this.hiddenModal}
                  to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${appAlias}/port`}
                >
                  打开
                </Link>
              </div>
            </Modal>
          )}
        </Fragment>
      );
    }
    return (
      <Tooltip
        title={formatMessage({ id: 'tooltip.visit' })}
        placement="topRight"
      >
        <Dropdown
          overlay={
            <Menu onClick={this.handleClickLink}>
              {links.map(item => (
                <Menu.Item key={item}>{item}</Menu.Item>
              ))}
              {/* <Menu.Item key={1}>{11}</Menu.Item> */}
            </Menu>
          }
          placement="bottomRight"
        >
          <Button type={this.props.btntype}>
            <a href={links[0]} target="_blank">
              <FormattedMessage id='componentOverview.header.right.visit' />
              {/* 访问 */}
            </a>
          </Button>
        </Dropdown>
      </Tooltip>
    );

    return (
      <Fragment>
        <Tooltip
          title={formatMessage({ id: 'tooltip.visit' })}
          placement="topRight"
        >
          <Button type={this.props.btntype} onClick={this.showModal}>
            <FormattedMessage id='componentOverview.header.right.visit' />
            {/* 访问 */}
          </Button>
        </Tooltip>
        {showModal && (
          <Modal
            title="提示"
            visible
            onCancel={this.hiddenModal}
            footer={[<Button onClick={this.hiddenModal}> 关闭 </Button>]}
          >
            <div
              style={{
                textAlign: 'center',
                fontSize: 16
              }}
            >
              需要配置端口信息, 去
              <Link
                onClick={this.hiddenModal}
                to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${appAlias}/port`}
              >
                配置
              </Link>
            </div>
          </Modal>
        )}
      </Fragment>
    );
  };
  renderNofHttpOuter = visitInfo => {
    const { showModal } = this.state;
    const demo = visitInfo;
    const appAlias = this.props.app_alias;
    const links = this.getHttpLinks(demo.access_info || {});
    const res = demo.access_info || [];
    const btn = <Button onClick={this.hiddenModal}>关闭</Button>;
    const btns = [btn];
    const { region } = this.props.currUser.teams[0];
    const currentRegion = region.filter(item => {
      return item.team_region_name == globalUtil.getCurrRegionName();
    });
    if (links.length === 1 && res[0].protocol == 'tcp') {
      return (
        <Tooltip title={formatMessage({ id: 'tooltip.visit' })}>
          <Button
            type={this.props.btntype}
            onClick={() => {
              this.handleClickLinkTcp(links[0])
            }}
          >
            {/* 访问 */}
            <FormattedMessage id='componentOverview.header.right.visit' />
          </Button>
        </Tooltip>
      );
    } else if (links.length === 0) {
      return (
        <Fragment>
          <Tooltip
            title={formatMessage({ id: 'tooltip.visit' })}
            placement="topRight"
          >
            <Button type={this.props.btntype} onClick={this.showModal}>
              {/* 访问 */}
              <FormattedMessage id='componentOverview.header.right.visit' />
            </Button>
          </Tooltip>
          {showModal && (
            <Modal
              title="提示"
              visible
              onCancel={this.hiddenModal}
              footer={[<Button onClick={this.hiddenModal}> 关闭 </Button>]}
            >
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 16
                }}
              >
                http协议端口需打开外部访问服务, 去
                <Link
                  onClick={this.hiddenModal}
                  to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${appAlias}/port`}
                >
                  打开
                </Link>
              </div>
            </Modal>
          )}
        </Fragment>
      );
    }
    return (
      <Tooltip
        title={formatMessage({ id: 'tooltip.visit' })}
        placement="topRight"
      >
        <Dropdown
          overlay={
            <Menu>
              {links.map(item => (
                <Menu.Item onClick={()=>this.handleClickLinkTcp(item)} key={item}>{item}</Menu.Item>
              ))}
            </Menu>
          }
          placement="bottomRight"
        >
          <Button type={this.props.btntype}>
            <a onClick={()=>this.handleClickLinkTcp(links[0])} target="_blank">
              <FormattedMessage id='componentOverview.header.right.visit' />
              {/* 访问 */}
            </a>
          </Button>
        </Dropdown>
      </Tooltip>
    );

    return (
      <Fragment>
        <Tooltip
          title={formatMessage({ id: 'tooltip.visit' })}
          placement="topRight"
        >
          <Button type={this.props.btntype} onClick={this.showModal}>
            <FormattedMessage id='componentOverview.header.right.visit' />
            {/* 访问 */}
          </Button>
        </Tooltip>
        {showModal && (
          <Modal
            title="提示"
            visible
            onCancel={this.hiddenModal}
            footer={[<Button onClick={this.hiddenModal}> 关闭 </Button>]}
          >
            <div
              style={{
                textAlign: 'center',
                fontSize: 16
              }}
            >
              需要配置端口信息, 去
              <Link
                onClick={this.hiddenModal}
                to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${appAlias}/port`}
              >
                配置
              </Link>
            </div>
          </Modal>
        )}
      </Fragment>
    );

  };
  renderNotHttpInner = visitInfo => {
    const { showModal } = this.state;
    const demo = visitInfo;
    const appAlias = this.props.app_alias;
    const res = demo.access_info || [];
    const btn = <Button onClick={this.hiddenModal}>关闭</Button>;
    const btns = [btn];

    function renderTitle(item) {
      return (
        <div>
          <span>访问协议：{item.protocol}</span>
        </div>
      );
    }

    function renderCard(item, i) {
      const connect_info = item.connect_info || [];
      return (
        <Card
          type="inner"
          style={{
            marginBottom: 24
          }}
          title={renderTitle(item)}
        >
          {!item.connect_info.length ? (
            '-'
          ) : (
            <Fragment>
              <table
                style={{
                  width: '100%'
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        width: '33%'
                      }}
                    >
                      变量名
                    </th>
                    <th
                      style={{
                        width: '33%'
                      }}
                    >
                      变量值
                    </th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  {connect_info.map(item => (
                    <tr>
                      <td width="150">{item.attr_name}</td>
                      <td>{item.attr_value}</td>
                      <td>{item.name}</td>
                    </tr>
                  ))}
                  {!connect_info.length ? (
                    <tr>
                      <td
                        colSpan="3"
                        style={{
                          textAlign: 'center'
                        }}
                      >
                        暂无数据
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </Fragment>
          )}
        </Card>
      );
    }

    return (
      <Fragment>
        <Tooltip
          title={formatMessage({ id: 'tooltip.visit' })}
          placement="topRight"
        >
          <Button type={this.props.btntype} onClick={this.showModal}>
            <FormattedMessage id='componentOverview.header.right.visit' />
            {/* 访问 */}
          </Button>
        </Tooltip>
        {showModal && (
          <Modal
            title="访问信息"
            width="800px"
            visible
            onCancel={this.hiddenModal}
            footer={btns}
          >
            <Alert
              style={{
                marginBottom: 16
              }}
              message="其他组件依赖此组件后来访问"
              type="info"
            />{' '}
            {res.map((item, i) => renderCard(item, i))}
          </Modal>
        )}
      </Fragment>
    );
  };
  render() {
    const { visitInfo } = this.props;
    if (!visitInfo) {
      return null;
    }
    if (visitInfo.access_type == 'no_port') {
      return this.renderNoPort(visitInfo);
    }

    if (visitInfo.access_type === 'http_port') {
      return this.renderHttpPort(visitInfo);
    }

    if (visitInfo.access_type === 'not_http_outer') {
      return this.renderNofHttpOuter(visitInfo);
    }
    if (
      visitInfo.access_type === 'not_http_inner' ||
      visitInfo.access_type === 'http_inner'
    ) {
      return this.renderNotHttpInner(visitInfo);
    }
    return null;
  }
}
