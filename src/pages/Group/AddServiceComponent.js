/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-shadow */
/* eslint-disable react/no-unused-state */
import { Alert, Button, Col, Drawer, Icon, Row } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import CodeGitRepostory from '../../components/GitRepostory';
import globalUtil from '../../utils/global';
import oauthUtil from '../../utils/oauth';
import rainbondUtil from '../../utils/rainbond';
import { languageObj } from '../../utils/utils';
import Custom from '../Create/code-custom';
import Check from '../Create/create-check';
import ImageCmd from '../Create/image-cmd';
import ImageName from '../Create/image-name';
import Market from '../Create/market';
import styles from './Index.less';

@connect(({ user, application, global }) => ({
  currUser: user.currentUser,
  apps: application.apps,
  groupDetail: application.groupDetail || {},
  groups: global.groups || [],
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
export default class AddServiceComponent extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      CustomButton: false,
      toAddService: false,
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
      scopeProMax: ''
    };
  }
  getGitServerName = item => {
    const { oauth_type: type, name = '' } = item;
    const map = {
      github: 'Github项目',
      gitlab: 'Gitlab项目',
      gitee: 'Gitee项目'
    };
    return map[type] || `${name}项目`;
  };

  toAddService = () => {
    this.setState({ toAddService: true });
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
      toAddService
    } = this.state;

    const codeSvg = globalUtil.fetchSvg('codeSvg');
    const dockerSvg = globalUtil.fetchSvg('dockerSvg');
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
          data
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
          style={{ marginLeft: '12px' }}
        >
          <Icon type="plus" />
          添加组件
        </Button>
        <Drawer
          title="添加组件"
          placement="right"
          onClose={this.cancelAddService}
          visible={toAddService}
          maskClosable={false}
          width={550}
        >
          {ServiceComponentOnePage && (
            <div style={{ marginTop: '-12px' }}>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>从源代码开始</p>
                </Row>
                <Row>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'custom');
                    }}
                  >
                    {codeSvg}
                    <p className={styles.ServiceSmallTitle}>自定义仓库</p>
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
                          {oauthUtil.getIcon(item, '60px')}
                          <p className={styles.ServiceSmallTitle}>
                            {this.getGitServerName(item)}
                          </p>
                        </Col>
                      );
                    })}
                </Row>
                <Row style={{ marginBottom: '2px' }}>
                  {rainbondUtil.documentPlatform_url(rainbondInfo) && (
                    <Alert
                      message={
                        <p className={styles.prompt}>
                          注:支持
                          {Object.keys(languageObj).map(key => {
                            return (
                              <a
                                key={key}
                                href={languageObj[key]}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {key}
                              </a>
                            );
                          })}
                          等语言规范
                        </p>
                      }
                      type="info"
                      style={{ height: '50px' }}
                      showIcon
                    />
                  )}
                </Row>
              </div>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>从源镜像开始</p>
                </Row>
                <Row style={{ marginTop: '-8px' }}>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'imageName');
                    }}
                  >
                    {dockerSvg}
                    <p className={styles.ServiceSmallTitle}>指定镜像</p>
                  </Col>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, 'imageCmd');
                    }}
                  >
                    {dockerSvg}
                    <p className={styles.ServiceSmallTitle}>
                      指定DockerRun命令
                    </p>
                  </Col>
                </Row>
              </div>
              <div className={styles.ServiceBox}>
                <Row>
                  <p
                    className={styles.ServiceTitle}
                    style={{ marginBottom: '20px' }}
                  >
                    从应用市场开始
                  </p>
                </Row>
                <Row>
                  <Market
                    {...MarketParameter}
                    isHelm={false}
                    scope="enterprise"
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
          {ServiceComponentTwoPage === 'market' && (
            <Market
              {...MarketParameter}
              isHelm={false}
              scopeMax="localApplication"
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
                上一步
              </Button>
            )}
            {ButtonGroup && <span style={mr8}>{ButtonGroup}</span>}
            <Button style={mr8} onClick={this.cancelAddService}>
              取消
            </Button>
          </div>
        </Drawer>
      </div>
    );
  }
}
