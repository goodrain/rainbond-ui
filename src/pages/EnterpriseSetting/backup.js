import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  Modal,
  notification,
  Popconfirm,
  Row,
  Table,
  Upload,
  Card
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import {
  createBackup,
  loadBackups,
  recoverBackup,
  removeBackup
} from '../../services/backup';
import cookie from '../../utils/cookie';
import download from '../../utils/download';
import sourceUtil from '../../utils/source-unit';
import ScrollerX from '../../components/ScrollerX';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less';

const FormItem = Form.Item;
const { confirm } = Modal;

@connect(({ user, loading, global }) => ({
  user: user.currentUser,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
@Form.create()
export default class BackupManage extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      backups: [],
      recoverShow: false,
      recoverBackupName: null,
      backupLoading: true
    };
  }

  componentDidMount() {
    this.loadBackups();
  }
  onAddBackup = () => {
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    this.setState({ addLoading: true });
    confirm({
      title: formatMessage({ id: 'confirmModal.delete.data_backup.desc' }),
      content: formatMessage({ id: 'confirmModal.delete.data_backup.subDesc' }),
      okText: formatMessage({ id: 'button.confirm' }),
      cancelText: formatMessage({ id: 'button.cancel' }),
      onOk: () => {
        createBackup({ enterprise_id: eid }).then(re => {
          if (re && re.status_code === 200) {
            notification.success({ message: formatMessage({ id: 'status.app.backups.success' }) });
            this.loadBackups();
          }
          this.setState({ addLoading: false });
        });
      },
      onCancel: () => {
        this.setState({ addLoading: false });
      }
    });
  };

  onRecover = name => {
    this.setState({ recoverShow: true, recoverBackupName: name });
  };
  onRemove = name => {
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    removeBackup({ enterprise_id: eid, name }).then(re => {
      if (re && re.status_code === 200) {
        notification.success({ message: formatMessage({ id: 'notification.success.delete' }) });
        this.loadBackups();
      }
    });
  };
  onDownload = name => {
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    download(`/console/enterprise/${eid}/backups/${name}`, name);
  };
  onChangeUpload = info => {
    const { status } = info.file;
    if (status === 'done') {
      notification.success({ message: formatMessage({ id: 'notification.success.upload' }) });
      this.loadBackups();
      this.setState({ uploadLoading: false });
    } else {
      this.setState({ uploadLoading: true });
    }
  };

  loadBackups = () => {
    this.setState({ backupLoading: true });
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    loadBackups({ enterprise_id: eid, noModels: true })
      .then(data => {
        this.setState({ backups: data.list, backupLoading: false });
      })
      .catch(() => {
        this.setState({ backupLoading: false });
      });
  };

  submitOnRecover = () => {
    const {
      match: {
        params: { eid }
      },
      form
    } = this.props;
    this.setState({ recoverLoading: true });
    const { recoverBackupName } = this.state;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err) {
        recoverBackup({
          enterprise_id: eid,
          name: recoverBackupName,
          password: vals.password
        }).then(re => {
          if (re && re.status_code === 200) {
            notification.success({ message: formatMessage({ id: 'notification.success.restore_success' }) });
            this.loadBackups();
            this.setState({ recoverShow: false, recoverLoading: false });
          } else {
            this.setState({ recoverLoading: false });
          }
        });
      }
    });
  };

  render() {
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    const {
      backups,
      backupLoading,
      recoverShow,
      recoverLoading,
      addLoading,
      uploadLoading
    } = this.state;
    const { form } = this.props;
    const columns = [
      {
        // title: '备份文件',
        title: formatMessage({ id: 'enterpriseSetting.BackupManage.table.backupFile' }),
        dataIndex: 'name'
      },
      {
        // title: '大小',
        title: formatMessage({ id: 'enterpriseSetting.BackupManage.table.size' }),
        dataIndex: 'size',
        render: value => sourceUtil.unit(value / 1024)
      },
      {
        // title: '操作',
        title: formatMessage({ id: 'enterpriseSetting.BackupManage.table.handle' }),
        dataIndex: 'name',
        render: value => [
          <Popconfirm
            title={formatMessage({ id: 'confirmModal.delete.take_hand.desc' })}
            okText={formatMessage({ id: 'button.confirm' })}
            onConfirm={() => this.onRemove(value)}
          >
            <a>
              {/* 删除 */}
              <FormattedMessage id='enterpriseSetting.BackupManage.table.handle.delete' />
            </a>
          </Popconfirm>,
          <a
            onClick={() => {
              this.onDownload(value);
            }}
          >
            {/* 下载 */}
            <FormattedMessage id='enterpriseSetting.BackupManage.table.handle.install' />
          </a>,
          <a onClick={() => this.onRecover(value)}>
            {/* 恢复 */}
            <FormattedMessage id='enterpriseSetting.BackupManage.table.handle.recover' />
          </a>
        ]
      }
    ];
    const { getFieldDecorator } = form;
    const token = cookie.get('token');
    const uploadURL = `/console/enterprise/${eid}/upload-backups`;
    return (
      <ScrollerX sm={840}>
        <Card
          title={
            <Alert
              type="info"
              message={<FormattedMessage id='enterpriseSetting.BackupManage.alert.message' />}
              style={{width:500}}
            />}
          extra={
            <>
              <Upload
                showUploadList={false}
                name="file"
                accept=".gz"
                action={uploadURL}
                onChange={this.onChangeUpload}
                headers={{ Authorization: `GRJWT ${token}` }}
                disabled={uploadLoading}
              >

                <Button loading={uploadLoading} style={{ marginRight: '16px' }} icon="download">
                  <FormattedMessage id='enterpriseSetting.BackupManage.button.importBackups' />
                </Button>
              </Upload>
              <Button
                type="primary"
                onClick={this.onAddBackup}
                loading={addLoading}
                icon="plus"
              >
                <FormattedMessage id='enterpriseSetting.BackupManage.button.addBackups' />
              </Button>
            </>
          }
        >
          <Table
            loading={backupLoading}
            rowKey={(record, index) => index}
            pagination={false}
            dataSource={backups}
            columns={columns}
          />
        </Card>
        {recoverShow && (
          <Modal
            onCancel={() => {
              this.setState({ recoverBackupName: null, recoverShow: false });
            }}
            onOk={this.submitOnRecover}
            confirmLoading={recoverLoading}
            visible
            width={400}
            title={formatMessage({ id: 'enterpriseSetting.BackupManage.importBackups.title' })}
          >
            <Alert
              type="error"
              message={formatMessage({ id: 'enterpriseSetting.BackupManage.importBackups.alert' })}
            />
            <Form>
              <FormItem label={formatMessage({ id: 'enterpriseSetting.BackupManage.importBackups.form.label.password' })}>
                {getFieldDecorator('password', {
                  initialValue: '',
                  rules: [
                    { required: true, message: formatMessage({ id: 'placeholder.oauth.importBackups' }) }
                  ]
                })(
                  <Input
                    type="password"
                    placeholder={formatMessage({ id: 'placeholder.oauth.importBackups' })}
                  />
                )}
              </FormItem>
            </Form>
          </Modal>
        )}
      </ScrollerX>
    );
  }
}
