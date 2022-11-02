/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-shadow */
/* eslint-disable react/no-unused-state */
import { Alert, Button, Col, Drawer, Icon, Row } from 'antd';
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
import HelmCmd from '../Create/helm-cmd';
import ImageName from '../Create/image-name';
import Jwar from '../Create/upload-jarwar'
import Yaml from '../Create/upload-yaml'
import Market from '../Create/market';
import MarketDrawer from '../Create/market-drawer'
import styles from './Index.less';

@connect(({ user, application, global , enterprise}) => ({
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
      isDrawer:true,
      scopeProMax: '',
      event_id:''
    };
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
      : `${name} ${formatMessage({id:'appOverview.list.btn.addComponent.project'})}`;
    return tabName;
  };

  toAddService = () => {
    this.setState({ toAddService: true, isDrawer:true });
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
  getValue = (val)=>{
    this.setState({
      isDrawer:val
    })
  }
  handleScopeMax = (scopeProMax = false) => {
    // eslint-disable-next-line react/no-unused-state
    this.setState({ scopeProMax });
  };
  render() {
    const { rainbondInfo, enterprise, groupId, onload } = this.props;
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
      event_id
    } = this.state;
    const codeSvg = globalUtil.fetchSvg('codeSvg');
    const docker_svg = globalUtil.fetchSvg('docker_svg');
    const JarWar_svg = globalUtil.fetchSvg('JarWar_svg');
    const yaml_svg = globalUtil.fetchSvg('yaml_svg');
    const helm_svg = globalUtil.fetchSvg('helm_svg');

    const servers = oauthUtil.getEnableGitOauthServer(enterprise);
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
      <div>
        <Button
          type="primary"
          onClick={this.toAddService}
          style={{ 
            marginLeft: '12px', 
            color:'#595959',
            borderColor: '#D9D9D9',
            background:'#fff'
          }}
        >
          <Icon type="plus" />
          {formatMessage({id:'appOverview.btn.addComponent'})}
        </Button>
        <Drawer
          title={formatMessage({id:'appOverview.btn.addComponent'})}
          placement="right"
          onClose={this.cancelAddService}
          visible={toAddService}
          maskClosable={false}
          width={550}
          style={{display:isDrawer ? 'block' : 'none'}}
        >
          {ServiceComponentOnePage && (
            <div style={{ marginTop: '-12px' }}>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>
                    {formatMessage({id:'menu.team.create.code'})}
                  </p>
                </Row>
                <Row type="flex">
                  <Col
                    span={4}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'custom');
                    }}
                  >
                    {codeSvg}
                    <p className={styles.ServiceSmallTitle} style={{margin:'5px'}}>
                    {formatMessage({id:'appOverview.list.btn.addComponent.custom'})}
                    </p>
                  </Col>
                  <Col
                    span={4}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'jwar');
                    }}
                  >
                    {JarWar_svg}
                    <p className={styles.ServiceSmallTitle} style={{margin:'5px'}}>
                    {formatMessage({id:'appOverview.list.btn.addComponent.jwar'})}
                    </p>
                  </Col>
                  {servers &&
                    servers.length > 0 &&
                    servers.map(item => {
                      const { service_id: id, oauth_type: type } = item;
                      return (
                        <Col
                          key={id}
                          span={4}
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
                   {formatMessage({id:'menu.team.create.market'})}
                  </p>
                </Row>
                <Row>
                  <MarketDrawer
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
                  {formatMessage({id:'menu.team.create.image'})}
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
                    {formatMessage({id:'appOverview.list.btn.addComponent.image'})}
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
                    <p className={styles.ServiceSmallTitle} style={{whiteSpace:'nowrap'}}>
                    {formatMessage({id:'appOverview.list.btn.addComponent.dockerRun'})}
                    </p>
                  </Col>
                </Row>
              </div>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>
                  {formatMessage({id:'menu.team.create.upload'})}
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
                      {formatMessage({id:'appOverview.list.btn.addComponent.yaml'})}
                    </p>
                  </Col>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'helm');
                    }}
                  >
                    {helm_svg}
                    <p className={styles.ServiceSmallTitle}>
                      {formatMessage({id:'teamAdd.create.upload.uploadFiles.helm'})}
                    </p>
                  </Col>
                </Row>
              </div>
              <div className={styles.ServiceBox} style={{marginBottom:'60px'}}>
                <ThirdParty content={this.getValue.bind(this)} groupId={groupId} />
              </div>
            </div>
          )}
          {ServiceComponentTwoPage === 'custom' && (
            <Custom {...PublicParameter} />
          )}
          {ServiceComponentTwoPage === 'gitrepostory' && (
            <CodeGitRepostory
              {...PublicParameter}
              type={gitServiceID}
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
            <ImageName {...PublicParameter} />
          )}
          {ServiceComponentTwoPage === 'imageCmd' && (
            <ImageCmd {...PublicParameter} />
          )}
          {ServiceComponentTwoPage === 'jwar' && (
            <Jwar {...PublicParameter} setPare={this.setJwar} />
          )}
          {ServiceComponentTwoPage === 'yaml' && (
            <Yaml {...PublicParameter} setPare={this.setYaml} />
          )}
          {ServiceComponentTwoPage === 'helm' && (
            <HelmCmd {...PublicParameter} />
          )}
          {ServiceComponentTwoPage === 'market' && (
            <Market
              {...MarketParameter}
              isHelm={true}
              isAddMarket={true}
              scopeMax={scopeProMax || 'localApplication'}
              handleServiceComponent={() => {
                this.handleServiceComponent(false, 'market', null);
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
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
                {formatMessage({id:'popover.back'})}
              </Button>
            )}
            {ButtonGroup && <span style={mr8}>{ButtonGroup}</span>}
            <Button style={mr8} onClick={this.cancelAddService}>
              {formatMessage({id:'popover.cancel'})}
            </Button>
          </div>
        </Drawer>
      </div>
    );
  }
}
