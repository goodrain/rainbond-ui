import React, { Component } from 'react'
import { connect } from 'dva';
import { Tabs } from 'antd';
import { formatMessage } from '@/utils/intl';
import ManualIssuance from './ManualIssuance';
import GlobalUtil from '../../../utils/global';
import AutomaticIssuance from './AutomaticIssuance';


const { TabPane } = Tabs;
@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo
}))
export default class indexs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeKey: '1',
      existsAutomaticIssuanceCert: false
    };
  }
  componentDidMount() {
    this.checkAutomaticIssuanceCert();
  }
  checkAutomaticIssuanceCert = () => {
    this.props.dispatch({
      type: 'gateWay/checkAutomaticIssuanceCert',
      payload: {
        teamName: GlobalUtil.getCurrTeamName(),
      },
      callback: (res) => {    
        if(res && res.status_code == 200) {
          this.setState({
            existsAutomaticIssuanceCert: res.bean.exists,
          });
        }
      }
    });
  }
  onChange = (key) => {
    this.setState({ activeKey: key });
  }
  render() {
    const { existsAutomaticIssuanceCert } = this.state;
    const platformUrl = this.props.rainbondInfo.document.enable && this.props.rainbondInfo.document.value.platform_url;

    return (
      <Tabs defaultActiveKey={this.state.activeKey} onChange={this.onChange}>
        <TabPane tab={formatMessage({id:'teamNewGateway.NewGateway.AutomaticIssuance.manualIssue'})} key="1">
          <ManualIssuance {...this.props}/>
        </TabPane>
        <TabPane tab={formatMessage({id:'teamNewGateway.NewGateway.AutomaticIssuance.autoIssue'})} key="2">
          {existsAutomaticIssuanceCert ? <AutomaticIssuance {...this.props}/> : <div style={{textAlign: 'center',margin: '100px 0'}}>
            <p>{formatMessage({id:'teamNewGateway.NewGateway.AutomaticIssuance.detectNotInstall'})}  <a href={`${platformUrl}docs/how-to-guides/app-ops/cert-manager`} target="_blank">{formatMessage({id:'teamNewGateway.NewGateway.AutomaticIssuance.autoIssueCertificate'})} </a> </p>
          </div>}
        </TabPane>
      </Tabs>
    )
  }
}
