import React, { PureComponent } from 'react';
import { Button, Table, Modal, Tooltip } from 'antd';
import styless from '../CreateTeam/index.less';
import globalUtil from '../../utils/global';
import { Link } from 'dva/router';

class RelyComponentModal extends PureComponent {
  render() {
    const { title, onOk, onCancel, relyComponentList, loading } = this.props;
    return (
      <Modal
        width={800}
        title={title}
        visible
        onOk={onOk}
        onCancel={onCancel}
        className={styless.TelescopicModal}
        footer={[
          <Button onClick={onCancel}> 关闭 </Button>,
        ]}
      >
        <Table
          pagination={false}
          style={{marginBottom:'20px'}}
          columns={[
            {
              title: '存储名称',
              dataIndex: 'volume_name',
              width: '50%',
              key: 'volume_name',
            },
            {
              title: '组件名称',
              dataIndex: 'service_name',
              key: 'service_name',
              width: '50%',
              render: (data, item) => (
                <Tooltip title={data} key={data}>
                  <Link
                    to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                      item.service_alias
                    }/overview`}
                    title={data}
                  >
                    <span>{data}</span>
                  </Link>
                </Tooltip>
              ),
            },
          ]}
          dataSource={relyComponentList}
        />
      </Modal>
    );
  }
}

export default RelyComponentModal;
