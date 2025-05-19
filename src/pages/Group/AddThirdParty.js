import { Button, Drawer, Icon, Row, Col } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import Check from '../Create/create-check';
import Market from '../Create/market';
import globalUtil from '../../utils/global';
import OuterCustom from '../Create/outer-custom';
import styles from './Index.less'
@connect(({ user, application, global }) => ({
  currUser: user.currentUser,
  apps: application.apps,
  groupDetail: application.groupDetail || {},
  groups: global.groups || [],
  rainbondInfo: global.rainbondInfo
}))
export default class AddThirdParty extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      CustomButton: false,
      toAddService: false,
      canceThirdParty:true,
      ServiceComponentOnePage: false,
      ServiceComponentTwoPage: 'outerCustom',
      ServiceComponentThreePage: null,
      ServiceGetData: null,
      ButtonGroup: false,
      ButtonGroupState: true,
      handleType: null,
      moreState: true,
      BackType: null,
      errState: true
    };
  }
  cancelDelete = () => {
    this.setState({ toDelete: false });
  };
  toAdd = () => {
    this.setState({ toAdd: true });
  };
  cancelAdd = () => {
    this.setState({ toAdd: false });
  };

  toAddService = () => {
    this.setState({ toAddService: true });
    this.props.content(this.state.toAddService)
  };

  cancelAddService = () => {
    this.setState({ toAddService: false,canceThirdParty: !this.state.canceThirdParty }, () => {
      this.setState({
        ServiceComponentTwoPage: 'outerCustom',
        ServiceComponentOnePage: false,
        moreState: true,
        ButtonGroup: false,
        ButtonGroupState: true,
        ServiceComponentThreePage: false
      });
    });
  };

  //组件展示
  handleServiceComponent = (
    ServiceComponentOnePage,
    ServiceComponentTwoPage,
    ServiceComponentThreePage,
    dataName,
    data
  ) => {
    // ServiceComponentOnePage 显示第一页
    // ServiceComponentTwoPage 显示第二页组件模块
    // ServiceComponentThreePage 显示第三页组件模块
    // dataName 显示数据流程
    ServiceComponentOnePage = ServiceComponentOnePage || false;
    ServiceComponentTwoPage = ServiceComponentTwoPage || null;
    ServiceComponentThreePage = ServiceComponentThreePage || null;

    data = data || null;
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
    if (ServiceComponentOnePage) {
      this.setState({
        ServiceComponentTwoPage: 'outerCustom',
        ServiceComponentOnePage: false
      });
    }
    if (ServiceComponentTwoPage) {
      this.setState({ BackType: ServiceComponentTwoPage });
    }
    if (ServiceComponentTwoPage !== 'market') {
      this.setState({ moreState: true });
    }
  };

  //上一步
  handleBackEvents = () => {
    const {
      ServiceComponentTwoPage,
      ServiceComponentThreePage,
      BackType
    } = this.state;
    this.cancelAddService()
    this.props.content(this.state.toAddService)
    if (ServiceComponentThreePage) {
      this.setState({
        ServiceComponentThreePage: null,
        ServiceComponentTwoPage: BackType,
        ButtonGroup: null,
        ButtonGroupState: true
      });
    }
    if (ServiceComponentTwoPage == 'market') {
      this.setState({ moreState: true });
    }
  };
  //底部按钮组
  handleServiceBotton = (ButtonGroup, ButtonGroupState, errState) => {
    this.setState({ ButtonGroup, ButtonGroupState, errState });
  };
  //刷新
  refreshCurrent = () => {
    this.setState(
      {
        CustomButton: false,
        toAddService: false,
        ServiceComponentOnePage: true,
        ServiceComponentTwoPage: 'outerCustom',
        ServiceComponentThreePage: null,
        ServiceGetData: null,
        ButtonGroup: false,
        ButtonGroupState: true,
        handleType: null,
        moreState: true
      },
    );
  };

  render() {
    const { rainbondInfo,flagThirdParty } = this.props;
    const {
      ButtonGroup,
      moreState,
      ServiceComponentOnePage,
      ServiceComponentTwoPage,
      ServiceComponentThreePage,
      ServiceGetData,
      ButtonGroupState,
      handleType,
      canceThirdParty,
    } = this.state;
    const third_party = globalUtil.fetchSvg('third_party_svg');
    return (
      <div>
          <Row>
            <p className={styles.ServiceTitle}>{formatMessage({id:'menu.team.create.third'})}</p>
          </Row>
          <Row style={{ marginBottom: '30px' }}>
            <Col
              span={8}
              className={styles.ServiceDiv}
              onClick={this.toAddService}
            >
              {third_party}
              <p className={styles.ServiceSmallTitle}>{formatMessage({id:'teamOther.AddThirdParty.Third'})}</p>
            </Col>
          </Row>
       <Drawer
          title={formatMessage({id:'teamOther.AddThirdParty.add'})}
          placement="right"
          onClose={this.cancelAddService}
          visible={this.state.toAddService}
          toAddThirdParty={this.state.toAddService}
          maskClosable={false}
          width={550}
        >
          {ServiceComponentThreePage === 'check' && ServiceGetData && (
            <Check
              ServiceGetData={ServiceGetData}
              handleType="Service"
              ButtonGroupState={ButtonGroupState}
              refreshCurrent={() => {
                this.refreshCurrent();
              }}
              ErrState={this.state.errState}
              handleServiceBotton={( ButtonGroup,ButtonGroupState,errState) => {
                this.handleServiceBotton(
                  ButtonGroup,
                  ButtonGroupState,
                  errState
                );
              }}
              handleServiceDataState={(ServiceComponentOnePage,ServiceComponentTwoPage,ServiceComponentThreePage,data) => {
                this.handleServiceComponent(
                  ServiceComponentOnePage,
                  ServiceComponentTwoPage,
                  ServiceComponentThreePage,
                  'ServiceGetData',
                  data
                );
                this.props.onload && this.props.onload();
              }}
            />
            
          )}

          {ServiceComponentTwoPage === 'market' && (
            <Market
              groupId={this.props.groupId}
              refreshCurrent={() => {
                this.refreshCurrent();
              }}
              handleType="Service"
              moreState={moreState}
              ButtonGroupState={ButtonGroupState}
              ErrState={this.state.errState}
              handleServiceBotton={(ButtonGroup, ButtonGroupState) => {
                this.handleServiceBotton(ButtonGroup, ButtonGroupState);
              }}
              handleServiceGetData={data => {
                this.handleServiceComponent(
                  false,
                  null,
                  'check',
                  'ServiceGetData',
                  data
                );
              }}
              handleServiceComponent={() => {
                this.handleServiceComponent(false, 'market', null);
              }}
            />
          )}
          {ServiceComponentTwoPage === 'outerCustom' && (
            <OuterCustom
              groupId={this.props.groupId}
              handleType="Service"
              dynamicType={ServiceComponentTwoPage}
              ButtonGroupState={ButtonGroupState}
              ErrState={this.state.errState}
              handleServiceBotton={(ButtonGroup, ButtonGroupState) => {
                this.handleServiceBotton(ButtonGroup, ButtonGroupState);
              }}
              handleServiceGetData={data => {
                this.handleServiceComponent(
                  false,
                  null,
                  'check',
                  'ServiceGetData',
                  data
                );
              }}
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
            { ServiceComponentTwoPage === 'outerCustom' &&
              <Button
                style={{
                  marginRight: 8
                }}
                onClick={() => {
                  this.handleBackEvents(true, null);
                }}
              >
                {formatMessage({id:'button.last_step'})}
              </Button>
            }
            {ButtonGroup && (
              <span style={{ marginRight: 8 }}>{ButtonGroup}</span>
            )}
            <Button
              style={{
                marginRight: 8
              }}
              onClick={this.cancelAddService}
            >
              {formatMessage({id:'button.cancel'})}
            </Button>
          </div>
        </Drawer>
      </div>
    );
  }
}
