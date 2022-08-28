import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Icon,
  notification,
  Row,
  Upload
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import globalUtil from '../../utils/global';

const appstatus = {
  pending: formatMessage({id:'notification.success.pending'}),
  importing: formatMessage({id:'notification.success.importing'}),
  success: formatMessage({id:'notification.success.successed'}),
  failed: formatMessage({id:'notification.success.Failed'})
};

@connect(({ user, global }) => ({ groups: global.groups }), null, null, {
  withRef: true
})
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fileList: [],
      existFileList: [],
      record: {},
      event_id: '',
      file_list: [],
      import_file_status: [],
      autoQuery: true
    };
    this.autoQuery = true;
    this.autoQueryStatus = false;
  }
  componentDidMount() {
    this.queryImportRecord();
  }
  componentWillUnmount() {
    this.autoQuery = false;
    this.autoQueryStatus = false;
  }
  cancelImport = () => {
    this.props.dispatch({
      type: 'market/cancelImportApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        event_id: this.state.event_id
      },
      callback: data => {
        if (data) {
          notification.success({ message: formatMessage({id:'notification.success.cancel_successfully'}) });
          this.props.cancelImport && this.props.cancelImport();
        }
      }
    });
  };
  complete = () => {
    this.props.onOK && this.props.onOK();
  };
  closeAutoQuery = () => {
    this.autoQuery = false;
    this.setState({ autoQuery: false });
  };
  handleOk = () => {
    const file = this.state.fileList;
    if (file.length == 0) {
      notification.info({
        message: formatMessage({id:'notification.warn.upload_file'})
      });
      return;
    }
    // file.map((item) => {
    //   if (item.status != "done") {
    //     notification.info({
    //       message: "正在上传请稍后"
    //     });
    //     return;
    //   }
    // })
    const file_name = file[0].name;
    const event_id = file[0].response.data.bean.event_id;
    this.props.dispatch({
      type: 'market/importApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        scope: 'enterprise',
        event_id: event_id,
        file_name: file_name
      },
      callback: data => {
        if (data) {
          notification.success({ message: formatMessage({id:'notification.success.being_imported'}) });
          this.props.onOk && this.props.onOk(data);
        }
      }
    });
  };
  onChange = info => {
    let fileList = info.fileList;
    fileList = fileList.filter(file => {
      if (file.response) {
        return file.response.msg === 'success';
      }
      return true;
    });
    this.setState({ fileList });
  };
  onRemove = () => {
    this.setState({ fileList: [] });
  };
  onFileChange = e => {
    this.setState({ file_list: e });
  };
  openAutoQuery = () => {
    this.autoQuery = true;
    this.setState({ autoQuery: true });
    this.handleQueryImportDir();
  };
  openQueryImportStatus = () => {
    this.autoQueryStatus = true;
    this.queryImportStatus();
  };
  handleSubmit = () => {
    if (this.state.file_list.length == 0) {
      notification.warning({
        message: formatMessage({id:'notification.warn.choose_one'})
      });
      return;
    }
    var fileStr = '';
    this.state.file_list.map(order => {
      fileStr += order + ',';
    });
    fileStr = fileStr.slice(0, fileStr.length - 1);
    this.props.dispatch({
      type: 'market/importApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        scope: 'enterprise',
        event_id: this.state.event_id,
        file_name: fileStr
      },
      callback: data => {
        if (data) {
          notification.success({
            message: formatMessage({id:'notification.success.starting_imported'})
          });
          this.closeAutoQuery();
          this.openQueryImportStatus();
        }
      }
    });
  };
  queryImportRecord = () => {
    this.props.dispatch({
      type: 'market/queryImportRecord',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          this.setState({ record: data.bean });
          this.setState({ event_id: data.bean.event_id }, () => {
            this.openQueryImportStatus();
            this.handleQueryImportDir();
          });
        }
      }
    });
  };
  queryImportStatus = () => {
    if (!this.autoQueryStatus) return;
    this.props.dispatch({
      type: 'market/queryImportApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        event_id: this.state.event_id
      },
      callback: data => {
        if (data) {
          this.setState({ import_file_status: data.list });
          if (data.bean && data.bean.status == 'uploading') {
            return;
          }
          if (data.bean && data.bean.status == 'partial_success') {
            notification.success({
              message: formatMessage({id:'notification.error.failed_import_app'})
            });
            return;
          }
          if (data.bean && data.bean.status == 'success') {
            notification.success({
              message: formatMessage({id:'notification.success.imports_closure'})
            });
            this.props.onOK && this.props.onOK();
            return;
          }
          if (data.bean && data.bean.status == 'failed') {
            notification.success({
              message: formatMessage({id:'notification.error.failed_import'})
            });
            return;
          }
          setTimeout(() => {
            this.queryImportStatus();
          }, 2000);
        }
      }
    });
  };

  handleQueryImportDir = () => {
    if (this.autoQuery) {
      this.props.dispatch({
        type: 'market/queryImportDirApp',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          event_id: this.state.event_id
        },
        callback: data => {
          if (data) {
            this.setState({ existFileList: data.list });
          }
          if (this.autoQuery) {
            setTimeout(() => {
              this.handleQueryImportDir();
            }, 8000);
          }
        }
      });
    }
  };
  reImportApp = file_name => {
    this.props.dispatch({
      type: 'market/importApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        scope: 'enterprise',
        event_id: this.state.event_id,
        file_name: file_name
      },
      callback: data => {
        if (data) {
          notification.success({
            message: formatMessage({id:'notification.success.reimport'})
          });
          this.openQueryImportStatus();
        }
      }
    });
  };
  render() {
    let myheaders = {};
    return (
      <Card>
        {this.state.record && (
          <div>
            <div style={{ paddingBottom: 8 }}>
              <span style={{ marginRight: 8 }}>
                你可以将APP文件复制到集群管理节点目录:
              </span>
              <a style={{ marginRight: 16 }}>{this.state.record.source_dir}</a>
              <CopyToClipboard
                text={this.state.record.source_dir}
                onCopy={() => {
                  notification.success({ message: formatMessage({id:'notification.success.copy'}) });
                }}
              >
                <Button size="small">复制</Button>
              </CopyToClipboard>
            </div>
            <div style={{ borderBottom: 'solid #ccc 1px', paddingBottom: 16 }}>
              <span style={{ marginRight: 8 }}>你也可以直接上传APP文件:</span>
              <Upload
                name="appTarFile"
                accept=".zip,.tar"
                action={this.state.record.upload_url}
                fileList={this.state.fileList}
                onChange={this.onChange}
                onRemove={this.onRemove}
                headers={myheaders}
              >
                <Button size="small">
                  <Icon type="upload" />
                  请选择文件
                </Button>
              </Upload>
            </div>
            {this.state.import_file_status.length == 0 ? (
              <div style={{ paddingBottom: 16 }}>
                {this.autoQuery ? (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 16 }}>
                      正在自动识别已上传APP文件...
                      <a
                        onClick={() => {
                          this.closeAutoQuery();
                        }}
                      >
                        关闭
                      </a>
                    </p>
                  </div>
                ) : (
                  <a
                    style={{ fontSize: 16 }}
                    onClick={() => {
                      this.openAutoQuery();
                    }}
                  >
                    打开自动识别
                  </a>
                )}
                {this.state.existFileList.length > 0 && (
                  <Checkbox.Group
                    onChange={this.onFileChange}
                    style={{ display: 'block' }}
                  >
                    <Row>
                      {this.state.existFileList.map(order => {
                        return (
                          <Col key={'col' + order} span={8}>
                            <Checkbox key={order} value={order}>
                              {order}
                            </Checkbox>
                          </Col>
                        );
                      })}
                    </Row>
                  </Checkbox.Group>
                )}
              </div>
            ) : (
              <div style={{ paddingBottom: 16 }}>
                <p style={{ fontSize: 16 }}>正在导入应用:</p>
                <ul>
                  {this.state.import_file_status.map(app => {
                    return (
                      <li style={{ lineHeight: '30px', paddingBottom: '5px' }}>
                        {app.file_name}
                        <span style={{ padding: '0 5px' }}>
                          {appstatus[app.status]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              {this.state.import_file_status.length == 0 && (
                <Button
                  type="primary"
                  onClick={() => {
                    this.handleSubmit();
                  }}
                >
                  确认导入
                </Button>
              )}
              <Button
                style={{ marginLeft: 16 }}
                onClick={() => {
                  this.cancelImport();
                }}
              >
                放弃导入
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  }
}
