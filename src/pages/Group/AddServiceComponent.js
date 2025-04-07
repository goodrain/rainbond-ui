/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-shadow */
/* eslint-disable react/no-unused-state */
import { Alert, Button, Col, Drawer, Icon, Row, Spin, Tooltip } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import CodeGitRepostory from '../../components/GitRepostory';
import globalUtil from '../../utils/global';
import oauthUtil from '../../utils/oauth';
import rainbondUtil from '../../utils/rainbond';
import { languageObj } from '../../utils/utils';
import ThirdParty from './AddThirdParty'
import Custom from '../Create/code-custom';
import Check from '../Create/create-check';
import ImageCmd from '../Create/image-cmd';
import CodeDemo from '../Create/code-demo';
import HelmCmd from '../Create/helm-cmd';
import ImageName from '../Create/image-name';
import DockerDemo from '../Create/ImageName-Demo'
import VirtualMachine from '../Create/virtual-machine'
import Jwar from '../Create/upload-jarwar'
import Yaml from '../Create/upload-yaml'
import Market from '../Create/market';
import MarketDrawer from '../Create/market-drawer'
import ImgRepostory from '../../components/ImgRepostory';
import styles from './Index.less';

@connect(({ user, application, global, enterprise }) => ({
  currUser: user.currentUser,
  apps: application.apps,
  groupDetail: application.groupDetail || {},
  groups: global.groups || [],
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  currentEnterprise: enterprise.currentEnterprise,
}))
export default class AddServiceComponent extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      CustomButton: false,
      toAddService: false,
      flagThirdParty: false,
      ServiceComponentOnePage: true,
      ServiceComponentTwoPage: null,
      ServiceComponentThreePage: null,
      ServiceGetData: null,
      ButtonGroup: false,
      ButtonGroupState: true,
      handleType: null,
      moreState: true,
      BackType: null,
      errState: true,
      isDrawer: true,
      scopeProMax: '',
      event_id: '',
      serversList: null,
      vmLoading: true,
      imageList: [],
      imgRepostoryServiceID: null,
      hubType: null,
    };
  }

  componentDidMount() {
    const enterprise_id = this.props.currentEnterprise && this.props.currentEnterprise.enterprise_id
    this.fetchEnterpriseInfo(enterprise_id)
    this.getImageHub()
    this.fetchPipePipeline()
  }
  // 获取插件列表
  fetchPipePipeline = () => {
    const { dispatch, currUser } = this.props;
    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: currUser.enterprise_id,
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (res && res.list && res.list.length > 0) {
          res.list.map(item => {
            if (item.name == "rainbond-vm") {
              this.setState({
                vmShow: true,
                vmLoading: false
              })
            } else {
              this.setState({
                vmLoading: false
              })
            }
          }
          )
        } else {
          this.setState({
            vmShow: false,
            vmLoading: false
          })
        }
      },
      handleError: (res) => {
        this.setState({
          vmShow: false,
          vmLoading: false
        })
      }
    })
  }

  getGitServerName = item => {
    const { oauth_type: type, name = '' } = item;
    const typeMap = {
      github: 'Github',
      gitlab: 'Gitlab',
      gitee: 'Gitee'
    };
    const setName = typeMap[type] || '';
    const tabName = setName
      ? `${setName} ${name && `(${name})`}`
      : `${name} ${formatMessage({ id: 'appOverview.list.btn.addComponent.project' })}`;
    return tabName;
  };

  getImageWarehouse = (item) => {
    const tabName = `${item.hub_type} (${item.secret_id})`
    return tabName;
  }

  fetchEnterpriseInfo = eid => {
    if (!eid) {
      return null;
    }
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            serversList: res.bean
          })
        }
      }
    });
  };

  // 获取个人私有镜像仓库
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

  toAddService = () => {
    this.setState({ toAddService: true, isDrawer: true });
  };
  toAddThirdParty = () => {
    this.setState({ flagThirdParty: !this.state.flagThirdParty });
  };
  cancelAddService = () => {
    this.setState({ toAddService: false }, () => {
      this.setState({
        ServiceComponentTwoPage: null,
        ServiceComponentOnePage: true,
        moreState: true,
        ButtonGroup: false,
        ServiceComponentThreePage: false,
        scopeProMax: false
      });
    });
    window.sessionStorage.removeItem('codeLanguage');
    window.sessionStorage.removeItem('packageNpmOrYarn');
    window.sessionStorage.removeItem('advanced_setup');
  };

  // 组件展示
  handleServiceComponent = (
    ServiceComponentOnePage = false,
    ServiceComponentTwoPage = null,
    ServiceComponentThreePage = null,
    dataName,
    data = null
  ) => {
    // ServiceComponentOnePage 显示第一页
    // ServiceComponentTwoPage 显示第二页组件模块
    // ServiceComponentThreePage 显示第三页组件模块
    // dataName 显示数据流程
    this.setState({
      ServiceComponentOnePage,
      ServiceComponentTwoPage,
      ServiceComponentThreePage,
      [dataName]: data
    });
    if (
      ServiceComponentOnePage === false ||
      ServiceComponentTwoPage === null ||
      ServiceComponentThreePage === null
    ) {
      this.setState({ ButtonGroup: null, ButtonGroupState: true });
    }
    if (ServiceComponentTwoPage) {
      this.setState({ BackType: ServiceComponentTwoPage });
    }
    if (ServiceComponentTwoPage !== 'market') {
      this.setState({ moreState: true });
    }
  };
  setJwar = (eventId) => {
    this.setState({
      event_id: eventId
    })
  }
  setYaml = (eventId) => {
    this.setState({
      event_id: eventId
    })
  }
  // 上一步
  handleBackEvents = () => {
    const {
      ServiceComponentTwoPage,
      ServiceComponentThreePage,
      BackType
    } = this.state;
    if (ServiceComponentTwoPage) {
      this.setState({
        ServiceComponentTwoPage: null,
        ServiceComponentOnePage: true,
        ButtonGroup: null,
        ButtonGroupState: true
      });
    } else if (ServiceComponentThreePage) {
      this.setState({
        ServiceComponentThreePage: null,
        ServiceComponentTwoPage: BackType,
        ButtonGroup: null,
        ButtonGroupState: true
      });
    }
    if (ServiceComponentTwoPage === 'market') {
      this.setState({ moreState: true });
    }
  };
  // 底部按钮组
  handleServiceBotton = (ButtonGroup, ButtonGroupState, errState) => {
    this.setState({ ButtonGroup, ButtonGroupState, errState });
  };
  // 刷新
  refreshCurrent = () => {
    this.setState(
      {
        CustomButton: false,
        toAddService: false,
        ServiceComponentOnePage: true,
        ServiceComponentTwoPage: null,
        ServiceComponentThreePage: null,
        ServiceGetData: null,
        ButtonGroup: false,
        ButtonGroupState: true,
        handleType: null,
        moreState: true
      },
      () => {
        this.props.refreshCurrent();
      }
    );
  };
  getValue = (val) => {
    this.setState({
      isDrawer: val
    })
  }
  handleScopeMax = (scopeProMax = false) => {
    // eslint-disable-next-line react/no-unused-state
    this.setState({ scopeProMax });
  };
  render() {
    const { rainbondInfo, enterprise, groupId, onload, groupDetail, archInfo } = this.props;
    const {
      ButtonGroup,
      moreState,
      ServiceComponentOnePage,
      ServiceComponentTwoPage,
      ServiceComponentThreePage,
      ServiceGetData,
      ButtonGroupState,
      gitType,
      gitServiceID,
      scopeProMax,
      errState,
      toAddService,
      flagThirdParty,
      localAppTab,
      rainStoreTab,
      helmStoreTab,
      isDrawer,
      event_id,
      serversList,
      vmShow,
      vmLoading,
      imageList,
      imgRepostoryServiceID,
      hubType
    } = this.state;
    const host = rainbondInfo.document?.enable ? rainbondInfo.document.value.platform_url : 'https://www.rainbond.com'
    const showSecurityRestrictions = rainbondInfo?.security_restrictions?.enable
    const codeSvg = globalUtil.fetchSvg('codeSvg');
    const docker_svg = globalUtil.fetchSvg('docker_svg');
    const JarWar_svg = globalUtil.fetchSvg('soft');
    const yaml_svg = globalUtil.fetchSvg('yaml_svg');
    const helm_svg = globalUtil.fetchSvg('helm_svg');
    const codeDemo_svg = globalUtil.fetchSvg('codeDemo');
    const servers = oauthUtil.getEnableGitOauthServer(serversList);
    const BasisParameter = {
      handleType: 'Service',
      ButtonGroupState,
      refreshCurrent: this.refreshCurrent,
      handleServiceBotton: this.handleServiceBotton
    };
    const PublicParameter = {
      groupId,
      ...BasisParameter,
      handleServiceGetData: data => {
        this.handleServiceComponent(
          false,
          null,
          'check',
          'ServiceGetData',
          data,
        );
      }
    };

    const MarketParameter = {
      ...PublicParameter,
      scopeProMax,
      moreState
    };
    const mr8 = {
      marginRight: 8
    };
    return (
        <div style={{width:'100%',height:'100%', overflow:'auto'}}>
          {ServiceComponentOnePage && (
            <div style={{ display: 'flex', flexWrap:'wrap',width:'100%', gap:'5%'}}>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>
                    {formatMessage({ id: 'menu.team.create.code' })}
                  </p>
                </Row>
                <Row type="flex">
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'custom');
                    }}
                  >
                    {codeSvg}
                    <p className={styles.ServiceSmallTitle} style={{ margin: '5px' }}>
                      {formatMessage({ id: 'appOverview.list.btn.addComponent.custom' })}
                    </p>
                  </Col>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'jwar');
                    }}
                  >
                    {JarWar_svg}
                    <p className={styles.ServiceSmallTitle} style={{ margin: '5px' }}>
                      {formatMessage({ id: 'appOverview.list.btn.addComponent.jwar' })}
                    </p>
                  </Col>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'codeDemo');
                    }}
                  >
                    {codeDemo_svg}
                    <p className={styles.ServiceSmallTitle} style={{ margin: '5px' }}>
                      {formatMessage({ id: 'teamAdd.create.code.demo' })}
                    </p>
                  </Col>
                  {servers &&
                    servers.length > 0 &&
                    servers.map(item => {
                      const { service_id: id, oauth_type: type } = item;
                      return (
                        <Col
                          key={id}
                          span={8}
                          className={styles.ServiceDiv}
                          onClick={() => {
                            this.setState(
                              {
                                gitType: type,
                                gitServiceID: id
                              },
                              () => {
                                this.handleServiceComponent(
                                  false,
                                  'gitrepostory'
                                );
                              }
                            );
                          }}
                        >
                          {oauthUtil.getIcon(item, '40px')}
                          <p className={styles.ServiceSmallTitle}>
                            {this.getGitServerName(item)}
                          </p>
                        </Col>
                      );
                    })}
                </Row>
              </div>
              <div className={styles.ServiceBox}>
                <Row>
                  <p
                    className={styles.ServiceTitle}
                    style={{ marginBottom: '20px' }}
                  >
                    {formatMessage({ id: 'menu.team.create.market' })}
                  </p>
                </Row>
                <Row>
                  <MarketDrawer
                    archInfo={archInfo}
                    {...MarketParameter}
                    isHelm={true}
                    handleServiceComponent={scopeMax => {
                      this.handleServiceComponent(
                        false,
                        'market',
                        null,
                        'moreState',
                        false
                      );
                      this.handleScopeMax(scopeMax);
                       
                    }}
                  />
                </Row>
              </div>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>
                    {formatMessage({ id: 'menu.team.create.image' })}
                  </p>
                </Row>
                <Row style={{ marginTop: '-8px' }}>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'imageName');
                    }}
                  >
                    {docker_svg}
                    <p className={styles.ServiceSmallTitle}>
                      {formatMessage({ id: 'appOverview.list.btn.addComponent.image' })}
                    </p>
                  </Col>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'imageCmd');
                    }}
                  >
                    {docker_svg}
                    <p className={styles.ServiceSmallTitle} style={{ whiteSpace: 'nowrap' }}>
                      {formatMessage({ id: 'appOverview.list.btn.addComponent.dockerRun' })}
                    </p>
                  </Col>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'ImageNameDemo');
                    }}
                  >
                    {docker_svg}
                    <p className={styles.ServiceSmallTitle} style={{ whiteSpace: 'nowrap' }}>
                      {formatMessage({ id: 'teamAdd.create.code.demo' })}
                    </p>
                  </Col>
                  {/* {showSecurityRestrictions &&
                  <>
                  {vmLoading ? (
                    <Col
                      span={8}
                      className={styles.ServiceDiv}>
                      <Spin />
                    </Col>
                  ) : (
                    vmShow ?
                      <Col
                        span={8}
                        className={styles.ServiceDiv}
                        onClick={() => {
                          this.handleServiceComponent(false, 'VirtualMachine');
                        }}
                      >
                        {docker_svg}
                        <p className={styles.ServiceSmallTitle} style={{ whiteSpace: 'nowrap' }}>
                          {formatMessage({ id: 'Vm.createVm.VmImg' })}
                        </p>

                      </Col>
                      :
                      <Tooltip title={<><span>{formatMessage({ id: 'Vm.createVm.unInstall'})}</span><a target='_blank' href={ host + 'docs/vm-guide/vm_deploy/'}>{formatMessage({id:'Vm.createVm.doc'})}</a></>}>
                        <Col
                          span={8}
                          className={styles.ServiceDiv}
                        >
                          {docker_svg}
                          <p className={styles.ServiceSmallTitle} style={{ whiteSpace: 'nowrap' }}>
                            {formatMessage({ id: 'Vm.createVm.VmImg' })}
                          </p>
                        </Col>
                      </Tooltip>
                  )}
                  </>} */}
                  {imageList && 
                    imageList.length > 0 &&
                    imageList.map(item => {
                      const {hub_type, secret_id} = item;
                      return (
                        <Col
                          key={secret_id}
                          span={8}
                          className={styles.ServiceDiv}
                          onClick={() => {
                            this.setState(
                              {
                                hubType: hub_type,
                                imgRepostoryServiceID: secret_id
                              },
                              () => {
                                this.handleServiceComponent(
                                  false,
                                  'imgrepostory'
                                );
                              }
                            );
                          }}
                        >
                          {docker_svg}
                          <p className={styles.ServiceSmallTitle}>
                            {this.getImageWarehouse(item)}
                          </p>
                        </Col>
                      );
                    })
                  }
                </Row>
              </div>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>
                    {showSecurityRestrictions ? formatMessage({ id: 'menu.team.create.upload' }) : 'Yaml'}
                  </p>
                </Row>
                <Row>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'yaml');
                    }}
                  >
                    {yaml_svg}
                    <p className={styles.ServiceSmallTitle}>
                      {formatMessage({ id: 'appOverview.list.btn.addComponent.yaml' })}
                    </p>
                  </Col>
                  {showSecurityRestrictions && 
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'helm');
                    }}
                  >
                    {helm_svg}
                    <p className={styles.ServiceSmallTitle}>
                      {formatMessage({ id: 'teamAdd.create.upload.uploadFiles.helm' })}
                    </p>
                  </Col>}
                </Row>
              </div>
              <div className={styles.ServiceBox}>
                <ThirdParty content={this.getValue.bind(this)} groupId={groupId}  />
              </div>
            </div>
          )}
          {ServiceComponentTwoPage === 'custom' && (
            <Custom archInfo={archInfo} {...PublicParameter}  />
          )}
          {ServiceComponentTwoPage === 'gitrepostory' && (
            <CodeGitRepostory
              {...PublicParameter}
              type={gitServiceID}
              archInfo={archInfo}
              gitType={gitType}
            />
          )}
          {ServiceComponentThreePage === 'check' && ServiceGetData && (
            <Check
              {...BasisParameter}
              event_id={event_id}
              ServiceGetData={ServiceGetData}
              ErrState={errState}
              handleServiceDataState={(
                ServiceComponentOnePage,
                ServiceComponentTwoPage,
                ServiceComponentThreePage,
                data
              ) => {
                this.handleServiceComponent(
                  ServiceComponentOnePage,
                  ServiceComponentTwoPage,
                  ServiceComponentThreePage,
                  'ServiceGetData',
                  data
                );
                onload && onload();
              }}
            />
          )}
          {ServiceComponentTwoPage === 'imageName' && (
            <ImageName archInfo={archInfo} {...PublicParameter}  />
          )}
          {ServiceComponentTwoPage === 'imageCmd' && (
            <ImageCmd archInfo={archInfo} {...PublicParameter}  />
          )}
          {ServiceComponentTwoPage === 'jwar' && (
            <Jwar archInfo={archInfo} {...PublicParameter} setPare={this.setJwar}  />
          )}
          {ServiceComponentTwoPage === 'codeDemo' && (
            <CodeDemo archInfo={archInfo} {...PublicParameter}  />
          )}
          {ServiceComponentTwoPage === 'yaml' && (
            <Yaml {...PublicParameter} setPare={this.setYaml}  />
          )}
          {ServiceComponentTwoPage === 'helm' && (
            <HelmCmd {...PublicParameter} onClose={this.cancelAddService}  />
          )}
          {ServiceComponentTwoPage === 'ImageNameDemo' && (
            <DockerDemo archInfo={archInfo} {...PublicParameter} onClose={this.cancelAddService}  />
          )}
          {ServiceComponentTwoPage === 'VirtualMachine' && (
            <VirtualMachine archInfo={archInfo} {...PublicParameter} onClose={this.cancelAddService}  />
          )}
          {ServiceComponentTwoPage === 'imgrepostory' &&  
            <ImgRepostory  
              {...PublicParameter}
              type={hubType}
              archInfo={archInfo}
              imgRepostoryList={imageList}
              imgSecretId={imgRepostoryServiceID}
            />
          }
          {ServiceComponentTwoPage === 'market' && (
            <Market
              noMargin={true}
              {...MarketParameter}
              isHelm={true}
              cancelAddService={this.cancelAddService}
              isAddMarket={true}
              scopeMax={scopeProMax || 'localApplication'}
              handleServiceComponent={() => {
                this.handleServiceComponent(false, 'market', null);
              }}
              
            />
          )}
          <div
            style={{
              position: 'fixed',
              bottom: 100,
              width: '100%',
              borderTop: '1px solid #e8e8e8',
              padding: '10px 16px',
              left: 0,
              background: '#fff',
              borderRadius: '0 0 4px 4px',
              display: 'flex',
              justifyContent: 'flex-end',
              zIndex: 99999
            }}
          >
            {!ServiceComponentOnePage && ServiceComponentThreePage !== 'check' && (
              <Button style={mr8} onClick={this.handleBackEvents}>
                {formatMessage({ id: 'popover.back' })}
              </Button>
            )}
            {ButtonGroup && <span style={mr8}>{ButtonGroup}</span>}
            <Button style={mr8} onClick={this.cancelAddService}>
              {formatMessage({ id: 'popover.cancel' })}
            </Button>
          </div>
      </div>
    );
  }
}
