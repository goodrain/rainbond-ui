import React, { Component } from 'react';
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
                title: '变量名',
                dataIndex: 'attr_name',
                key: "attr_name",
                align: 'center',
            },
            {
                title: '变量值',
                dataIndex: 'attr_value',
                key: "attr_value",
                align: 'center',
            },
            {
                title: '说明',
                dataIndex: 'name',
                key: "name",
                align: 'center',
            },
        ];
        const { dataSource} = this.props;
        const dataList = dataSource.filter((item)=>{
            return (!item.attr_name.endsWith("_HOST")&&!item.attr_name.endsWith("_PORT")) ;
        })
        const footer = [<Button key="back" onClick={this.onCancel}>关闭</Button>]
        return (
            <div>
                <Modal
                    title="连接信息"
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
