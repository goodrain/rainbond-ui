/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable no-script-url */
/* eslint-disable react/no-multi-comp */
/* eslint-disable eqeqeq */
/* eslint-disable no-unused-expressions */
import {
  Button,
  Form,
  Icon,
  Modal,
  notification,
  Select,
  Switch,
  Table
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import appPortUtil from '../../utils/appPort-util';
import globalUtil from '../../utils/global';
import styles from './index.less';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const { Option } = Select;
const FormItem = Form.Item;

@connect(({ region, appControl }) => {
  return {
    appDetail: appControl.appDetail,
    protocols: region.protocols || []
  };
})
class ChangeProtocol extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.protocol || 'http',
      visibleModal: false,
      agreement: '',
      NotHttpConnectInfo: []
    };
  }
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'region/fetchProtocols',
      payload: { team_name: globalUtil.getCurrTeamName(), region_name: globalUtil.getCurrRegionName() }
    });
  }
  onChange = value => {
    this.setState({ value });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  handleSubmit = () => {
    this.props.onSubmit && this.props.onSubmit(this.state.value);
  };
  render() {
    const protocols = this.props.protocols || [];
    return (
      <Form
        layout="inline"
        style={{
          position: 'relative',
          top: -8
        }}
      >
        <FormItem>
          <Select
            getPopupContainer={triggerNode => triggerNode.parentNode}
            onChange={this.onChange}
            size="small"
            value={this.state.value}
            style={{
              width: 80
            }}
          >
            {protocols.map(item => {
              return <Option value={item}>{item}</Option>;
            })}
          </Select>
        </FormItem>
        <div>
          <FormItem>
            <Button onClick={this.handleSubmit} type="primary" size="small">
              <FormattedMessage id='componentOverview.body.Ports.determine'/>
            </Button>
          </FormItem>
          <FormItem>
            <Button onClick={this.handleCancel} type="" size="small">
              <FormattedMessage id='componentOverview.body.Ports.cancel'/>
            </Button>
          </FormItem>
        </div>
      </Form>
    );
  }
}

