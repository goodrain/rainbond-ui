/* eslint-disable camelcase */
/* eslint-disable consistent-return */
import { Alert, Button, Modal, notification, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from '../../components/CreateTeam/index.less';
import DescriptionList from '../../components/DescriptionList';

const { confirm } = Modal;
const { Option } = Select;
const { Description } = DescriptionList;

@connect(({ user }) => ({
  user: user.currentUser
}))
export default class AppExporter extends PureComponent {
  constructor(props) {
    super(props);
    const { app = {} } = props;
    this.state = {
      app_exporte_status: null,
      exportVersionList: app.versions_info || [],
      versionInfo: {},
      exportVersion:
        (app.versions_info &&
          app.versions_info.length > 0 && [
            app.versions_info[app.versions_info.length - 1].version
          ]) ||
        ''
    };
  }
  componentDidMount() {
    const { exportVersionList, exportVersion } = this.state;
    if (exportVersionList && exportVersionList.length > 0 && exportVersion) {
      this.handleVersionInfo();
    }
    this.queryExport();
  }
  getDockerComposeAppShow = () => {
    const { app_exporte_status } = this.state;
    if (!app_exporte_status || !app_exporte_status.docker_compose) {
      return;
    }
    const compose_app_status = app_exporte_status.docker_compose;
    return (
      <DescriptionList
        size="large"
        title={formatMessage({id:'applicationMarket.AppExporter.Docker'})}
        style={{ marginBottom: 32 }}
      >
        <Description term={formatMessage({id:'applicationMarket.AppExporter.state'})}>
          {this.getStatus(compose_app_status)}
        </Description>
        {this.getAction(compose_app_status, 'docker-compose')}
      </DescriptionList>
    );
  };
  getRainbondAppShow = () => {
    const { app_exporte_status } = this.state;
    if (!app_exporte_status || !app_exporte_status.rainbond_app) {
      return;
    }
    const rainbond_app_status = app_exporte_status.rainbond_app;
    return (
      <DescriptionList
        size="large"
        title={formatMessage({id:'applicationMarket.AppExporter.standard'})}
        style={{ marginBottom: 32 }}
      >
        <Description term={formatMessage({id:'applicationMarket.AppExporter.state'})}>
          {this.getStatus(rainbond_app_status)}
        </Description>
        {this.getAction(rainbond_app_status, 'rainbond-app')}
      </DescriptionList>
    );
  };
  getAction = (app_status, type) => {
    if (!app_status.is_export_before) {
      return (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            this.handleRelease(type);
          }}
        >
          {formatMessage({id:'applicationMarket.AppExporter.import'})}
        </Button>
      );
    }

    if (app_status.status == 'success') {
      return (
        <div>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              this.download(app_status.file_path);
            }}
          >
            {formatMessage({id:'applicationMarket.AppExporter.install'})}
          </Button>
          <Button
            style={{ marginLeft: 16 }}
            size="small"
            onClick={() => {
              this.handleRelease(type);
            }}
          >
            {formatMessage({id:'applicationMarket.AppExporter.Re_export'})}
          </Button>
        </div>
      );
    }
    if (app_status.status == 'exporting') {
      return (
        <div>
          <Button
            disabled
            type="primary"
            size="small"
            onClick={() => {
              this.download(app_status.file_path);
            }}
          >
            {formatMessage({id:'applicationMarket.AppExporter.install'})}
          </Button>
          <Button
            disabled
            style={{ marginLeft: 16 }}
            size="small"
            onClick={() => {
              this.handleExporter(type);
            }}
          >
            {formatMessage({id:'applicationMarket.AppExporter.Re_export'})}
          </Button>
        </div>
      );
    }
    if (app_status.status == 'failed') {
      return (
        <div>
          <Button
            disabled
            type="primary"
            size="small"
            onClick={() => {
              this.download(app_status.file_path);
            }}
          >
            {formatMessage({id:'applicationMarket.AppExporter.install'})}
          </Button>
          <Button
            style={{ marginLeft: 16 }}
            size="small"
            onClick={() => {
              this.handleExporter(type);
            }}
          >
            {formatMessage({id:'applicationMarket.AppExporter.Re_export'})}
          </Button>
        </div>
      );
    }
  };
  getStatus = status => {
    if (!status.is_export_before) {
      return `${formatMessage({id:'applicationMarket.AppExporter.Not_exported'})}`;
    }
    if (status.status == 'success') {
      return `${formatMessage({id:'notification.success.successed'})}`;
    }
    if (status.status == 'failed') {
      return `${formatMessage({id:'notification.success.Failed'})}`;
    }
    if (status.status == 'exporting') {
      return `${formatMessage({id:'applicationMarket.AppExporter.hand'})}`;
    }
  };
  handleVersionInfo = () => {
    const { exportVersionList, exportVersion } = this.state;
    if (exportVersion && exportVersion.length > 0) {
      const currentVersionInfo = exportVersionList.filter(
        item => item.version === exportVersion[0]
      );
      if (currentVersionInfo.length > 0) {
        this.setState({
          versionInfo: currentVersionInfo[0]
        });
      }
    }
  };

  handleRelease = type => {
    const { versionInfo } = this.state;
    const th = this;
    if (versionInfo.dev_status === '') {
      confirm({
        title: formatMessage({id:'applicationMarket.AppExporter.title'}),
        content: formatMessage({id:'applicationMarket.AppExporter.content'}),
        okText: formatMessage({id:'button.confirm'}),
        cancelText: formatMessage({id:'button.cancel'}),
        onOk() {
          th.handleExporter(type);
          return new Promise((resolve, reject) => {
            setTimeout(Math.random() > 0.5 ? resolve : reject, 1000);
          }).catch(() => console.log('Oops errors!'));
        }
      });
    } else {
      th.handleExporter(type);
    }
  };

  handleCancel = () => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
  };
  handleExporter = format => {
    const { app, eid, dispatch } = this.props;
    const { exportVersion } = this.state;
    dispatch({
      type: 'market/appExport',
      payload: {
        app_id: app.app_id,
        enterprise_id: eid,
        app_versions: exportVersion,
        format
      },
      callback: data => {
        if (data && data.bean) {
          notification.success({ message: formatMessage({id:'notification.success.operate_successfully'}) });
          this.queryExport();
        }
      }
    });
  };
  queryExport = () => {
    const { app, eid, dispatch, setIsExporting } = this.props;

    let group_version = this.state.exportVersion;
    group_version = group_version.join();
    dispatch({
      type: 'market/queryExport',
      payload: {
        enterprise_id: eid,
        body: {
          app_id: app.app_id,
          app_version: group_version
        }
      },
      callback: data => {
        if (data) {
          if (
            (data.list &&
              data.list.length > 0 &&
              data.list[0].rainbond_app &&
              data.list[0].rainbond_app.status == 'exporting') ||
            (data.list &&
              data.list.length > 0 &&
              data.list[0].docker_compose &&
              data.list[0].docker_compose.status == 'exporting')
          ) {
            setIsExporting(true);
            setTimeout(() => {
              this.queryExport();
            }, 5000);
          }

          if (
            (data.list &&
              data.list.length > 0 &&
              data.list[0].rainbond_app &&
              data.list[0].rainbond_app.status != 'exporting') ||
            (data.list &&
              data.list.length > 0 &&
              data.list[0].docker_compose &&
              data.list[0].docker_compose.status != 'exporting')
          ) {
            setIsExporting(false);
          }
          this.setState({
            app_exporte_status:
              data.list && data.list.length > 0 && data.list[0]
          });
        }
      }
    });
  };
  download = downloadPath => {
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

  handleChange = value => {
    this.setState(
      {
        exportVersion: [value]
      },
      () => {
        this.handleVersionInfo();
        this.queryExport();
      }
    );
  };

  render() {
    const { onOk, onCancel, loading } = this.props;
    const { exportVersion, exportVersionList } = this.state;
    return (
      <Modal
        title={formatMessage({id:'applicationMarket.AppExporter.import_rain'})}
        onOk={onOk}
        visible
        className={styles.TelescopicModal}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> {formatMessage({id:'button.cancel'})}</Button>,
          <Button type="primary" loading={loading || false} onClick={onOk}>
            {formatMessage({id:'button.confirm'})}
          </Button>
        ]}
      >
        <Alert
          style={{ textAlign: 'center', marginBottom: 16 }}
          message={formatMessage({id:'applicationMarket.AppExporter.import_app'})}
          type="success"
        />
        <div style={{ marginBottom: '30px' }}>
          {formatMessage({id:'applicationMarket.AppExporter.import_edition'})}
          <Select
            style={{ width: '300px' }}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            defaultValue={exportVersion}
            onChange={this.handleChange}
            size="small"
          >
            {exportVersionList.map(item => {
              const { version } = item;
              return (
                <Option key={`key:${version}`} value={version}>
                  {version}
                </Option>
              );
            })}
          </Select>
        </div>
        {this.getRainbondAppShow()}
        {!(this.props.app.source == 'market') && this.getDockerComposeAppShow()}
      </Modal>
    );
  }
}
