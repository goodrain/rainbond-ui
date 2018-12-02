import React, { PureComponent } from "react";
import { connect } from "dva";
import {
  Row,
  Col,
  Button,
  Icon,
  Drawer
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
      handleType:null,
      BackType:null,
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
        ServiceComponentTwoPage: null, ServiceComponentOnePage: true
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
      this.setState({ ButtonGroup: null, ButtonGroupState: true })
    }
    if(ServiceComponentTwoPage){
      this.setState({BackType:ServiceComponentTwoPage})
    }
  }

  //上一步
  handleBackEvents = () => {
    const { ServiceComponentOnePage, ServiceComponentTwoPage ,ServiceComponentThreePage,BackType} = this.state;
    if (ServiceComponentTwoPage) {
      this.setState({ ServiceComponentTwoPage: null, ServiceComponentOnePage: true, ButtonGroup: null, ButtonGroupState: true })
    }else if(ServiceComponentThreePage){
      this.setState({ ServiceComponentThreePage: null,ServiceComponentTwoPage:BackType, ButtonGroup: null, ButtonGroupState: true })
    }
  }
  //底部按钮组
  handleServiceBotton = (ButtonGroup, ButtonGroupState) => {
    this.setState({ ButtonGroup, ButtonGroupState })
  }
  //刷新
  refreshCurrent=()=>{
    this.setState({
      CustomButton: false,
      toAddService: false,
      ServiceComponentOnePage: true,
      ServiceComponentTwoPage: null,
      ServiceComponentThreePage: null,
      ServiceGetData: null,
      ButtonGroup: false,
      ButtonGroupState: true,
      handleType:null,
    },()=>{
      this.props.refreshCurrent()
    })
  }

  render() {
    const { rainbondInfo } = this.props;
    const { ButtonGroup,ServiceComponentOnePage, ServiceComponentTwoPage, ServiceComponentThreePage, ServiceGetData,ButtonGroupState,handleType } = this.state;
    return (
      <div>
        < Icon type="plus-circle"
          onClick={this.toAddService}
          twoToneColor="#52c41a"
          style={{ position: "absolute", left: "28%", top: "80%", zIndex: "1000", cursor: "pointer", fontSize: 50 }}
          theme="twoTone" />
        <Drawer
          title="添加服务组件"
          placement="right"
          onClose={this.cancelAddService}
          visible={this.state.toAddService}
          maskClosable={false}
          width={600}
        >
          {ServiceComponentOnePage &&
            <div>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>从源代码开始</p>
                </Row>
                <Row>
                  <Col span={8} className={styles.ServiceDiv} onClick={() => { this.handleServiceComponent(false, "custom") }}>
                    <Icon type="diff" />
                    <p>从其他自定义仓库开始</p>
                  </Col>
                  {rainbondUtil.gitlabEnable(rainbondInfo) && <Col span={8} className={styles.ServiceDiv} onClick={() => { this.handleServiceComponent(false, "goodrain") }}>
                    <Icon type="gitlab" />
                    <p>从Gitab源代码开始</p>
                  </Col>}
                  {rainbondUtil.githubEnable(rainbondInfo) && <Col span={8} className={styles.ServiceDiv} onClick={() => { this.handleServiceComponent(false, "github") }}>
                    <Icon type="github" />
                    <p>从Gihub源代码开始</p>
                  </Col>}
                </Row>
                <Row>
                  <div className={styles.ServicePrompt}>注：支持 Java Python Php NodeJs Golang Netcore 等语言额规范</div>
                </Row>
              </div>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>从源镜像开始</p>
                </Row>
                <Row>
                  <Col span={8} className={styles.ServiceDiv} onClick={() => { this.handleServiceComponent(false, "imageName") }}>
                    <Icon type="file" />
                    <p>指定镜像名称或命令</p>
                  </Col>
                  <Col span={8} className={styles.ServiceDiv} onClick={() => { this.handleServiceComponent(false, "imageCmd") }}>
                    <Icon type="file" />
                    <p>指定DockerCompose文件</p>
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
                  ButtonGroupState={ButtonGroupState}
                  handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
                  handleServiceGetData={(data) => { this.handleServiceComponent(false, null, "check", "ServiceGetData", data) }} 
                  handleServiceComponent={() => {this.handleServiceComponent(false,"market",null)}}
                  />
                </Row>
              </div>
            </div>}
          {ServiceComponentTwoPage === "custom" && <Custom handleType="Service"
            ButtonGroupState={ButtonGroupState}
            handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
            handleServiceGetData={(data) => { this.handleServiceComponent(false, null, "check", "ServiceGetData", data) }}
          />}
          {ServiceComponentTwoPage === "goodrain" && <Goodrain 
                        handleType="Service"
                        ButtonGroupState={ButtonGroupState}
                        handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
                        ButtonGroupState={this.state.ButtonGroupState} handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }} />}
          
          {ServiceComponentTwoPage === "github" && <Github 
                        handleType="Service" 
                        ButtonGroupState={ButtonGroupState}
                        handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
                        handleServiceGetData={(data) => { this.handleServiceComponent(false, null, "check", "ServiceGetData", data) }} 
                        />}
          {ServiceComponentThreePage === "check" && ServiceGetData && <Check ServiceGetData={ServiceGetData} 
              handleType="Service" 
              ButtonGroupState={ButtonGroupState}
              refreshCurrent={()=>{this.refreshCurrent()}}
              handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
              handleServiceDataState={(ServiceComponentOnePage, ServiceComponentTwoPage,ServiceComponentThreePage, data) => { this.handleServiceComponent(ServiceComponentOnePage, ServiceComponentTwoPage, ServiceComponentThreePage,"ServiceGetData", data) }} />}
          
          {ServiceComponentTwoPage === "imageName" && <ImageName 
                        handleType="Service" 
                        ButtonGroupState={ButtonGroupState}
                        handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
                        handleServiceGetData={(data) => { this.handleServiceComponent(false, null, "check", "ServiceGetData", data) }} 
                        />}
          
          {ServiceComponentTwoPage === "imageCmd" && <ImageCmd 
                        handleType="Service" 
                        ButtonGroupState={ButtonGroupState}
                        handleServiceBotton={(ButtonGroup, ButtonGroupState) => { this.handleServiceBotton(ButtonGroup, ButtonGroupState) }}
                        handleServiceGetData={(data) => { this.handleServiceComponent(false, null, "check", "ServiceGetData", data) }} 
                        />}
          
          {ServiceComponentTwoPage === "market" && <Market handleType="Service" />

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
              display:"flex",
              justifyContent:"flex-end",
              zIndex:99999
            }}
          >
            {!ServiceComponentOnePage && <Button
              style={{
                marginRight: 8,
              }}
              onClick={() => { this.handleBackEvents(true, null) }}
            >
              上一步
            </Button>}
            {ButtonGroup&&<span style={{ marginRight: 8 }}>
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