@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      editProtocol: false,
      showDomain: false,
      list: []
    };
  }
  componentDidMount() {
    this.handleGetList();
  }
  onSubmitProtocol = protocol => {
    this.props.onSubmitProtocol &&
      this.props.onSubmitProtocol(
        protocol,
        this.props.port.container_port,
        () => {
          this.cancelEditProtocol();
        }
      );
  };
  onAddDomain = () => {
    this.props.onAddDomain && this.props.onAddDomain(this.props.port);
  };
  handleDelete = () => {
    this.props.onDelete && this.props.onDelete(this.props.port.container_port);
  };
  handleInnerChange = value => {
    if (value) {
      this.props.onOpenInner &&
        this.props.onOpenInner(this.props.port.container_port);
    } else {
      this.props.onCloseInner &&
        this.props.onCloseInner(this.props.port.container_port);
    }
  };
  handleOuterChange = value => {
    if (value) {
      this.props.onOpenOuter &&
        this.props.onOpenOuter(this.props.port.container_port);
    } else {
      this.props.onCloseOuter &&
        this.props.onCloseOuter(this.props.port.container_port);
    }
  };
  showEditProtocol = () => {
    this.setState({ editProtocol: true });
  };
  cancelEditProtocol = () => {
    this.setState({ editProtocol: false });
  };
  showSubDomain = () => {
    this.props.onSubDomain && this.props.onSubDomain(this.props.port);
  };
  showSubPort = () => {
    this.props.onSubPort && this.props.onSubPort(this.props.port);
  };
  domainsText = domains => {
    let textBl = false;
    domains.map(order => {
      if (order.domain_type == 'goodrain-sld') {
        textBl = true;
      }
    });
    return textBl;
  };
  resolveNotHttp = record => {
    const { dispatch } = this.props;
    dispatch({
      type: 'gateWay/fetchEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_name
      },
      callback: data => {
        if (data) {
          const dataList = data.list.filter(item => {
            return (
              !item.attr_name.endsWith('_HOST') &&
              !item.attr_name.endsWith('_PORT')
            );
          });
          this.setState({
            visibleModal: true,
            agreement: record,
            NotHttpConnectInfo: dataList || []
          });
        }
      }
    });
  };
  rowKey = (record, index) => index;
  handeModalCancel = () => {
    this.setState({
      visibleModal: false
    });
  };

  handleGetList = () => {
    const { appDetail, dispatch } = this.props;
    if (
      appDetail &&
      appDetail.service &&
      appDetail.service.service_alias &&
      appDetail.service.service_source &&
      appDetail.service.service_source === 'third_party' &&
      appDetail.register_way &&
      appDetail.register_way === 'static'
    ) {
      dispatch({
        type: 'appControl/getInstanceList',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: appDetail.service.service_alias
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.setState({
              list: res.list
            });
          }
        }
      });
    }
  };

  showConnectInfo = infoArr => {
    return (
      <Table
        rowKey={this.rowKey}
        className={styles.tdPadding}
        columns={[
          {
            title: formatMessage({id:'componentOverview.body.Ports.attr_name'}),
            dataIndex: 'attr_name',
            key: 'attr_name',
            align: 'center'
          },
          {
            title: formatMessage({id:'componentOverview.body.Ports.attr_value'}),
            dataIndex: 'attr_value',
            key: 'attr_value',
            align: 'center'
          },
          {
            title: formatMessage({id:'componentOverview.body.Ports.name'}),
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
  render() {
    const { port, currUser, appDetail } = this.props;
    const outerUrl = appPortUtil.getOuterUrl(port);
    const innerUrl = appPortUtil.getInnerUrl(port);
    const showAlias = appPortUtil.getShowAlias(port);
    const domains = appPortUtil.getDomains(port);
    const tcp_domains = appPortUtil.getTcpDomains(port);
    let { showDomain } = this.props;
    const DomainText = this.domainsText(domains);
    const { agreement } = this.state;
    const isHelm =
      appDetail.service && appDetail.service.component_type === 'helm';

    // 是否显示对外访问地址,创建过程中不显示
    const showOuterUrl =
      this.props.showOuterUrl === void 0 ? true : this.props.showOuterUrl;
    showDomain = showDomain === void 0 ? true : showDomain;
    // const regs = /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*$/;
    // const rega = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
    // const rege = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

    // const { list } = this.state;
    // let num = 0;
    // if (list && list.length > 0) {
    //   list.map(item => {
    //     if (
    //       !rege.test(item.address) &&
    //       (regs.test(item.address || '') || rega.test(item.address || ''))
    //     ) {
    //       num++;
    //     }
    //   });
    // }

    const { teams } = currUser;
    const teamName = globalUtil.getCurrTeamName();
    const currenTeams = teams.filter(item => {
      return item.team_name === teamName;
    });

    const region =
      currenTeams && currenTeams.length > 0 ? currenTeams[0].region : [];
    const currentRegion = region.filter(item => {
      return item.team_region_name === globalUtil.getCurrRegionName();
    });

    return (
      <table
        className={styles.table}
        style={{
          width: '100%',
          marginBottom: 8
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                width: 60
              }}
            >
              
              <FormattedMessage id='componentOverview.body.Ports.port_number'/>

            </th>
            <th
              style={{
                width: 100
              }}
            >
              
              <FormattedMessage id='componentOverview.body.Ports.port_protocol'/>

            </th>
            <th
              style={{
                width: '50%'
              }}
            >
              
              <FormattedMessage id='componentOverview.body.Ports.service_information'/>

            </th>
            {showDomain && (
              <th
                style={{
                  width: '30%'
                }}
              >
                
              <FormattedMessage id='componentOverview.body.Ports.access_policy'/>

              </th>
            )}
            <th
              style={{
                width: 100
              }}
            >
              
              <FormattedMessage id='componentOverview.body.Ports.operation'/>

            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{port.container_port}</td>
            <td>
              {this.state.editProtocol ? (
                <ChangeProtocol
                  protocol={port.protocol}
                  onSubmit={this.onSubmitProtocol}
                  onCancel={this.cancelEditProtocol}
                />
              ) : (
                <div>
                  {port.protocol}
                  <a onClick={this.showEditProtocol}>
                    <Icon type="edit" />
                  </a>
                </div>
              )}
            </td>
            <td>
              <div
                style={{
                  borderBottom: '1px solid #e8e8e8',
                  marginBottom: 8,
                  paddingBottom: 8
                }}
              >
                <p>
                  <span className={styles.label}><FormattedMessage id='componentOverview.body.Ports.internal_service'/></span>
                  <Switch
                    checked={appPortUtil.isOpenInner(port)}
                    onChange={this.handleInnerChange}
                    size="small"
                  />
                </p>
                <p>
                  <span className={styles.label}><FormattedMessage id='componentOverview.body.Ports.access_address'/></span>
                  {innerUrl || '-'}
                </p>
                <p className={styles.lr}>
                  <span className={styles.label}><FormattedMessage id='componentOverview.body.Ports.use_alias'/></span>
                  <a
                    href="javascript:;"
                    onClick={() => {
                      this.props.onEditAlias(port);
                    }}
                  >
                    {showAlias}
                  </a>
                </p>
              </div>
              <div>
                <p>
                  {/* {
                    (showOuterUrl && outerUrl) ?
                      port.protocol == 'http' ?
                        <Button size="small" style={{ float: 'right' }} onClick={this.showSubDomain}>
                          {
                            DomainText ?
                              '修改默认域名'
                              :
                              '修改默认域名'
                          }
                        </Button>
                        :
                        <Button size="small" style={{ float: 'right' }} onClick={this.showSubPort}>修改端口</Button>
                      :
                      ''
                  } */}
                  <span className={styles.label}><FormattedMessage id='componentOverview.body.Ports.external_service'/></span>
                  <Switch
                    checked={appPortUtil.isOpenOuter(port)}
                    onChange={value => {
                      this.handleOuterChange(value);
                    }}
                    size="small"
                  />
                </p>
                {/* <p className={styles.lr}>
                  <span className={styles.label}>访问地址</span>
                  {(showOuterUrl && outerUrl)
                    ? <a href={outerUrl} target={outerUrl} target="_blank">{outerUrl}</a>
                    : '-'}
                </p> */}
                {showOuterUrl && outerUrl ? (
                  <div>
                    {domains.map(domain => {
                      return (
                        <div style={{ paddingLeft: '70px' }}>
                          {domain.domain_type == 'goodrain-sld' ? (
                            <p>
                              <a
                                href={`${
                                  domain.protocol === 'http' ? 'http' : 'https'
                                }://${domain.domain_name}${
                                  domain.domain_path ? domain.domain_path : '/'
                                }`}
                                target="_blank"
                              >
                                {`${
                                  domain.protocol === 'http' ? 'http' : 'https'
                                }://${domain.domain_name}${
                                  domain.domain_path ? domain.domain_path : '/'
                                }`}
                              </a>
                              <a
                                title={<FormattedMessage id='componentOverview.body.Ports.unbound'/>}
                                onClick={() => {
                                  this.props.onDeleteDomain({
                                    port: port.container_port,
                                    domain: domain.domain_name
                                  });
                                }}
                                className={styles.removePort}
                                href="javascript:;"
                              >
                                <Icon type="close" />
                              </a>
                            </p>
                          ) : (
                            ''
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  ''
                )}
              </div>
            </td>
            {showDomain && (
              <td>
                {appPortUtil.canBindDomain(port) ? (
                  <div>
                    {domains.map(domain => {
                      return (
                        <div>
                          {domain.domain_type == 'www' ? (
                            <p>
                              <a
                                href={`${
                                  domain.protocol === 'http' ? 'http' : 'https'
                                }://${domain.domain_name}${
                                  domain.domain_path ? domain.domain_path : '/'
                                }`}
                                target="_blank"
                              >
                                {`${
                                  domain.protocol === 'http' ? 'http' : 'https'
                                }://${domain.domain_name}${
                                  domain.domain_path ? domain.domain_path : '/'
                                }`}
                              </a>
                              <a
                                title={<FormattedMessage id='componentOverview.body.Ports.unbound'/>}
                                onClick={() => {
                                  this.props.onDeleteDomain({
                                    port: port.container_port,
                                    domain: domain.domain_name
                                  });
                                }}
                                className={styles.removePort}
                                href="javascript:;"
                              >
                                <Icon type="close" />
                              </a>
                            </p>
                          ) : (
                            ''
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {outerUrl ? (
                  <div>
                    {tcp_domains.map(domain => {
                      let str = domain.end_point;
                      if (
                        str.indexOf('0.0.0.0') > -1 &&
                        currentRegion &&
                        currentRegion.length > 0
                      ) {
                        str = str.replace(
                          /0.0.0.0/g,
                          currentRegion[0].tcpdomain
                        );
                      }

                      return (
                        <div>
                          <p>
                            {domain.protocol == 'http' ||
                            domain.protocol == 'https' ? (
                              <a
                                href={`http://${str.replace(/\s+/g, '')}`}
                                target="blank"
                              >
                                {domain.end_point}
                              </a>
                            ) : (
                              <a
                                href="javascript:void(0)"
                                onClick={this.resolveNotHttp.bind(this, domain)}
                              >
                                {domain.end_point}
                              </a>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    {tcp_domains.map(domain => {
                      return (
                        <div>
                          <p>
                            <a href="javascript:void(0)" disabled>
                              {domain.end_point}
                            </a>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {port && port.protocol == 'http' && (
                  <Button
                    size="small"
                    style={{ marginTop: '5px' }}
                    onClick={this.onAddDomain}
                  >
                    <FormattedMessage id='componentOverview.body.Ports.add'/>
                  </Button>
                )}
                {port && port.protocol != 'http' && (
                  <Link
                    to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/gateway/control/tcp`}
                    style={{
                      wordBreak: 'break-all',
                      wordWrap: 'break-word',
                      color: '#1890ff'
                    }}
                  >
                    <Button size="small"><FormattedMessage id='componentOverview.body.Ports.manage'/></Button>
                  </Link>
                )}
              </td>
            )} 
            <td>
              <p>
                {!isHelm && (
                  <Button onClick={this.handleDelete} size="small">
                    <FormattedMessage id='componentOverview.body.Ports.delete'/>
                  </Button>
                )}
              </p>
            </td>
          </tr>
        </tbody>
        {this.state.visibleModal && (
          <Modal
            title={<FormattedMessage id='componentOverview.body.Ports.msg'/>}
            width="800px"
            visible={this.state.visibleModal}
            footer={null}
            onCancel={this.handeModalCancel}
          >
            <ul className={styles.ul}>
              {port && port.protocol != 'mysql' ? (
                <li style={{ fontWeight: 'bold' }}>
                  <FormattedMessage id='componentOverview.body.Ports.current' values={{protocol:port.protocol}}/>
                </li>
              ) : (
                <li style={{ fontWeight: 'bold' }}>
                  <FormattedMessage id='componentOverview.body.Ports.current_protocol' values={{protocol:agreement.protocol}}/>
                </li>
              )}
              <li>
                <FormattedMessage id='componentOverview.body.Ports.recommend'/>
                &nbsp;
                <a href="javascript:void(0)" style={{ marginRight: '10px' }}>
                  {agreement.end_point.indexOf('0.0.0.0') > -1 &&
                  currentRegion &&
                  currentRegion.length > 0
                    ? agreement.end_point.replace(
                        /0.0.0.0/g,
                        currentRegion[0].tcpdomain
                      )
                    : agreement.end_point.replace(/\s+/g, '')}
                </a>
                <CopyToClipboard
                  text={
                    agreement.end_point.indexOf('0.0.0.0') > -1 &&
                    currentRegion &&
                    currentRegion.length > 0
                      ? agreement.end_point.replace(
                          /0.0.0.0/g,
                          currentRegion[0].tcpdomain
                        )
                      : agreement.end_point.replace(/\s+/g, '')
                  }
                  onCopy={() => {
                    notification.success({ message:  formatMessage({id:'notification.success.copy'})});
                  }}
                >
                  <Button size="small" type="primary">
                    <Icon type="copy" />
                    <FormattedMessage id='componentOverview.body.Ports.copy'/>
                  </Button>
                </CopyToClipboard>
              </li>
              {this.showConnectInfo(this.state.NotHttpConnectInfo)}
            </ul>
          </Modal>
        )}
      </table>
    );
  }
}
