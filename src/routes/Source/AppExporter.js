import React, { PureComponent } from 'react';
import {
  Modal,
  Alert,
  Button,
  notification,
} from 'antd';

import globalUtil from '../../utils/global';
import {connect} from 'dva';
import { Spin, Icon } from 'antd';
import DescriptionList from "../../components/DescriptionList"

const { Description } = DescriptionList;
const antIcon = <Icon type="loading" style={{ fontSize: 24 }} spin />;

@connect(({}) => ({}))
export default class AppExporter extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
        app_exporte_status: null,
    };
  }
  componentDidMount() {
    this.queryExport()
  }
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  handleExporter = (format) =>{
    const app = this.props.app;
    const app_id = app.ID;
    this.props.dispatch({
      type: 'market/appExport',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_id,
        format,
      },
      callback: (data) => {
        if (data.bean){
          notification.success({ message: '操作成功，开始导出，请稍等！' });
          this.queryExport();
        }
      },
    });
    return
  }
  queryExport = () => {
    const item = this.props.app || {};
    this.props.dispatch({
      type: 'market/queryExport',
      payload: {
        app_id: item.ID,
        team_name: globalUtil.getCurrTeamName(),
      },
      callback: (data) => {
        if ((data.bean.rainbond_app && data.bean.rainbond_app.status=="exporting") || 
            (data.bean.docker_compose && data.bean.docker_compose.status=="exporting")
          ){
          this.props.setIsExporting(true)
          setTimeout(() => {
            this.queryExport();
          }, 5000);
        }
        if ((data.bean.rainbond_app && data.bean.rainbond_app.status!="exporting") || 
            (data.bean.docker_compose && data.bean.docker_compose.status!="exporting")
          ){
          this.props.setIsExporting(false)
        }
        this.setState({app_exporte_status:data.bean})
      }
    });
  };
  download = (downloadPath) => {
    let aEle = document.querySelector('#down-a-element');
    if (!aEle) {
      aEle = document.createElement('a');
      aEle.setAttribute('download', 'filename');
      document.body.appendChild(aEle);
    }
    aEle.href = downloadPath;
    if (document.all) {
      aEle.click();
    } else {
      const e = document.createEvent('MouseEvents');
      e.initEvent('click', true, true);
      aEle.dispatchEvent(e);
    }
  };
  getStatus = (status) =>{
    if (!status.is_export_before){
      return "未导出"
    }
    if (status.status == "success") {
      return "成功"
    }
    if (status.status == "failed") {
      return "失败"
    }
    if (status.status == "exporting") {
      return "进行中"
    }
  };
  getAction = (app_status, type) =>{
    if (!app_status.is_export_before){
      return(<Button type="primary" onClick={()=>{
        this.handleExporter(type)
     }}>导出</Button>)
    }
    if (app_status.status == "success") {
       return (
         <div>
         <Button type="primary" onClick={()=>{
            this.download(app_status.file_path)
         }}>下载</Button>
         <Button style={{marginLeft:16}} onClick={()=>{
          this.handleExporter(type)
       }}>重新导出</Button>
       </div>
       )
    }
    if (app_status.status == "exporting") {
      return (
        <div>
        <Button disabled type="primary" onClick={()=>{
           this.download(downloadPath)
        }}>下载</Button>
        <Button disabled style={{marginLeft:16}} onClick={()=>{
         this.handleExporter(type)
      }}>重新导出</Button>
      </div>
      )
    }
    if (app_status.status == "failed") {
      return (
        <div>
        <Button disabled type="primary" onClick={()=>{
           this.download(downloadPath)
        }}>下载</Button>
        <Button style={{marginLeft:16}} onClick={()=>{
         this.handleExporter(type)
      }}>重新导出</Button>
      </div>
      )
    }
  }
  getRainbondAppShow = ()=>{
     if (!this.state.app_exporte_status || !this.state.app_exporte_status.rainbond_app){
       return
     }
     const rainbond_app_status = this.state.app_exporte_status.rainbond_app
     return (
          <DescriptionList size="large" title="RainbondApp规范(Rainbond平台可用)" style={{ marginBottom: 32 }}>
            <Description term="导出状态">{this.getStatus(rainbond_app_status)}</Description>
            {this.getAction(rainbond_app_status, "rainbond-app")}
          </DescriptionList>
      )
     
  };
  getDockerComposeAppShow = ()=>{
    if (!this.state.app_exporte_status || !this.state.app_exporte_status.docker_compose){
      return
    }
    const compose_app_status = this.state.app_exporte_status.docker_compose
    return (
        <DescriptionList size="large" title="DockerComposeApp规范(DockerCompose环境可用)" style={{ marginBottom: 32 }}>
          <Description term="导出状态">{this.getStatus(compose_app_status)}</Description>
          {this.getAction(compose_app_status, "docker-compose")}
        </DescriptionList>
    )
  };
  render() {
    return (
      <Modal 
        // onOk={this.props.onOk}
        // onCancel={this.props.onCancel}
        title="导出云市应用" 
        footer={[<Button onClick={this.props.onCancel}>关闭</Button>]}
        visible={true}
        >
        <Alert
          style={{ textAlign: 'center', marginBottom: 16 }}
          message="导出云市应用适用于交付环境"
          type="success"
        />
        {this.getRainbondAppShow()}
        {!(this.props.app.source=="market") && this.getDockerComposeAppShow()}
      </Modal>
    );
  }
}