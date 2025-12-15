/* eslint-disable react/sort-comp */
/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
import {
  Button,
  Card,
  Checkbox,
  Col,
  Icon,
  Modal,
  notification,
  Progress,
  Radio,
  Row,
  Select,
  Upload
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import cookie from '../../utils/cookie';
import userUtil from '../../utils/user';
import globalUtil from '../../utils/global';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import styles from './index.less';

const { confirm } = Modal;

@connect(({ user, global, enterprise }) => ({
  user: user.currentUser,
  currentEnterprise: enterprise.currentEnterprise,
  rainbondInfo: global.rainbondInfo
}))

export default class EnterpriseShared extends PureComponent {
  constructor(props) {
    super(props);
    const {
      user,
      match: {
        params: {
          teamName,
        }
      },
    } = this.props;
    const enterpriseAdmin = userUtil.isCompanyAdmin(user);
    this.state = {
      enterpriseAdmin,
      fileList: [],
      existFileList: [],
      record: {},
      event_id: '',
      file_list: [],
      import_file_status: [],
      userTeamList: [],
      scopeValue: enterpriseAdmin ? 'enterprise' : 'team',
      tenant_name: teamName ? teamName : '',
      percents: false,
      region_name: '',
      archOptions: '',
      language: cookie.get('language') === 'zh-CN' ? true : false,

    };
  }
  componentDidMount() {
    this.loop = true;
    this.queryImportRecord();
    this.getUserTeams();
  }
  componentWillUnmount() {
    this.loop = false;
    this.statusloop = false;
  }
  onChange = (selectedOptions) => {
    this.setState({
      archOptions: selectedOptions.target.value
    })
  }
  cancelImport = () => {
    const {
      dispatch,
      match: {
        params: {
          eid,
          teamName,
          regionName,
        }
      },
      currentEnterprise
    } = this.props;
    dispatch({
      type: 'market/cancelImportApp',
      payload: {
        enterprise_id: eid || currentEnterprise.enterprise_id,
        event_id: this.state.event_id
      },
      callback: data => {
        if (data) {
          notification.success({ message: formatMessage({ id: 'notification.success.cancel_successfully' }) });
          if (teamName) {
            dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/create/market`));
          } else {
            dispatch(routerRedux.push(`/enterprise/${eid}/shared/local`));
          }
        }
      }
    });
  };
  complete = () => {
    if (this.props.onOK) {
      this.props.onOK();
    }
  };
  onChangeUpload = info => {
    let { fileList } = info;
    fileList = fileList.filter(file => {
      if (file.response) {
        return file.response.msg === 'success';
      }
      return true;
    });

    if (info && info.event && info.event.percent) {
      this.setState({
        percents: info.event.percent
      });
    }

    const { status } = info.file;
    if (status === 'done') {
      this.setState({
        percents: false
      });
    }

    this.setState({ fileList });
  };
  onRemove = () => {
    this.setState({ fileList: [] });
  };
  onFileChange = e => {
    this.setState({ file_list: e });
  };
  openQueryImportStatus = () => {
    this.statusloop = true;
    this.queryImportStatus();
  };
  handleSubmit = () => {
    const {
      match: {
        params: { 
          eid,
          teamName
        }
      },
      currentEnterprise
    } = this.props;
    const { scopeValue, tenant_name, event_id, file_list } = this.state;
    if (file_list.length === 0) {
      notification.destroy();
      notification.warning({
        message: formatMessage({ id: 'notification.warn.choose_one' })
      });
      return;
    }
    if (tenant_name === '' && scopeValue !== 'enterprise') {
      notification.destroy();
      notification.warning({
        message: formatMessage({ id: 'popover.enterpriseOverview.joinTeam.placeholder' })
      });
      return;
    }

    let fileStr = '';
    file_list.map(app => {
      fileStr += `${app},`;
      return app;
    });
    fileStr = fileStr.slice(0, fileStr.length - 1);
    this.props.dispatch({
      type: 'market/importApp',
      payload: {
        scope: teamName ? 'team' : scopeValue,
        tenant_name,
        enterprise_id: eid || currentEnterprise.enterprise_id,
        event_id,
        file_name: fileStr
      },
      callback: data => {
        if (data) {
          notification.success({
            message: formatMessage({ id: 'notification.success.starting_imported' })
          });
          this.loop = false;
          this.openQueryImportStatus();
        }
      }
    });
  };
  queryImportRecord = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      },
      currentEnterprise
    } = this.props;

    dispatch({
      type: 'market/queryImportRecord',
      payload: {
        enterprise_id: eid || currentEnterprise.enterprise_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (!res.bean || res.bean.region_name === '') {
            confirm({
              content: formatMessage({ id: 'applicationMarket.Offline.not' })
            });
          }
          this.setState(
            {
              record: res.bean,
              event_id: res.bean.event_id,
              region_name: res.bean && res.bean.region_name
            },
            () => {
              if (res.bean.region_name !== '') {
                this.openQueryImportStatus();
                this.handleQueryImportDir();
              }
            }
          );
        }
      }
    });
  };
  queryImportStatus = () => {
    const {
      dispatch,
      match: {
        params: {
          eid,
          teamName,
          regionName
        }
      },
      currentEnterprise
    } = this.props;
    dispatch({
      type: 'market/queryImportApp',
      payload: {
        enterprise_id: eid || currentEnterprise.enterprise_id,
        event_id: this.state.event_id,
        arch: this.state.archOptions
      },
      callback: data => {
        if (data && data.status_code === 200) {
          this.setState({
            import_file_status: data.list
          });
          if (data.bean && data.bean.status === 'uploading') {
            return;
          }
          if (data.bean && data.bean.status === 'partial_success') {
            notification.success({
              message: formatMessage({ id: 'notification.error.failed_import_app' })
            });
            return;
          }
          if (data.bean && data.bean.status === 'success') {
            notification.success({
              message: formatMessage({ id: 'notification.success.imports_closure' })
            });

            if (teamName) {
              dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/index?showAddModal=true&currentView=localMarketInstall`));
            } else {
              dispatch(routerRedux.push(`/enterprise/${eid}/shared/local`));
            }

            return;
          }
          if (data.bean && data.bean.status === 'failed') {
            notification.warning({
              message: formatMessage({ id: 'notification.error.failed_import' })
            });
            this.setState({
              import_file_status: []
            });
            return;
          }
          if (this.statusloop) {
            setTimeout(() => {
              this.queryImportStatus();
            }, 3000);
          }
        }
      },
      handleError: () => { }
    });
  };

  handleQueryImportDir = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      },
      currentEnterprise
    } = this.props;
    dispatch({
      type: 'market/queryImportDirApp',
      payload: {
        enterprise_id: eid || currentEnterprise.enterprise_id,
        event_id: this.state.event_id
      },
      callback: data => {
        if (data) {
          this.setState({ existFileList: data.list });
        }
        if (this.loop) {
          setTimeout(() => {
            this.handleQueryImportDir();
          }, 6000);
        }
      },
      handleError: () => { }
    });
  };

  onChangeRadio = e => {
    this.setState({
      scopeValue: e.target.value
    });
  };

  getUserTeams = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      },
      currentEnterprise
    } = this.props;
    dispatch({
      type: 'global/fetchMyTeams',
      payload: {
        enterprise_id: eid || currentEnterprise.enterprise_id,
        page: 1,
        page_size: 999
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            userTeamList: res.list
          });
        }
      }
    });
  };

  handleChangeTeam = tenant_name => {
    this.setState({
      tenant_name
    });
  };

  render() {
    const upSvg = () => (
      <svg
        t="1582646117495"
        viewBox="0 0 1026 1024"
        p-id="5405"
        width="23"
        height="23"
      >
        <path
          d="M536.149154 400.348544c56.251093 47.113428 112.500379 94.243113 168.749666 141.372797 20.850997 17.471561 22.241786 33.339199 4.763001 54.179359-17.460724 20.858222-33.353649 22.249011-54.20284 4.779257-34.630646-29.020528-69.259485-58.042862-103.906387-87.045328v448.330764c0 27.203471-11.259972 38.458025-38.477893 38.458024-27.201665 0-38.477893-11.254553-38.477894-38.458024V513.634629a541926.23157 541926.23157 0 0 0-103.906387 87.045328c-20.850997 17.469755-36.72586 16.078966-54.206452-4.779257-17.478786-20.84016-16.086191-36.707798 4.763001-54.179359 56.252899-47.129684 112.502185-94.259369 168.751472-141.372797 16.660568-13.953045 29.490145-13.953045 46.150713 0z"
          fill="#4D73B1"
          p-id="5406"
        />
        <path
          d="M923.532655 8.543418H102.61494C45.939386 8.543418 0 54.477385 0 111.113203v512.865179c0 56.632205 45.939386 102.569785 102.61494 102.569784h217.178022c27.216115 0 38.494149-11.272616 38.494149-38.476087 0-27.187215-11.276228-38.459831-38.494149-38.459831H102.61494c-18.148893 0-25.662766-7.506648-25.662766-25.63206V111.115009c0-18.125412 7.513873-25.633867 25.662766-25.633867h820.917715c18.148893 0 25.66096 7.508454 25.66096 25.633867v512.865179c0 18.125412-7.512067 25.63206-25.66096 25.63206H706.356439c-27.216115 0-38.494149 11.272616-38.494149 38.459831 0 27.205278 11.276228 38.476087 38.494149 38.476087h217.176216c56.675554 0 102.61494-45.93758 102.61494-102.569784V111.113203c0-56.635817-45.939386-102.569785-102.61494-102.569785z"
          fill="#4D73B1"
          p-id="5407"
        />
      </svg>
    );

    const myheaders = {};
    const {
      existFileList,
      percents,
      userTeamList,
      record,
      region_name,
      enterpriseAdmin,
      import_file_status,
      archOptions,
      language
    } = this.state;
    const {
      match: {
        params: {
          teamName,
        }
      } } = this.props;
    const existFiles =
      existFileList && existFileList.length > 0 && existFileList;

    const radioStyle = {
      display: 'block',
      height: '30px',
      lineHeight: '30px'
    };
    const userTeam = userTeamList && userTeamList.length > 0 && userTeamList;
    const group_id = globalUtil.getAppID()
    const isAppOverview = this.props.location?.query?.type || '';
    return (
      <PageHeaderLayout
        title={<FormattedMessage id='applicationMarket.Offline.import' />}
        content={<FormattedMessage id='applicationMarket.Offline.mode' />}
        titleSvg={pageheaderSvg.getPageHeaderSvg('import', 20)}
        extraContent={
          <Button onClick={() => {
              const { dispatch } = this.props;
              dispatch(
                  routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`)
              );
          }} type="default">
            <Icon type="rollback" />{formatMessage({ id: 'button.return' })}
          </Button>
      }
      >
        <div style={{ margin: '75px 21px 0 24px' }}>
          <div className={styles.tit}><FormattedMessage id='applicationMarket.Offline.import' /></div>
          <Card
            bodyStyle={{ padding: '25px 0 25px 29px' }}
            className={styles.mb10}
          >
            <Row className={styles.box}>
              <Col span={24} className={styles.desc}>
                <FormattedMessage id='applicationMarket.Offline.use' /><span>“{region_name}”</span><FormattedMessage id='applicationMarket.Offline.import_task' />
              </Col>
            </Row>
          </Card>

          <Card bodyStyle={{ padding: '0 0 0 27px' }} className={styles.mb10}>
            <Row className={styles.box}>
              <Col span={23} className={styles.con}>
                <FormattedMessage id='applicationMarket.Offline.upload_app' />
                {percents && (
                  <Progress
                    percent={parseInt(percents)}
                    size="small"
                    style={{ width: '98%' }}
                  />
                )}
              </Col>
              <Col span={1} className={styles.rl}>
                <Upload
                  showUploadList={false}
                  name="appTarFile"
                  accept=".zip,.tar,.gz"
                  action={record.upload_url}
                  fileList={this.state.fileList}
                  onChange={this.onChangeUpload}
                  onRemove={this.onRemove}
                  headers={myheaders}
                  disabled={region_name === '' || percents }
                >
                  <Icon component={upSvg} />
                  <div className={styles.upText}><FormattedMessage id='applicationMarket.Offline.upload' /></div>
                </Upload>
              </Col>
            </Row>
          </Card>

          {existFiles && (
            <div>
              <div className={styles.tit}><FormattedMessage id='applicationMarket.Offline.upload_list' /></div>
              <Card className={styles.mb10}>
                <Checkbox.Group
                  style={{ width: '100%' }}
                  onChange={this.onFileChange}
                >
                  <Row>
                    {existFiles.map(order => {
                      return (
                        <Col key={`col${order}`} span={24}>
                          <Checkbox key={order} value={order}>
                            {order}{' '}
                            {import_file_status.map(item => {
                              if (item.file_name === order) {
                                switch (item.status) {
                                  case 'failed':
                                    return (
                                      <Icon
                                        type="check-circle"
                                        theme="twoTone"
                                        twoToneColor="red"
                                      />
                                    );
                                  case 'success':
                                    return (
                                      <Icon
                                        type="check-circle"
                                        theme="twoTone"
                                        twoToneColor="#52c41a"
                                      />
                                    );
                                  default:
                                    return <Icon type="sync" spin />;
                                }
                              }
                            })}
                          </Checkbox>
                        </Col>
                      );
                    })}
                  </Row>
                </Checkbox.Group>
              </Card>
              <div className={styles.tit}>{formatMessage({ id: 'applicationMarket.Offline.arch' })}</div>
              <Card className={styles.mb10}>
                <Radio.Group onChange={this.onChange} value={archOptions}>
                  <Radio value={""}>{formatMessage({ id: 'applicationMarket.Offline.archpkg' })}</Radio>
                  <Radio value={"arm64"}>arm64</Radio>
                  <Radio value={"amd64"}>amd64</Radio>
                </Radio.Group>
              </Card>
              {!teamName && <>
                <div className={styles.tit}><FormattedMessage id='applicationMarket.Offline.import_Range' /></div>

                <Card className={styles.mb10}>
                  <Radio.Group
                    onChange={this.onChangeRadio}
                    value={this.state.scopeValue}
                  >
                    <Radio
                      style={radioStyle}
                      value="enterprise"
                      disabled={!enterpriseAdmin}
                    >
                      <FormattedMessage id='applicationMarket.Offline.upload_enterprise' />
                    </Radio>
                    <Radio style={radioStyle} value="team">
                      <FormattedMessage id='applicationMarket.Offline.upload_team' />
                      <Select
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                        size="small"
                        defaultValue={<FormattedMessage id='applicationMarket.Offline.select' />}
                        style={{ width: 150, marginLeft: '15px' }}
                        onChange={this.handleChangeTeam}
                      >
                        {userTeam &&
                          userTeam.map(item => {
                            const { team_id, team_alias, team_name } = item;
                            return (
                              <Option key={team_id} value={team_name}>
                                {team_alias}
                              </Option>
                            );
                          })}
                      </Select>
                    </Radio>
                  </Radio.Group>
                </Card>
              </>}

              <Row style={{ marginTop: '25px' }}>
                <Col span={24} className={styles.btn}>
                  <Button
                    onClick={() => {
                      this.cancelImport();
                    }}
                  >
                    <FormattedMessage id='applicationMarket.Offline.Abort_import' />
                  </Button>
                  {this.state.import_file_status.length === 0 && (
                    <Button
                      type="primary"
                      onClick={() => {
                        this.handleSubmit();
                      }}
                    >
                      <FormattedMessage id='applicationMarket.Offline.confirm_import' />
                    </Button>
                  )}
                </Col>
              </Row>
            </div>
          )}
        </div>
      </PageHeaderLayout>
    );
  }
}
