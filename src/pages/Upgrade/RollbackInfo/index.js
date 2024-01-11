import styles from '@/components/CreateTeam/index.less';
import { Button, Form, Modal, Table } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { getRollsBackRecordList } from '../../../services/app';
import handleAPIError from '../../../utils/error';
import styless from '../index.less';
import infoUtil from '../UpgradeInfo/info-util';

@connect()
@Form.create()
export default class rollsBackRecordList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      recordLoading: false
    };
  }
  componentDidMount() {
    this.fetchRollsBackRecordList();
  }

  handleSubmit = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        onOk(vals);
      }
    });
  };
  handleLoading = recordLoading => {
    this.setState({
      recordLoading
    });
  };

  fetchRollsBackRecordList = () => {
    const { team_name, group_id, info } = this.props;
    this.handleLoading(true);
    getRollsBackRecordList({
      team_name,
      group_id,
      record_id: info.ID,
      noModels: true
    })
      .then(res => {
        this.setState({
          list: res.list || [],
          recordLoading: false
        });
      })
      .catch(err => {
        handleAPIError(err);
      });
  };

  render() {
    const { onCancel, loading = false, showRollbackDetails } = this.props;
    const { recordLoading, list } = this.state;
    const columns = [
      {
        title: '创建时间',
        dataIndex: 'create_time',
        key: '1',
        width: 200,
        render: text => <span>{text}</span>
      },
      {
        title: '应用模版名称',
        dataIndex: 'group_name',
        key: '2',
        width: '20%',
        render: text => <span>{text}</span>
      },
      {
        title: '版本',
        dataIndex: 'version',
        key: '3',
        width: '30%',
        render: (_, record) => (
          <div>
            回滚到<span className={styless.versions}>{record.version}</span>
          </div>
        )
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: '4',
        width: '15%',
        render: status => <span>{infoUtil.getStatusText(status)}</span>
      },
      {
        title: '详情',
        dataIndex: 'ID',
        key: '45',
        render: (_, item) => (
          <a
            onClick={() => {
              showRollbackDetails(item);
            }}
          >
            详情
          </a>
        )
      }
    ];
    return (
      <Modal
        visible
        title="回滚记录"
        width={1024}
        confirmLoading={loading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        footer={[
          <Button style={{ marginTop: '20px' }} onClick={onCancel}>
            关闭
          </Button>
        ]}
      >
        <Table
          loading={recordLoading}
          columns={columns}
          dataSource={list}
          pagination={false}
        />
      </Modal>
    );
  }
}
