import React, { Component } from 'react';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import { Table, Button, Modal } from 'antd';
const confirm = Modal.confirm;

@connect(({ }) => ({}))
class UserTable extends Component {
    onCancel=()=>{
        const {onCancel} = this.props
        onCancel&&onCancel()
    }
    rowKey = (record, index) => index
    render() {
        const columns = [
            {
                title: formatMessage({id:'popover.tcp.config.table.attr_name'}),
                dataIndex: 'attr_name',
                key: "attr_name",
                align: 'center',
            },
            {
                title: formatMessage({id:'popover.tcp.config.table.attr_value'}),
                dataIndex: 'attr_value',
                key: "attr_value",
                align: 'center',
            },
            {
                title: formatMessage({id:'popover.tcp.config.table.name'}),
                dataIndex: 'name',
                key: "name",
                align: 'center',
            },
        ];
        const { dataSource} = this.props;
        const dataList = dataSource.filter((item)=>{
            return (!item.attr_name.endsWith("_HOST")&&!item.attr_name.endsWith("_PORT")) ;
        })
        const footer = [<Button key="back" onClick={this.onCancel}>{formatMessage({id:'button.close'})}</Button>]
        return (
            <div>
                <Modal
                    title={formatMessage({id:'popover.tcp.config.title'})}
                    visible={this.props.visible}
                    footer={footer}
                    onCancel={this.onCancel}
                >
                    <Table
                        rowKey={this.rowKey}
                        bordered
                        columns={columns}
                        pagination={false}
                        dataSource={dataList}
                    />
                </Modal>
            </div>
        );
    }
}

export default UserTable;
