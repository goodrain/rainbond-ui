import React, { PureComponent } from "react";
import { connect } from "dva";
import { Link, Switch, Route, routerRedux } from "dva/router";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  Menu,
  Dropdown,
  notification,
  Modal,
  Tag,
  Select,
  Input,
  Tooltip
} from "antd";
import AddGroup from "../../components/AddOrEditGroup";
import globalUtil from "../../utils/global";

const { Option } = Select;
const formItemLayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};

@connect(
  ({ user, global, loading }) => ({
    groups: global.groups,
    createAppByCodeLoading: loading.effects['createApp/createAppByCode']
  }),
  null,
  null,
  { withRef: true },
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      addGroup: false,
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleSubmit = (e) => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
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
  fetchGroup = () => {
    this.props.dispatch({
      type: "global/fetchGroups",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
      },
    });
  };


   handleOpenDemo =()=> {
    Modal.warning({
      title: '查看Dmeo源码',
      content: <div>
         <Tag color="blue" style={{marginBottom:"5px"}}><a target="_blank" style={{color:"#1990FF"}} href="http://code.goodrain.com/demo/2048.git">2048小游戏</a></Tag>
         <Tag color="blue" style={{marginBottom:"5px"}}><a target="_blank" style={{color:"#1990FF"}} href="https://github.com/goodrain/static-demo.git">静态Web：hello world !</a></Tag>
         <Tag color="blue" style={{marginBottom:"5px"}}><a target="_blank" style={{color:"#1990FF"}} href="https://github.com/goodrain/php-demo.git">PHP：hello world !</a></Tag>
         <Tag color="blue" style={{marginBottom:"5px"}}><a target="_blank" style={{color:"#1990FF"}} href="https://github.com/goodrain/python-demo.git">Python：hello world !</a></Tag>
         <Tag color="blue" style={{marginBottom:"5px"}}><a target="_blank" style={{color:"#1990FF"}} href="https://github.com/goodrain/nodejs-demo.git">Node.js：hello world !</a></Tag>
         <Tag color="blue" style={{marginBottom:"5px"}}><a target="_blank" style={{color:"#1990FF"}} href="https://github.com/goodrain/go-demo.git">Golang：hello world !</a></Tag>
         <Tag color="blue" style={{marginBottom:"5px"}}><a target="_blank" style={{color:"#1990FF"}} href="https://github.com/goodrain/java-maven-demo.git">Java-Maven：hello world !</a></Tag>
         <Tag color="blue" style={{marginBottom:"5px"}}><a target="_blank" style={{color:"#1990FF"}} href="https://github.com/goodrain/java-jar-demo.git">Java-Jar：hello world !</a></Tag>
         <Tag color="blue" style={{marginBottom:"5px"}}><a target="_blank" style={{color:"#1990FF"}} href="https://github.com/goodrain/java-war-demo.git">Java-War：hello world !</a></Tag>
         <Tag color="blue" style={{marginBottom:"5px"}}><a target="_blank" style={{color:"#1990FF"}} href="https://github.com/goodrain/java-gradle-demo.git">Java-Gradle：hello world !</a></Tag>
         <Tag color="blue" style={{marginBottom:"5px"}}><a target="_blank" style={{color:"#1990FF"}} href="https://github.com/goodrain/dotnet-demo.git">.NetCore Demo</a></Tag>
      </div>,
    });
  }



  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { groups, createAppByCodeLoading } = this.props;
    const data = this.props.data || {};
    const HeartSvg = () => (
      <svg viewBox="64 64 896 896" class="" data-icon="share-alt" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M752 664c-28.5 0-54.8 10-75.4 26.7L469.4 540.8a160.68 160.68 0 0 0 0-57.6l207.2-149.9C697.2 350 723.5 360 752 360c66.2 0 120-53.8 120-120s-53.8-120-120-120-120 53.8-120 120c0 11.6 1.6 22.7 4.7 33.3L439.9 415.8C410.7 377.1 364.3 352 312 352c-88.4 0-160 71.6-160 160s71.6 160 160 160c52.3 0 98.7-25.1 127.9-63.8l196.8 142.5c-3.1 10.6-4.7 21.8-4.7 33.3 0 66.2 53.8 120 120 120s120-53.8 120-120-53.8-120-120-120zm0-476c28.7 0 52 23.3 52 52s-23.3 52-52 52-52-23.3-52-52 23.3-52 52-52zM312 600c-48.5 0-88-39.5-88-88s39.5-88 88-88 88 39.5 88 88-39.5 88-88 88zm440 236c-28.7 0-52-23.3-52-52s23.3-52 52-52 52 23.3 52 52-23.3 52-52 52z"></path></svg>
    );
    const HeartIcon = props => (
      <Icon component={HeartSvg} {...props} />
    );



    return (
      <Form layout="horizontal" hideRequiredMark>
        <Form.Item {...formItemLayout} label="应用">
          {getFieldDecorator("group_id", {
            initialValue: data.groupd_id,
            rules: [{ required: true, message: "请选择" }],
          })(<Select style={{ display: "inline-block", width: 292, marginRight: 15 }}>
            {(groups || []).map(group => <Option key={group.group_id} value={group.group_id}>{group.group_name}</Option>)}
          </Select>)}
          <Button onClick={this.onAddGroup}>新建应用</Button>
        </Form.Item>
        <Form.Item {...formItemLayout} label="服务组件名称">
          {getFieldDecorator("service_cname", {
            initialValue: data.service_cname || "",
            rules: [{ required: true, message: "要创建的服务组件还没有名字" }],
          })(<Input placeholder="请为创建的服务组件起个名字吧" />)}
        </Form.Item>
       
        <Form.Item {...formItemLayout} label={
          <Tooltip placement="topLeft" title="查看Demo源码">
           <span onClick={()=>{this.handleOpenDemo()}}>Demo<HeartIcon style={{ color: '#1890ff' }} /></span>
          </Tooltip>}>
          {getFieldDecorator("git_url", {
            initialValue: data.git_url || "http://code.goodrain.com/demo/2048.git",
            rules: [{ required: true, message: "请选择" }],
          })(<Select>
            <Option value="http://code.goodrain.com/demo/2048.git">2048小游戏</Option>
            <Option value="https://github.com/goodrain/static-demo.git">
              静态Web：hello world !
            </Option>
            <Option value="https://github.com/goodrain/php-demo.git">
              PHP：hello world !
            </Option>
            <Option value="https://github.com/goodrain/python-demo.git">
              Python：hello world !
            </Option>
            <Option value="https://github.com/goodrain/nodejs-demo.git">
              Node.js：hello world !
            </Option>
            <Option value="https://github.com/goodrain/go-demo.git">
              Golang：hello world !
            </Option>
            <Option value="https://github.com/goodrain/java-maven-demo.git">
              Java-Maven：hello world !
            </Option>
            <Option value="https://github.com/goodrain/java-jar-demo.git">
              Java-Jar：hello world !
            </Option>
            <Option value="https://github.com/goodrain/java-war-demo.git">
              Java-war：hello world !
            </Option>
            <Option value="https://github.com/goodrain/java-gradle-demo.git">
              Java-gradle：hello world !
            </Option>
            <Option value="https://github.com/goodrain/dotnet-demo.git">.NetCore Demo</Option>
          </Select>)}

        </Form.Item>
        <Form.Item
          wrapperCol={{
            xs: { span: 24, offset: 0 },
            sm: { span: formItemLayout.wrapperCol.span, offset: formItemLayout.labelCol.span },
          }}
          label=""
        >
          <Button onClick={this.handleSubmit} type="primary" loading={createAppByCodeLoading}>
            新建应用
          </Button>
        </Form.Item>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Form>
    );
  }
}
