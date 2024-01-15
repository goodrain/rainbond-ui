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
            msg: formatMessage({id:'appOverview.list.BatchDelete.delete'}),
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
        title={formatMessage({id:'appOverview.list.BatchDelete.title'})}
        visible
        width={600}
        onCancel={onCancel}
        footer={<Button onClick={onCancel}>{formatMessage({id:'applicationMarket.NewbieGuiding.complete'})}</Button>}
      >
        {confirm ? (
          <Table
            dataSource={apps || []}
            rowKey={(record,index) => index}
            columns={[
              {
                title: formatMessage({id:'appOverview.list.BatchDelete.name'}),
                dataIndex: 'service_cname'
              },
              {
                title: formatMessage({id:'appOverview.list.BatchDelete.msg'}),
                dataIndex: 'msg',
                render: (val) => {
                  const map = { success: formatMessage({id:'notification.success.delete'}) };
                  return <span>{map[val] || val}</span>;
                }
              },
              {
                title: formatMessage({id:'appOverview.list.BatchDelete.operation'}),
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
                        {formatMessage({id:'appOverview.list.BatchDelete.Confirm'})}
                      </a>
                    );
                  }
                  if (data.status == 409) {
                    return `${formatMessage({id:'appOverview.list.BatchDelete.down'})}`;
                  }
                  if (data.status == 200) {
                    return `${formatMessage({id:'appOverview.list.BatchDelete.deleted'})}`;
                  }
                }
              }
            ]}
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p>
              {apps && apps.length && apps[0] != undefined
                ? `${formatMessage({id:'appOverview.list.BatchDelete.willDeleted'})}`
                : `${formatMessage({id:'appOverview.list.BatchDelete.refresh'})}`}
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
                {formatMessage({id:'appOverview.list.BatchDelete.ConfirmDelete'})}
              </Button>
            )}
          </div>
        )}
      </Modal>
    );
  }
}
