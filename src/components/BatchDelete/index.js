/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import { connect } from 'dva';
import { Button, Modal, Table, Row, Col } from 'antd';
import { reDelete } from '../../services/app';
import globalUtil from '../../utils/global';

@connect(
  ({ loading }) => ({
    batchDeleteLoading: loading.effects['appControl/putBatchDelete']
  }),
  null,
  null,
  {
    pure: false
  }
)

export default class MoveGroup extends PureComponent {
  constructor(props) {
    super(props);
    const { batchDeleteApps } = this.props;
    this.state = {
      // eslint-disable-next-line react/no-unused-state
      batchDeleteApps,
      apps: batchDeleteApps.map((item) => {
        if (item) {
          return {
            service_id: item.service_id,
            service_cname: item.service_cname,
            msg: '正在删除',
            status: 0
          };
        }
      }),
      confirm: false
    };
  }
  handleDelete = () => {
    this.setState({ confirm: true });
    const { dispatch, batchDeleteApps } = this.props;
    const ids = batchDeleteApps.map((item) => {
      return item.service_id;
    });
    dispatch({
      type: 'appControl/putBatchDelete',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        serviceIds: ids.join(',')
      },
      callback: (res) => {
        if (res) {
          this.setState({ apps: res.list });
        }
      }
    });
  };

  reDelete = (id) => {
    reDelete({
      team_name: globalUtil.getCurrTeamName(),
      service_id: id
    }).then((data) => {
      if (data) {
        const newapps = [];
        this.state.apps.map((item) => {
          if (item.service_id == id) {
            item.status = 200;
            item.msg = formatMessage({id:'notification.success.delete'});
          }
          newapps.push(item);
        });
        this.setState({ apps: newapps });
      }
    });
  };
  render() {
    const { batchDeleteLoading, onCancel } = this.props;
    const { confirm, apps } = this.state;
    return (
      <Modal
        title="确认批量删除"
        visible
        width={600}
        onCancel={onCancel}
        footer={<Button onClick={onCancel}>完成</Button>}
      >
        {confirm ? (
          <Table
            dataSource={apps || []}
            columns={[
              {
                title: '组件名称',
                dataIndex: 'service_cname'
              },
              {
                title: '反馈信息',
                dataIndex: 'msg',
                render: (val) => {
                  const map = { success: formatMessage({id:'notification.success.delete'}) };
                  return <span>{map[val] || val}</span>;
                }
              },
              {
                title: '操作',
                dataIndex: 'action',
                render: (_, data) => {
                  if (data.status == 412) {
                    return (
                      <a
                        target="_blank"
                        onClick={() => {
                          this.reDelete(data.service_id);
                        }}
                      >
                        确认删除
                      </a>
                    );
                  }
                  if (data.status == 409) {
                    return '请先关闭组件';
                  }
                  if (data.status == 200) {
                    return '已删除';
                  }
                }
              }
            ]}
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p>
              {apps && apps.length && apps[0] != undefined
                ? '即将删除以下组件'
                : '请刷新数据后删除'}
            </p>
            <Row>
              {apps.map((item) => {
                if (item == undefined) return null;
                return (
                  <Col
                    span={8}
                    key={`col${item.service_id}`}
                    style={{ overflow: 'auto' }}
                  >
                    <p key={item.service_id}>{item.service_cname}</p>
                  </Col>
                );
              })}
            </Row>
            {apps && apps.length && apps[0] !== undefined && (
              <Button
                type="primary"
                loading={batchDeleteLoading}
                onClick={this.handleDelete}
              >
                确定批量删除
              </Button>
            )}
          </div>
        )}
      </Modal>
    );
  }
}
