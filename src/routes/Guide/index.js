import React, { PureComponent } from "react";
import moment from "moment";
import { connect } from "dva";
import { routerRedux, Link } from "dva/router";
import { Card, Row, Form, Col, Select, DatePicker, notification, Modal, Radio, Steps, Button, message } from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import DescriptionList from "../../components/DescriptionList";
import styles from "./index.less";
const { Description } = DescriptionList;
const RadioGroup = Radio.Group;
import globalUtil from "../../utils/global";
import EditGroupName from "../../components/AddOrEditGroup"


const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};

@connect(({
  user, list, loading, global, index
}) => ({
  user: user.currentUser,
  list,
  groups: global.groups,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  overviewInfo: index.overviewInfo
}))
@Form.create()

export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      current: 0,
      addApplication: false,
      ServiceVisible: false,
      GuideList: null,
      ServiceList: null
    };
  }

  componentDidMount() {
    this.getGuideState()
  }
  next = () => {
    const current = this.state.current + 1;
    this.setState({ current });
  }

  prev = () => {
    const current = this.state.current - 1;
    this.setState({ current });
  }

  getGuideState = () => {
    this.props.dispatch({
      type: "global/getGuideState",
      payload: {
        enterprise_id: this.props.user.enterprise_id,
      },
      callback: (res) => {
        if (res && res._code == 200) {
          this.setState({
            GuideList: res.list,
            current:res.list&&res.list.length>0&&
                          !res.list[0].status?0:
                          !res.list[1].status?1:
                          !res.list[2].status?2:
                          !res.list[3].status?3:
                          !res.list[4].status?4:
                          !res.list[5].status?5:
                          !res.list[6].status?6:7
          })
        }
      },
    });
  }

  handleCancelApplication = () => [
    this.setState({
      addApplication: false
    })
  ]

  handleOkApplication = (vals) => {
    const { dispatch } = this.props;
    const { GuideList } = this.state
    dispatch({
      type: "groupControl/addGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_name: vals.group_name,
      },
      callback: (res) => {
        if (res) {
          notification.success({ message: "添加成功" });
          this.handleCancelApplication();
          GuideList && GuideList[3].status && this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${res.ID}`));
          GuideList && GuideList[4].status && this.handleShare(res.ID)
        }
      },
    });
  }

  handleShare = (group_id) => {
    const { dispatch } = this.props;
    dispatch({
      type: "groupControl/ShareGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id
      },
      callback: (data) => {
        if (data && data.bean.step === 1) {
          dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/share/one/${data.bean.group_id}/${data.bean.ID}`));
        }
        if (data && data.bean.step === 2) {
          dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/share/two/${data.bean.group_id}/${data.bean.ID}`));
        }
      },
    });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        console.log(err);
        return;
      }
      this.handleShare(fieldsValue.group_id)
      // GuideList&&GuideList[3].status&&this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${fieldsValue.group_id}`));
      // GuideList&&GuideList[4].status&&this.handleShare(fieldsValue.group_id)

      this.setState({ ServiceVisible: false })
    });
  };

  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };

  handleAddGroup = (vals) => {
    const { setFieldsValue } = this.props.form;

    this.props.dispatch({
      type: "groupControl/addGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals,
      },
      callback: (group) => {
        if (group) {
          // 获取群组
          this.props.dispatch({
            type: "global/fetchGroups",
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName(),
            },
            callback: () => {
              setFieldsValue({ group_id: group.ID });
              this.cancelAddGroup();
            },
          });
        }
      },
    });
  };

  handleOnchange = () => {
    const groupId = this.props.form.getFieldValue('group_id');
    const { dispatch } = this.props;
    dispatch({
      type: "groupControl/fetchApps",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        group_id: groupId,
        page: 1,
        page_size: 80
      },
      callback: data => {
        if (data && data._code == 200) {
          console.log("ServiceList", data.list)
          this.setState({
            ServiceList: data.list || [],
          });
        }
      }
    });
  };



  CreateApp = () => {
    return <div style={{ padding: "20px 0" }}>
      <p>应用是Rainbond核心抽象，由N个服务组件构成，它类似于Maven或Dotnet中的Project。在应用级抽象中用户通常关注以下功能：</p>
      <p>1. 应用拓扑图可视化，便捷观察所有服务的运行状态 <a href="https://www.rainbond.com/docs/user-manual/app-manage/app-topology/" target="_blank">[参考文档]</a></p>
      <p>2. 应用生命周期管理，涉及启停、升级和构建<a href="https://www.rainbond.com/docs/user-manual/app-manage/operation/" target="_blank">[参考文档]</a></p>
      <p>3. 应用发布到企业应用市场 <a href="https://www.rainbond.com/docs/user-manual/app-manage/share-app/" target="_blank">[参考文档]</a></p>
      <p>4. 应用整体的备份和恢复以及跨团队或数据中心迁移 <a href="https://www.rainbond.com/docs/user-manual/app-manage/app-backup/" target="_blank">[参考文档]</a></p>
      <p style={{ textAlign: "center" }}>
        <Button type="primary" onClick={() => { this.setState({ addApplication: true }) }}>去完成</Button>
      </p>
    </div>
  }

  CreateSourceCode = () => {
    return <div style={{ padding: "20px 0" }}>
      <p>基于源码创建并持续构建服务是面向开发者的最常用的功能，Rainbond支持Java/PHP/Python/NodeJS/Golang/.NetCore 等开发语言的持续构建。当前任务以Java源码为例，用户通常关注以下功能：</p>
      <p>1. Maven私服仓库如何对接到Rainbond  <a href="https://www.rainbond.com/docs/advanced-scenarios/devops/connection-maven-repository/" target="_blank">[参考文档]</a></p>
      <p>2. 基于Git代码仓库的自动化持续构建<a href="https://www.rainbond.com/docs/user-manual/app-service-manage/service-volume/#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6" target="_blank">[参考文档]</a></p>
      <p>3. 服务配置文件动态配置 <a href="" target="_blank">[参考文档]</a></p>
      <p style={{ textAlign: "center" }}>
        <Button style={{ marginRight: "10px" }}><a href="https://www.rainbond.com/video.html" target="_blank">查看视频教程</a></Button>
        <Button type="primary" onClick={
          () => {
            this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/code`));
          }
        }>去完成</Button>
      </p>
    </div>
  }



  MarketInstallation = () => {
    return <div style={{ padding: "20px 0" }}>
      <p>从应用市场安装应用是最便捷的云应用安装交付方式，目前Rainbond公有市场中提供了部分数据库类中间件和一些开源应用。完成当前任务用户会关注以下功能:</p>
      <p>1. 从公有应用市场同步应用 </p>
      <p>2. 从应用市场一键安装数据库组件</p>
      <p>3. 初始化数据库数据</p>
      <p style={{ textAlign: "center" }}>
        {/* <Button style={{ marginRight: "10px" }}>查看视频教程</Button> */}
        <Button type="primary" onClick={
          () => {
            this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/market`));
          }
        }>去完成</Button>
      </p>
    </div>
  }


  Service = () => {
    return <div style={{ padding: "20px 0" }}>
      <p>当前任务以服务连接数据库为例学习Rainbond服务之间内网通信机制，完成当前任务用户会关注以下功能：</p>
      <p>1. 服务建立依赖关系包含的通信原理（服务注册/服务发现) <a href="" target="_blank">[参考文档]</a></p>
      <p>2. 服务公用连接变量如何设置<a href="" target="_blank">[参考文档]</a></p>
      <p>3. 服务通信过程的治理机制</p>
      <p style={{ textAlign: "center" }}>
        {/* <Button style={{ marginRight: "10px" }}>查看视频教程</Button> */}
        {/* <Button type="primary" onClick={() => { this.setState({ ServiceVisible: true }) }}>去完成</Button> */}
      </p>
    </div>
  }
  ReleaseMarket = () => {
    return <div style={{ padding: "20px 0" }}>
      <p>将前置任务创建的应用分享到应用市场，从而让你的业务系统支持一键交付能力。完成当前任务用户会关注以下功能：</p>
      <p>1. 应用发布到企业应用市场  <a href="https://www.rainbond.com/docs/user-manual/app-manage/share-app/" target="_blank">[参考文档]</a></p>
      <p>2. 应用支持基于应用市场一键安装的关键因素 <a href="" target="_blank">[参考文档]</a></p>
      <p>3. SaaS化应用市场如何建立 <a href="" target="_blank">[联系商业支持]</a></p>
      <p style={{ textAlign: "center" }}>
        {/* <Button style={{ marginRight: "10px" }}>查看视频教程</Button> */}
        {/* <Button type="primary" onClick={() => { this.setState({ ServiceVisible: true }) }}>去完成</Button> */}
      </p>
    </div>
  }

  AccessStrategy = () => {
    return <div style={{ padding: "20px 0" }}>
      <p>需要被外网访问的服务需要配置网关访问策略，Rainbond网关支持HTTP/WebSocket/TCP/UDP服务访问协议。HTTP类策略根据域名等信息进行路由匹配，TCP类策略通过IP+端口进行路由匹配。完成当前任务用户会关注以下功能：</p>
      <p>1. HTTP策略配置 <a href="https://www.rainbond.com/docs/user-manual/gateway/traffic-control/#添加-http-策略" target="_blank">[参考文档]</a></p>
      <p>2. HTTPs证书管理 <a href="https://www.rainbond.com/docs/user-manual/gateway/cert-management/" target="_blank">[参考文档]</a></p>
      <p>3. TCP策略配置 <a href="https://www.rainbond.com/docs/user-manual/gateway/traffic-control/#tcp-访问策略" target="_blank">[参考文档]</a></p>
      <p style={{ textAlign: "center" }}>
        {/* <Button style={{ marginRight: "10px" }}>查看视频教程</Button> */}
        <Button type="primary" onClick={
          () => {
            this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/gateway/control/http/true`));
          }
        }>去完成</Button>
      </p>
    </div>
  }

  AnalysisPlugin = () => {
    return <div style={{ padding: "20px 0" }}>
      <p>服务插件体系是对服务治理功能的扩展方式，Rainbond默认提供了性能分析插件和网络治理插件。当前任务为前置任务安装的Java服务安装性能分析插件为例。完成当前任务用户会关注以下功能：</p>
      <p>1. 性能分析插件的安装 <a href="" target="_blank">[参考文档]</a></p>
      <p>2. 服务开通性能分析插件 <a href="" target="_blank">[参考文档]</a></p>
      <p>3. 查看性能分析结果,支持HTTP协议和Mysql协议的服务 <a href="" target="_blank">[参考文档]</a></p>
      <p style={{ textAlign: "center" }}>
        {/* <Button style={{ marginRight: "10px" }}>查看视频教程</Button> */}
      </p>
    </div>
  }



  render() {
    const Step = Steps.Step;
    const steps = [{
      title: '创建应用',
      content: this.CreateApp()
    }, {
      title: '基于源码创建服务',
      content: this.CreateSourceCode()
    }, {
      title: '基于应用市场安装数据库',
      content: this.MarketInstallation()
    }, {
      title: '服务连接数据库',
      content: this.Service()
    }, {
      title: '发布应用到应用市场',
      content: this.ReleaseMarket()
    }, {
      title: '配置应用访问策略',
      content: this.AccessStrategy()
    }, {
      title: '安装性能分析插件',
      content: this.AnalysisPlugin()
    }];

    const { current } = this.state;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    return (

      <Card
        style={{
          marginBottom: 24,
        }}
        bodyStyle={{
          paddingTop: 12,
        }}
        bordered={false}
        title="基础任务"
      >
        <Steps current={current} size="small" labelPlacement="vertical" initial={0} className={styles.stepss} >
          {steps.map(item => <Step key={item.title} title={item.title} />)}
        </Steps>


        {this.state.ServiceVisible && <Modal
          title="请选择或创建一个应用"
          visible={this.state.ServiceVisible}
          onOk={this.handleSubmit}
          onCancel={() => { this.setState({ ServiceVisible: false }) }}
        >
          <Form onSubmit={this.handleSubmit} layout="horizontal" >
            <Form.Item {...formItemLayout} label="应用名称">
              {getFieldDecorator("group_id", {
                initialValue: "",
                rules: [{ required: true, message: "请选择" }],
              })(<Select
                placeholder="请选择要所属应用"
                style={{ display: "inline-block", width: 270, marginRight: 15 }}
              // onChange={() => {
              //   this.handleOnchange();
              // }}
              >
                {(this.props.groups || []).map(group => (
                  <Option key={group.group_id} value={group.group_id}>{group.group_name}</Option>
                ))}
              </Select>)}
              {/* 
              <Form.Item {...formItemLayout} label="服务组件名称">
                {getFieldDecorator("service_cname", {
                  initialValue: "",
                  rules: [
                    { required: true, message: "请选择要所属服务组件" },
                  ],
                })(
                  // ServiceList
                // <Input placeholder="请为创建的服务组件起个名字吧" />
                <Select
                placeholder="请选择要所属应用"
                style={{ display: "inline-block", width: 270, marginRight: 15 }}
                onChange={() => {
                  this.handleOnchange();
                }}
              >
                {(this.props.groups || []).map(group => (
                  <Option key={group.group_id} value={group.group_id}>{group.group_name}</Option>
                ))}
              </Select>
                )}
              </Form.Item> */}

              {/* <Button onClick={this.onAddGroup} >新建应用</Button> */}
            </Form.Item>
          </Form>
        </Modal>
        }

        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}

        {this.state.addApplication && <EditGroupName title="添加应用" onCancel={this.handleCancelApplication} onOk={this.handleOkApplication} />}

        <div className="steps-content">{steps[current].content}</div>
        {/* <div className="steps-action">
          {
            current < steps.length - 1
            && <Button type="primary" onClick={() => this.next()}>Next</Button>
          }
          {
            current === steps.length - 1
            && <Button type="primary" onClick={() => message.success('Processing complete!')}>Done</Button>
          }
          {
            current > 0
            && (
              <Button style={{ marginLeft: 8 }} onClick={() => this.prev()}>
                Previous
            </Button>
            )
          }
        </div> */}
      </Card>
    );
  }
}
