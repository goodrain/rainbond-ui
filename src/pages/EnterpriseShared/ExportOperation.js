import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { notification, Tooltip } from 'antd';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import AppExporter from './AppExporter';

@connect(({ user, global }) => ({
  currentUser: user.currentUser,
  rainbondInfo: global.rainbondInfo,
}))
export default class ExportOperation extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      docker_compose: null,
      rainbond_app: null,
      is_exporting: false,
      showExporterApp: false,
      showImportApp: true,
    };
  }
  componentDidMount() {
    this.mounted = true;
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  download = (app_id, format) => {
    let aEle = document.querySelector('#down-a-element');
    if (!aEle) {
      aEle = document.createElement('a');
      aEle.setAttribute('download', 'filename');
      document.body.appendChild(aEle);
    }
    const href = localMarketUtil.getAppExportUrl({
      team_name: globalUtil.getCurrTeamName(),
      app_id,
      format,
    });
    aEle.href = href;
    if (document.all) {
      aEle.click();
    } else {
      const e = document.createEvent('MouseEvents');
      e.initEvent('click', true, true);
      aEle.dispatchEvent(e);
    }
  };
  showAppExport = () => {
    const app = this.props.app || {};
    this.setState({ showExporterApp: true });
  };

  hideAppExport = () => {
    this.setState({ showExporterApp: false });
  };

  appExport = format => {
    const app = this.props.app;
    const app_id = app.ID;
    this.props.dispatch({
      type: 'market/appExport',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_id,
        format,
      },
      callback: data => {
        notification.success({ message: '操作成功，开始导出，请稍等！' });
        if (format === 'rainbond-app') {
          this.setState({ is_rainbond_app_exporting: true });
        } else {
          this.setState({ is_docker_compose_exporting: true });
        }
        this.queryExport(format);
      },
    });
  };
  queryExport = type => {
    const item = this.props.app || {};
    this.props.dispatch({
      type: 'market/queryExport',
      payload: {
        app_id: item.ID,
        team_name: globalUtil.getCurrTeamName(),
        body: {
          group_key: item.group_key,
          group_version: item.group_version_list,
        },
      },
      callback: data => {
        // 点击导出平台应用
        if (type === 'rainbond-app') {
          const rainbond_app = (data && data.bean.rainbond_app) || {};
          if (rainbond_app.status === 'success') {
            this.setState({ is_rainbond_app_exporting: false });
            this.download(item.ID, type);
            return;
          }

          // 导出中
          if (rainbond_app.status === 'exporting') {
            this.setState({ is_rainbond_app_exporting: true });
            if (this.mounted) {
              setTimeout(() => {
                this.queryExport(type);
              }, 5000);
            }
          }

          if (
            (rainbond_app.is_export_before === false ||
              rainbond_app.status === 'failed') &&
            this.mounted
          ) {
            this.appExport(type);
          }

          // 点击导出compose
        } else {
          const docker_compose = (data && data.bean.docker_compose) || {};
          if (docker_compose.status === 'success' && docker_compose.file_path) {
            this.setState({ is_docker_compose_exporting: false });
            this.download(item.ID, type);
            return;
          }
          // 导出中
          if (docker_compose.status === 'exporting') {
            this.setState({ is_docker_compose_exporting: true });
            if (this.mounted) {
              setTimeout(() => {
                this.queryExport(type);
              }, 5000);
            }
          }
          if (
            (docker_compose.is_export_before === false ||
              docker_compose.status === 'failed') &&
            this.mounted
          ) {
            this.appExport(type);
          }
        }
      },
    });
  };
  setIsExporting = status => {
    this.setState({ is_exporting: status });
  };
  render() {
    const { eid, app } = this.props;
    const { rainbondInfo } = this.props;
    return (
      <Fragment>
        {/* {rainbondUtil.exportAppEnable(rainbondInfo) && */}
          <a
            onClick={this.showAppExport}
            style={{ marginRight: 8 }}
            href="javascript:;"
          >
            导出应用模版{this.state.is_exporting ? '(导出中)' : ''}
          </a>
        {/* } */}
        {this.state.showExporterApp && (
          <AppExporter
            eid={eid}
            setIsExporting={this.setIsExporting}
            app={app}
            onOk={this.hideAppExport}
            onCancel={this.hideAppExport}
          />
        )}
      </Fragment>
    );
  }
}
