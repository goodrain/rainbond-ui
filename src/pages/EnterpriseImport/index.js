import React, { PureComponent, Fragment } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { connect } from 'dva';
import {
  Card,
  Button,
  myheaders,
  Col,
  Row,
  Menu,
  Dropdown,
  Icon,
  Spin,
  List,
  Tag,
  Radio,
  Input,
  Tooltip,
  Pagination,
  notification,
  Avatar,
  Checkbox,
  Select,
  Upload,
} from 'antd';
import { routerRedux } from 'dva/router';
import userUtil from '../../utils/user';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import rainbondUtil from '../../utils/rainbond';

import styles from './index.less';

const { Search } = Input;

@connect(({ user, global }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
}))
export default class EnterpriseShared extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fileList: [],
      existFileList: [],
      record: {},
      event_id: '',
      file_list: [],
      import_file_status: [],
      autoQuery: true,
      value: 'enterprise',
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
        event_id: this.state.event_id,
      },
      callback: data => {
        if (data) {
          notification.success({ message: `取消成功` });
          this.props.cancelImport && this.props.cancelImport();
        }
      },
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
        message: '您还没有上传文件',
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
        event_id,
        file_name,
      },
      callback: data => {
        if (data) {
          notification.success({ message: `操作成功，正在导入` });
          this.props.onOk && this.props.onOk(data);
        }
      },
    });
  };
  onChangeUpload = info => {
    let fileList = info.fileList;
    fileList = fileList.filter(file => {
      if (file.response) {
        return file.response.msg === 'success';
      }
      return true;
    });
    this.openAutoQuery();
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
        message: '请至少选择一个应用',
      });
      return;
    }
    let fileStr = '';
    this.state.file_list.map(order => {
      fileStr += `${order},`;
    });
    fileStr = fileStr.slice(0, fileStr.length - 1);
    this.props.dispatch({
      type: 'market/importApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        scope: 'enterprise',
        event_id: this.state.event_id,
        file_name: fileStr,
      },
      callback: data => {
        if (data) {
          notification.success({
            message: '开始导入应用',
          });
          this.closeAutoQuery();
          this.openQueryImportStatus();
        }
      },
    });
  };
  queryImportRecord = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;

    dispatch({
      type: 'market/queryImportRecord',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        console.log('res', res);

        if (res) {
          this.setState(
            { record: res.bean, event_id: res.bean.event_id },
            () => {
              this.openQueryImportStatus();
              this.handleQueryImportDir();
            }
          );
        }
      },
    });
  };
  queryImportStatus = () => {
    if (!this.autoQueryStatus) return;
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'market/queryImportApp',
      payload: {
        enterprise_id: eid,
        event_id: this.state.event_id,
      },
      callback: data => {
        if (data) {
          this.setState({ import_file_status: data.list });
          if (data.bean && data.bean.status == 'uploading') {
            return;
          }
          if (data.bean && data.bean.status == 'partial_success') {
            notification.success({
              message: '部分应用导入失败，你可以重试或取消导入',
            });
            return;
          }
          if (data.bean && data.bean.status == 'success') {
            notification.success({
              message: '导入完成',
            });
            this.props.onOK && this.props.onOK();
            return;
          }
          if (data.bean && data.bean.status == 'failed') {
            notification.success({
              message: '应用导入失败',
            });
            return;
          }
          setTimeout(() => {
            this.queryImportStatus();
          }, 2000);
        }
      },
    });
  };

  handleQueryImportDir = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    if (this.autoQuery) {
      dispatch({
        type: 'market/queryImportDirApp',
        payload: {
          enterprise_id: eid,
          event_id: this.state.event_id,
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
        },
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
        file_name,
      },
      callback: data => {
        if (data) {
          notification.success({
            message: '开始重新导入',
          });
          this.openQueryImportStatus();
        }
      },
    });
  };
  onChange = checkedValues => {
    console.log('checked = ', checkedValues);
  };

  onChangeRadio = e => {
    console.log('radio checked', e.target.value);
    this.setState({
      value: e.target.value,
    });
  };

  render() {
    const appstatus = {
      pending: '等待中',
      importing: '导入中',
      success: '成功',
      failed: '失败',
    };
    const myheaders = {};
    const { componentList } = this.state;
    const {
      rainbondInfo,
      match: {
        params: { eid },
      },
    } = this.props;

    const radioStyle = {
      display: 'block',
      height: '30px',
      lineHeight: '30px',
    };

    return (
      <PageHeaderLayout
        title="离线应用导入"
        content="离线应用导入是创建本地共享库应用模型的方式之一，离线应用包可以来自其他Rainbond平台导出或云应用商店导出"
        returnUrl={`/enterprise/${eid}/shared`}
      >
        <div style={{ margin: '75px 21px 0 24px' }}>
          <div className={styles.tit}>离线导入</div>
          <Card
            bodyStyle={{ padding: '25px 0 25px 29px' }}
            className={styles.mb10}
          >
            <Row className={styles.box}>
              <Col span={24} className={styles.desc}>
                正在使用“阿里云上海”数据中心完成本次导入任务
              </Col>
            </Row>
          </Card>

          <Card bodyStyle={{ padding: '0 0 0 27px' }} className={styles.mb10}>
            <Row className={styles.box}>
              <Col span={23} className={styles.con}>
                上传RainbondAPP文件
                {/* {this.state.import_file_status.length >= 0 ? (
                  <div>
                    {this.state.import_file_status.map(app => {
                      return (
                        <p style={{ lineHeight: '30px', paddingBottom: '5px' }}>
                          {app.file_name}
                          <span style={{ padding: '0 5px' }}>
                            {appstatus[app.status]}
                          </span>
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  '上传RainbondAPP文件'
                )} */}
              </Col>
              <Col span={1} className={styles.rl}>
                <Upload
                  name="appTarFile"
                  accept=".zip,.tar"
                  // action={this.state.record.upload_url}
                  action="https://wss-alish.goodrain.com:6060/app/upload/285fcf36ecd94f46a40ae9f6f4b551b7"
                  fileList={this.state.fileList}
                  onChange={this.onChangeUpload}
                  onRemove={this.onRemove}
                  headers={myheaders}
                >
                  <Icon type="upload" />
                </Upload>
                <div>
                  <span size="small">上传</span>
                </div>
              </Col>
            </Row>
          </Card>

          <div className={styles.tit}>已上传文件列表</div>
          <Card className={styles.mb10}>
            <Checkbox.Group
              style={{ width: '100%' }}
              onChange={this.onFileChange}
            >
              <Row>
                {this.state.existFileList.map(order => {
                  return (
                    <Col key={`col${order}`} span={24}>
                      <Checkbox key={order} value={order}>
                        {order}
                      </Checkbox>
                    </Col>
                  );
                })}
              </Row>
            </Checkbox.Group>
          </Card>
          <div className={styles.tit}>导入范围</div>

          <Card className={styles.mb10}>
            <Radio.Group onChange={this.onChangeRadio} value={this.state.value}>
              <Radio style={radioStyle} value="enterprise">
                上传到企业
              </Radio>
              <Radio style={radioStyle} value={2}>
                上传到团队
                <Select
                  size="small"
                  defaultValue="goodrain"
                  style={{ width: 120, marginLeft: '15px' }}
                  // onChange={handleChange}
                >
                  <Option value="jack">goodrain</Option>
                  <Option value="lucy">Lucy</Option>
                </Select>
              </Radio>
            </Radio.Group>
          </Card>
          <Row style={{ marginTop: '25px' }}>
            <Col span={24} className={styles.btn}>
              <Button
                onClick={() => {
                  this.cancelImport();
                }}
              >
                放弃导入
              </Button>
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
            </Col>
          </Row>
        </div>
      </PageHeaderLayout>
    );
  }
}
