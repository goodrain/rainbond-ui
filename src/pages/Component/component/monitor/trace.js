import Result from "@/components/Result";
import globalUtil from "@/utils/global";
import handleAPIError from "@/utils/error";
import { Alert, Button, Card, notification } from "antd";
import { connect } from "dva";
import React, { Fragment, PureComponent } from "react";
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';

// 样式常量
const ALERT_STYLE = {
  marginBottom: "16px"
};

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

  // 获取 payload
  getPayload = () => {
    const { appDetail } = this.props;
    return {
      team_name: globalUtil.getCurrTeamName(),
      app_alias: appDetail.service.service_alias
    };
  };

  // 加载追踪设置
  loadTraceSetting() {
    const { dispatch } = this.props;
    dispatch({
      type: "monitor/getComponsentTrace",
      payload: this.getPayload(),
      callback: re => {
        if (re && re.bean) {
          this.setState({ trace: re.bean });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  }

  // 开启追踪
  openTrace = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "monitor/setComponsentTrace",
      payload: this.getPayload(),
      callback: () => {
        notification.success({ message: formatMessage({ id: 'notification.success.setupAssembly' }) });
        this.loadTraceSetting();
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 关闭追踪
  closeTrace = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "monitor/deleteComponsentTrace",
      payload: this.getPayload(),
      callback: () => {
        notification.success({ message: formatMessage({ id: 'notification.success.closeAssembly' }) });
        this.loadTraceSetting();
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 渲染追踪状态
  renderTraceStatus = () => {
    const { trace } = this.state;

    // 已对接但未开启
    if (trace.collector_host && !trace.enable_apm) {
      return (
        <Result
          type="success"
          description={<FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.Docking" />}
          actions={[
            <Button key="open" type="primary" onClick={this.openTrace}>
              <FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.open" />
            </Button>
          ]}
        />
      );
    }

    // 已开启
    if (trace.collector_host && trace.enable_apm) {
      return (
        <Result
          type="success"
          description={<FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.alreadyOpen" />}
          actions={[
            <Button key="close" type="primary" onClick={this.closeTrace}>
              <FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.close" />
            </Button>
          ]}
        />
      );
    }

    // 未对接
    return (
      <Result
        type="warning"
        description={<FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.notDependent" />}
      />
    );
  };

  render() {
    return (
      <Fragment>
        <Alert
          style={ALERT_STYLE}
          message={<FormattedMessage id="componentOverview.body.tab.monitor.TraceShow.message" />}
        />
        <Card>
          {this.renderTraceStatus()}
        </Card>
      </Fragment>
    );
  }
}
