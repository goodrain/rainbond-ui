import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
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
  showAppExport = () => {
    const app = this.props.app || {};
    this.setState({ showExporterApp: true });
  };

  hideAppExport = () => {
    this.setState({ showExporterApp: false });
  };

  setIsExporting = status => {
    this.setState({ is_exporting: status });
  };
  render() {
    const { eid, app } = this.props;
    const { rainbondInfo } = this.props;
    return (
      <Fragment>
        <a
          onClick={this.showAppExport}
          style={{ marginRight: 8 }}
          href="javascript:;"
        >
          导出应用模版{this.state.is_exporting ? '(导出中)' : ''}
        </a>
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
