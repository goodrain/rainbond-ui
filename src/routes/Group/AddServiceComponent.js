import React, { PureComponent } from "react";
import { connect } from "dva";
import {
  Row,
  Col,
  Button,
  Icon,
  Drawer,
  Alert,
  Tooltip
} from "antd";
import styles from "./Index.less";
import Custom from "../Create/code-custom";
import Github from "../Create/code-github";
import Goodrain from "../Create/code-goodrain";
import Check from "../Create/create-check";
import ImageName from "../Create/image-name";
import ImageCmd from "../Create/image-cmd";
import Market from "../Create/market";
import rainbondUtil from "../../utils/rainbond";

const appStatusMap = {
  running: {
    iconUrl: "/static/www/img/appOutline/code.svg",
    className: "roundloading",
  },
  starting: {
    iconUrl: "/static/www/img/appOutline/docker.svg",
    className: "",
  },
  unKnow: {
    iconUrl: "/static/www/img/appOutline/github.svg",
    className: "",
  },
};


@connect(({ user, groupControl, global }) => ({
  currUser: user.currentUser,
  apps: groupControl.apps,
  groupDetail: groupControl.groupDetail || {},
  groups: global.groups || [],
  rainbondInfo: global.rainbondInfo
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
    };
  }
  cancelDelete = () => {
    this.setState({ toDelete: false });
  }
  toAdd = () => {
    this.setState({ toAdd: true });
  }
  cancelAdd = () => {
    this.setState({ toAdd: false });
  }

  toAddService = () => {
    this.setState({ toAddService: true });
  }

  cancelAddService = () => {
    this.setState({ toAddService: false }, () => {
      this.setState({
        ServiceComponentTwoPage: null, 
        ServiceComponentOnePage: true,
        moreState:true
      })
    });
  }

  //服务组件展示
  handleServiceComponent = (ServiceComponentOnePage, ServiceComponentTwoPage, ServiceComponentThreePage, dataName, data) => {
    // ServiceComponentOnePage 显示第一页
    // ServiceComponentTwoPage 显示第二页组件模块
    // ServiceComponentThreePage 显示第三页组件模块
    // dataName 显示数据流程
    ServiceComponentOnePage = ServiceComponentOnePage || false
    ServiceComponentTwoPage = ServiceComponentTwoPage || null
    ServiceComponentThreePage = ServiceComponentThreePage || null

    data = data || null
    this.setState({ ServiceComponentOnePage, ServiceComponentTwoPage, ServiceComponentThreePage, [dataName]: data })
    if (ServiceComponentOnePage === false || ServiceComponentTwoPage === null || ServiceComponentThreePage === null) {
      this.setState({ ButtonGroup: null, ButtonGroupState: true, })
    }
    if (ServiceComponentTwoPage) {
      this.setState({ BackType: ServiceComponentTwoPage })
    }
    if (ServiceComponentTwoPage !== "market") {
      this.setState({ moreState: true })
    }
  }

  //上一步
  handleBackEvents = () => {
    const { ServiceComponentOnePage, ServiceComponentTwoPage, ServiceComponentThreePage, BackType } = this.state;
    if (ServiceComponentTwoPage) {
      this.setState({ ServiceComponentTwoPage: null, ServiceComponentOnePage: true, ButtonGroup: null, ButtonGroupState: true })
    } else if (ServiceComponentThreePage) {
      this.setState({ ServiceComponentThreePage: null, ServiceComponentTwoPage: BackType, ButtonGroup: null, ButtonGroupState: true })
    }
    if (ServiceComponentTwoPage == "market") {
      this.setState({ moreState: true })
    }
  }
  //底部按钮组
  handleServiceBotton = (ButtonGroup, ButtonGroupState) => {
    this.setState({ ButtonGroup, ButtonGroupState })
  }
  //刷新
  refreshCurrent = () => {
    this.setState({
      CustomButton: false,
      toAddService: false,
      ServiceComponentOnePage: true,
      ServiceComponentTwoPage: null,
      ServiceComponentThreePage: null,
      ServiceGetData: null,
      ButtonGroup: false,
      ButtonGroupState: true,
      handleType: null,
      moreState:true
    }, () => {
      this.props.refreshCurrent()
    })
  }



  render() {
    const { rainbondInfo } = this.props;
    const { ButtonGroup, moreState, ServiceComponentOnePage, ServiceComponentTwoPage, ServiceComponentThreePage, ServiceGetData, ButtonGroupState, handleType } = this.state;
    const codeSvg = () => (
      <svg width="60px" height="60px" viewBox="0 0 50 50" version="1.1" >
        <path d="M31.157459,0.325985833 C30.9361049,0.1167225 30.6431362,0 30.3385417,0 L10.5952381,0 C7.30933786,0.0037202381 4.64657738,2.66648071 4.64285714,5.95238095 L4.64285714,44.047619 C4.64657738,47.3335193 7.30933786,49.9962798 10.5952381,50 L39.4140625,50 C42.6999629,49.9962798 45.3627232,47.3335193 45.3664435,44.047619 L45.3664435,14.297805 C45.3664435,13.9708892 45.2320499,13.6583892 44.9944196,13.4333148 L31.157459,0.325985833 Z M31.7145648,4.13364952 L41.109561,13.0333892 L32.905041,13.0333892 C32.2479538,13.032459 31.7150298,12.5 31.7145648,11.842913 L31.7145648,4.13364952 Z M39.4140625,47.6190476 L10.5952381,47.6190476 C8.6235119,47.6167225 7.02613464,46.0193452 7.02380952,44.047619 L7.02380952,5.95238095 C7.02613464,3.98065476 8.6235119,2.3832775 10.5952381,2.38095238 L29.3331474,2.38095238 L29.3331474,11.842913 C29.3354725,13.814174 30.9333148,15.4120164 32.904576,15.4143415 L42.9850261,15.4143415 L42.9850261,44.047619 C42.983166,46.0188802 41.3853237,47.6167225 39.4140625,47.6190476 Z" id="Shape" fill="#006DF0" fill-rule="nonzero"></path>
        <path d="M31.8708148,26.7089844 C31.5987724,26.3778832 31.1700149,26.218378 30.7477679,26.2913876 C30.3259858,26.3643974 29.9753535,26.6582962 29.8302642,27.0614769 C29.6851749,27.4646577 29.7679501,27.9143415 30.046968,28.2393974 L33.1180245,31.9001117 L30.046968,35.560826 C29.7679501,35.8858817 29.6851749,36.3360305 29.8302642,36.7392113 C29.9753535,37.1419271 30.3259858,37.436291 30.7477679,37.5088356 C31.1700149,37.5818452 31.5987724,37.42234 31.8708148,37.0912388 L35.5850074,32.6655506 C35.9561012,32.2228423 35.9561012,31.577381 35.5850074,31.1351376 L31.8708148,26.7089844 Z" id="Shape" fill="#006DF0" fill-rule="nonzero"></path>
        <path d="M16.890811,31.9001117 L19.9623326,28.2393974 C20.2413505,27.9143415 20.3241257,27.4646577 20.1790364,27.0614769 C20.0339471,26.6582962 19.6833148,26.3643974 19.2610677,26.2913876 C18.8392857,26.218378 18.4105283,26.3778832 18.1384858,26.7089844 L14.4247582,31.1351376 C14.0536644,31.577381 14.0536644,32.2228423 14.4247582,32.6655506 L18.1384858,37.0912388 C18.4105283,37.42234 18.8392857,37.5818452 19.2610677,37.5088356 C19.6833148,37.436291 20.0339471,37.1419271 20.1790364,36.7392113 C20.3241257,36.3360305 20.2413505,35.8858817 19.9623326,35.560826 L16.890811,31.9001117 Z" id="Shape" fill="#006DF0" fill-rule="nonzero"></path>
        <path d="M26.3020833,23.3468192 C25.6524368,23.2482329 25.0451079,23.6951264 24.9465215,24.3452381 L22.7087983,39.0978423 C22.609747,39.7479538 23.0571057,40.3548177 23.7072173,40.453404 C23.7667411,40.4627046 23.8267299,40.4673549 23.8871838,40.4673549 C24.4749814,40.4664249 24.9744233,40.0367374 25.062779,39.4554501 L27.3005023,24.702381 C27.3995536,24.0522693 26.952195,23.4454055 26.3020833,23.3468192 Z" id="Shape" fill="#006DF0" fill-rule="nonzero"></path>
      </svg>
    );
    const dockerSvg = () => (
      <svg viewBox="0 0 50 50" version="1.1" width="60px" height="60px">
        <path style={{ fill: "#03A9F4" }} d="M 40 20 C 40.390625 18.265625 39.90625 16.21875 37.5 14 C 33.585938 17.542969 34.703125 21.226563 36 23 C 36 23 35.835938 24 32 24 C 28.164063 24 2 24 2 24 C 2 24 0.167969 40 18 40 C 33.59375 40 37.972656 27.996094 38.828125 24.925781 C 39.183594 24.972656 39.578125 25.003906 40 25 C 42.148438 24.984375 44.929688 23.828125 46 19.515625 C 43.160156 18.53125 41.339844 18.976563 40 20 Z " />
        <path style={{ fill: "#0288D1" }} d="M 2.164063 28 C 2.898438 32.738281 5.984375 40 18 40 C 30.183594 40 35.523438 32.671875 37.683594 28 Z " />
        <path style={{ fill: "#81D4FA" }} d="M 19.8125 39.9375 C 18.890625 39.617188 14.738281 38.847656 14 33 C 9.789063 34.863281 6.0625 34.375 4.421875 34.007813 C 6.582031 37.238281 10.589844 40 18 40 C 18.621094 40 19.222656 39.976563 19.8125 39.9375 Z " />
        <path style={{ fill: "#FFFFFF" }} d="M 20 32 C 20 33.105469 19.105469 34 18 34 C 16.894531 34 16 33.105469 16 32 C 16 30.894531 16.894531 30 18 30 C 19.105469 30 20 30.894531 20 32 Z " />
        <path style={{ fill: "#37474F" }} d="M 14.914063 33.597656 C 15.136719 34.101563 14.933594 34.757813 14.402344 34.914063 C 11.101563 35.886719 8.257813 36.015625 6.105469 36.015625 C 5.464844 35.398438 4.914063 34.738281 4.449219 34.054688 C 7.035156 34.054688 11.160156 33.933594 13.59375 33.089844 C 14.117188 32.90625 14.691406 33.089844 14.914063 33.597656 Z M 2 27 C 2 27 3.875 27.125 5 26 C 6.875 27.6875 10.941406 27.089844 12 26 C 13.0625 27.6875 18.9375 27.375 20 26 C 21.25 27.4375 26.625 27.75 28 26 C 28.480469 27.460938 34.820313 27.875 36 26 C 37.0625 27.089844 41.0625 27.9375 43.3125 26 C 43.875 27.1875 46 27 46 27 L 46 28 L 2 28 M 17 32 C 17 32.550781 17.449219 33 18 33 C 18.550781 33 19 32.550781 19 32 C 19 31.449219 18.550781 31 18 31 C 17.449219 31 17 31.449219 17 32 Z " />
        <path style={{ fill: "#01579B" }} d="M 11 24 L 6 24 L 6 19 L 11 19 Z M 21 19 L 16 19 L 16 24 L 21 24 Z M 31 19 L 26 19 L 26 24 L 31 24 Z M 16 14 L 11 14 L 11 19 L 16 19 Z M 26 14 L 21 14 L 21 19 L 26 19 Z " />
        <path style={{ fill: "#0288D1" }} d="M 16 24 L 11 24 L 11 19 L 16 19 Z M 26 19 L 21 19 L 21 24 L 26 24 Z M 26 9 L 21 9 L 21 14 L 26 14 Z M 21 14 L 16 14 L 16 19 L 21 19 Z " />
      </svg>
    );
    const githubrSvg = () => (
      <svg viewBox="0 0 16 16" version="1.1" width="60px" height="60px">
        <path d="M 7.5 1 C 3.910156 1 1 3.90625 1 7.488281 C 1 10.355469 2.863281 12.789063 5.445313 13.648438 C 5.769531 13.707031 6 13.375 6 13.125 C 6 12.972656 6.003906 12.789063 6 12.25 C 4.191406 12.640625 3.625 11.375 3.625 11.375 C 3.328125 10.625 2.96875 10.410156 2.96875 10.410156 C 2.378906 10.007813 3.011719 10.019531 3.011719 10.019531 C 3.664063 10.0625 4 10.625 4 10.625 C 4.5 11.5 5.628906 11.414063 6 11.25 C 6 10.851563 6.042969 10.5625 6.152344 10.378906 C 4.109375 10.019531 2.996094 8.839844 3 7.207031 C 3.003906 6.242188 3.335938 5.492188 3.875 4.9375 C 3.640625 4.640625 3.480469 3.625 3.960938 3 C 5.167969 3 5.886719 3.871094 5.886719 3.871094 C 5.886719 3.871094 6.453125 3.625 7.496094 3.625 C 8.542969 3.625 9.105469 3.859375 9.105469 3.859375 C 9.105469 3.859375 9.828125 3 11.035156 3 C 11.515625 3.625 11.355469 4.640625 11.167969 4.917969 C 11.683594 5.460938 12 6.210938 12 7.207031 C 12 8.839844 10.890625 10.019531 8.851563 10.375 C 8.980469 10.570313 9 10.84375 9 11.25 C 9 12.117188 9 12.910156 9 13.125 C 9 13.375 9.226563 13.710938 9.558594 13.648438 C 12.140625 12.785156 14 10.355469 14 7.488281 C 14 3.90625 11.089844 1 7.5 1 Z " />
      </svg>
    );
    const gitlabSvg = () => (
      <svg viewBox="0 0 50 50" version="1.1" width="60px" height="60px">
        <path style={{ fill: "#E53935" }} d="M 24 43 L 16 20 L 32 20 Z " />
        <path style={{ fill: "#FF7043" }} d="M 24 43 L 42 20 L 32 20 Z " />
        <path style={{ fill: "#E53935" }} d="M 37 5 L 42 20 L 32 20 Z " />
        <path style={{ fill: "#FFA726" }} d="M 24 43 L 42 20 L 45 28 Z " />
        <path style={{ fill: "#FF7043" }} d="M 24 43 L 6 20 L 16 20 Z " />
        <path style={{ fill: "#E53935" }} d="M 11 5 L 6 20 L 16 20 Z " />
        <path style={{ fill: "#FFA726" }} d="M 24 43 L 6 20 L 3 28 Z " />
      </svg>
    );
    return (
      <div>
        <Button type="primary" onClick={this.toAddService} style={{ marginLeft: "12px" }}><Icon type="plus" />添加服务组件</Button>
        <Drawer
          title="添加服务组件"
          placement="right"
          onClose={this.cancelAddService}
          visible={this.state.toAddService}
          maskClosable={false}
          width={550}
        >
          {ServiceComponentOnePage &&
            <div style={{ marginTop: "-12px" }}>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>从源代码开始</p>
                </Row>
                <Row>
                  <Col span={8} className={styles.ServiceDiv} onClick={() => { this.handleServiceComponent(false, "custom") }}>
                    <Icon component={codeSvg} />
                    <p className={styles.ServiceSmallTitle} >自定义仓库</p>
                  </Col>
                  <Tooltip placement="top" title={!rainbondUtil.gitlabEnable(rainbondInfo)&&"仅企业版可用"}>
                  <Col span={8} className={styles.ServiceDiv} onClick={() => {rainbondUtil.gitlabEnable(rainbondInfo) && this.handleServiceComponent(false, "goodrain") }}>
                    <Icon component={gitlabSvg} />
                    <p className={styles.ServiceSmallTitle} style={{color:rainbondUtil.gitlabEnable(rainbondInfo)?"rgba(16, 16, 16, 1)":"rgba(0, 0, 0, 0.25)"}}>Gitab项目</p>
                  </Col>
                  </Tooltip>
                  <Tooltip placement="top" title={!rainbondUtil.gitlabEnable(rainbondInfo)&&"仅企业版可用"}>
                  <Col span={8} className={styles.ServiceDiv} onClick={() => { rainbondUtil.githubEnable(rainbondInfo)&&this.handleServiceComponent(false, "github") }}>
                    <Icon component={githubrSvg} />
                    <p className={styles.ServiceSmallTitle} style={{color:rainbondUtil.gitlabEnable(rainbondInfo)?"rgba(16, 16, 16, 1)":"rgba(0, 0, 0, 0.25)"}}>Gihub项目</p>
                  </Col>
                  </Tooltip>
                </Row>
                <Row style={{ marginBottom: "2px" }}>
                  <Alert message={
                    <p className={styles.prompt} >注:支持
                    <a href="https://www.goodrain.com/docs/stable/user-manual/app-creation/language-support/dockerfile.html" target="_blank">Dockefile</a>
                    <a href="https://www.goodrain.com/docs/stable/user-manual/app-creation/language-support/java.html" target="_blank">Java</a>
                    <a href="https://www.goodrain.com/docs/stable/user-manual/app-creation/language-support/python.html" target="_blank">Python</a>
                    <a href="https://www.goodrain.com/docs/stable/user-manual/app-creation/language-support/php.html" target="_blank">PHP</a>
                    <a href="https://www.goodrain.com/docs/stable/user-manual/app-creation/language-support/nodejs.html" target="_blank">NodeJs</a>
                    <a href="https://www.goodrain.com/docs/stable/user-manual/app-creation/language-support/golang.html" target="_blank">Golang</a>
                    <a href="https://www.goodrain.com/docs/stable/user-manual/app-creation/language-support/html.html" target="_blank">Html</a>
                    <a href="https://www.goodrain.com/docs/stable/user-manual/app-creation/language-support/netcore.html" target="_blank">Netcore</a>
                   {/* <a href="https：//www.rainbond.com/docs/stable/user-manual/language-support/ruby.html" target="_blank">Ruby</a>&nbsp; */}
                      等语言规范</p>} type="info"
                    style={{ height: "40px" }}
                    showIcon />
                </Row>
              </div>
             
             
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>从源镜像开始</p>
                </Row>
                <Row style={{ marginTop: "-8px" }}>
                  <Col span={8} className={styles.ServiceDiv} onClick={() => { this.handleServiceComponent(false, "imageName") }}>
                    <Icon component={dockerSvg} />
                    <p className={styles.ServiceSmallTitle}>指定镜像</p>
                  </Col>
                  <Col span={8} className={styles.ServiceDiv} onClick={() => { this.handleServiceComponent(false, "imageCmd") }}>
                    <Icon component={dockerSvg} />
                    <p className={styles.ServiceSmallTitle}>指定DockerRun命令</p>
                  </Col>
                </Row>
              </div>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>从应用市场开始</p>
                </Row>
                <Row>
                  <Market
                    handleType="Service"
                    refreshCurrent={() => { this.refreshCurrent() }}
                    groupId={this.props.groupId}
                    ButtonGroupState={ButtonGroupState}
                    moreState={moreState}
                    handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
                    handleServiceGetData={(data) => { this.handleServiceComponent(false, null, "check", "ServiceGetData", data) }}
                    handleServiceComponent={() => { this.handleServiceComponent(false, "market", null, "moreState", false); }}
                  />
                </Row>
              </div>
            </div>
          }
          {ServiceComponentTwoPage === "custom" && <Custom handleType="Service"
            groupId={this.props.groupId}
            ButtonGroupState={ButtonGroupState}
            handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
            handleServiceGetData={(data) => { this.handleServiceComponent(false, null, "check", "ServiceGetData", data) }}
          />}
          {ServiceComponentTwoPage === "goodrain" && <Goodrain
            groupId={this.props.groupId}
            handleType="Service"
            ButtonGroupState={ButtonGroupState}
            handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
            ButtonGroupState={this.state.ButtonGroupState} handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }} />}

          {ServiceComponentTwoPage === "github" && <Github
            groupId={this.props.groupId}
            handleType="Service"
            ButtonGroupState={ButtonGroupState}
            handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
            handleServiceGetData={(data) => { this.handleServiceComponent(false, null, "check", "ServiceGetData", data) }}
          />}
          {ServiceComponentThreePage === "check" && ServiceGetData && <Check ServiceGetData={ServiceGetData}
            handleType="Service"
            ButtonGroupState={ButtonGroupState}
            refreshCurrent={() => { this.refreshCurrent() }}
            handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
            handleServiceDataState={(ServiceComponentOnePage, ServiceComponentTwoPage, ServiceComponentThreePage, data) => { this.handleServiceComponent(ServiceComponentOnePage, ServiceComponentTwoPage, ServiceComponentThreePage, "ServiceGetData", data) }} />}

          {ServiceComponentTwoPage === "imageName" && <ImageName
            groupId={this.props.groupId}
            handleType="Service"
            ButtonGroupState={ButtonGroupState}
            handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
            handleServiceGetData={(data) => { this.handleServiceComponent(false, null, "check", "ServiceGetData", data) }}
          />}

          {ServiceComponentTwoPage === "imageCmd" && <ImageCmd
            groupId={this.props.groupId}
            handleType="Service"
            ButtonGroupState={ButtonGroupState}
            handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
            handleServiceGetData={(data) => { this.handleServiceComponent(false, null, "check", "ServiceGetData", data) }}
          />}

          {ServiceComponentTwoPage === "market" && <Market
            groupId={this.props.groupId}
            refreshCurrent={() => { this.refreshCurrent() }}
            handleType="Service"
            moreState={moreState}
            ButtonGroupState={ButtonGroupState}
            handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
            handleServiceGetData={(data) => { this.handleServiceComponent(false, null, "check", "ServiceGetData", data) }}
            handleServiceComponent={() => { this.handleServiceComponent(false, "market", null) }}
          />

          }
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
              display: "flex",
              justifyContent: "flex-end",
              zIndex: 99999
            }}
          >
            {!ServiceComponentOnePage && ServiceComponentThreePage !== "check" && <Button
              style={{
                marginRight: 8,
              }}
              onClick={() => { this.handleBackEvents(true, null) }}
            >
              上一步
            </Button>}
            {ButtonGroup && <span style={{ marginRight: 8 }}>
              {ButtonGroup}
            </span>}
            <Button
              style={{
                marginRight: 8,
              }}
              onClick={this.cancelAddService}
            >
              取消
          </Button>
          </div>
        </Drawer>

      </div>
    );
  }
}


