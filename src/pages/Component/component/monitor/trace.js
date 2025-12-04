/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
import Result from "@/components/Result";
import globalUtil from "@/utils/global";
import { Alert, Button, Card, notification } from "antd";
import { connect } from "dva";
import React, { Fragment, PureComponent } from "react";
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';

// eslint-disable-next-line react/no-multi-comp
@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail
}))
export default class TraceShow extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      trace: {}
    };
  }

  componentDidMount() {
    this.loadTraceSetting();
  }
  loadTraceSetting() {
    const { appDetail, dispatch } = this.props;
    dispatch({
      type: "monitor/getComponsentTrace",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service.service_alias
      },
      callback: re => {
        this.setState({ trace: re.bean });
      }
    });
  }
  openTrace = () => {
    const { appDetail, dispatch } = this.props;
    dispatch({
      type: "monitor/setComponsentTrace",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service.service_alias
      },
      callback: () => {
        notification.success({ message: formatMessage({id:'notification.success.setupAssembly'}) });
        this.loadTraceSetting();
      }
    });
  };
  closeTrace = () => {
    const { appDetail, dispatch } = this.props;
    dispatch({
      type: "monitor/deleteComponsentTrace",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service.service_alias
      },
      callback: () => {
        notification.success({ message: formatMessage({id:'notification.success.closeAssembly'}) });
        this.loadTraceSetting();
      }
    });
  };
  componentWillUnmount() {}

  render() {
    const { trace } = this.state;
    return (
      <Fragment>
        <Alert
          style={{ marginBottom: "16px" }}
          // message="当前基于Java类源代码构建的组件默认支持Pinpoint链路追踪数据采集"
          message={<FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.message"/>}
        />
        <Card>
          {trace.collector_host && !trace.enable_apm && (
            <Result
              type="success"
              // description="已经对接Pinpoint，可以开启数据采集"
              description={<FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.Docking"/>}
              actions={[
                <Button type="primary" onClick={this.openTrace}>
                  {/* 开启 */}
                  <FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.open"/>
                </Button>
              ]}
            />
          )}
          {trace.collector_host && trace.enable_apm && (
            <Result
              type="success"
              // description="已经开启Pinpoint链路追踪数据采集"
              description={<FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.alreadyOpen"/>}
              actions={[
                <Button type="primary" onClick={this.closeTrace}>
                  {/* 关闭 */}
                  <FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.close"/>
                </Button>
              ]}
            />
          )}
          {!trace.collector_host && (
            <Result
              type="warning"
              // description="当前组件未依赖Pinpoint服务，请先依赖Pinpoint服务"
              description={<FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.notDependent"/>}
            />
          )}
        </Card>
      </Fragment>
    );
  }
}
