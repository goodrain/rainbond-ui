import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import AppExporter from './AppExporter';

@connect(({ user }) => ({
  currentUser: user.currentUser
}))
export default class ExportOperation extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      is_exporting: false,
      showExporterApp: false
    };
  }
  componentDidMount() {
    this.mounted = true;
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  setIsExporting = status => {
    this.setState({ is_exporting: status });
  };
  hideAppExport = () => {
    this.setState({ showExporterApp: false });
  };
  showAppExport = () => {
    this.setState({ showExporterApp: true });
  };

  render() {
    const { eid, app } = this.props;
    return (
      <Fragment>
        <a onClick={this.showAppExport} style={{ marginRight: 8 }}>
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
