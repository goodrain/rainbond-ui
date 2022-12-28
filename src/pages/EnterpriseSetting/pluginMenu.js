import { Tabs, Card, Col, Table, Button, Drawer, Form, Row, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import global from '../../utils/global'
import AddOrEditMenuForm from '../../components/AddOrEditMenuForm';
import ConfirmModal from '../../components/ConfirmModal';
import styles from './index.less'
const { TabPane } = Tabs;
@Form.create()
@connect(null, null, null)
export default class PluginMenu extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            visible: false,
            editData: {},
            isAddOrEdit: false,
            deleteMenuPath: false,
            treeData: [{ title: '顶级菜单', value: 0 }],
        }
    }
    componentDidMount(){
        this.handleGetMenuList()
    }


    handleEdit = (value) => {
        this.setState({
            visible: true,
            editData: value,
            isAddOrEdit: false,
        })
    }
    onClose = () => {
        this.setState({
            visible: false
        })
    }
    handleSubmit = (value) => {
        const { isAddOrEdit } = this.state
        if(isAddOrEdit){
            this.handleAddMenuPath(value)
        }else{
            this.handleEditMenuPath(value)
        } 
    }
    onCreateMenu = () => {
        this.setState({
            visible: true,
            isAddOrEdit: true,
        })
    }
    cancelCreateMenu = () => {
        this.setState({
            visible: false,
            editData: {}
        })
    }
    // 菜单列表
    handleGetMenuList = () => {
        const { dispatch } = this.props
        const eid = global.getCurrEnterpriseId();
        dispatch({
            type: 'global/getMenuList',
            payload: {
                enterprise_id: eid,
            },
            callback: res => {
                if (res && res.list) {
                    const { treeData } = this.state
                    const tree = [].concat(treeData)
                    const setChildren = []
                    if (res.list.length > 0) {
                        res.list.map(item => {
                            setChildren.push({ title: item.title, value: item.id })
                        })
                    }
                    tree[0].children = setChildren
                    this.setState({
                        treeData: tree,
                        menuList: res.list
                    })
                    dispatch({
                        type:'global/saveMenuListPath',
                        payload: res.list
                    })
                }
            }
        })
    }
    // 添加菜单
    handleAddMenuPath = (value) => {
        const { dispatch } = this.props
        const eid = global.getCurrEnterpriseId();
        dispatch({
            type: 'global/addMenuPath',
            payload: {
                enterprise_id: eid,
                ...value
            },
            callback: res => {
                if(res){
                    notification.success({message: '添加成功'})
                    this.setState({
                        visible: false,
                        editData: {}
                    })
                    this.handleGetMenuList()
                }
            }
        })
    }
    // 修改菜单
    handleEditMenuPath = (value) => {
        const { dispatch } = this.props
        const { editData } = this.state
        const eid = global.getCurrEnterpriseId();
        dispatch({
            type: 'global/editMenuPath',
            payload: {
                enterprise_id: eid,
                ...value,
                id: editData.id
            },
            callback: res => {
                if(res){
                    notification.success({message: '修改成功'})
                    this.setState({
                        visible: false,
                        editData: {}
                    })
                    this.handleGetMenuList()
                }
            }
        })
    }
    // 删除菜单
    handleDeleteMenuPath = () => {
        const { dispatch } = this.props
        const { menuId } = this.state
        const eid = global.getCurrEnterpriseId();
        dispatch({
            type: 'global/deleteMenuPath',
            payload: {
                enterprise_id: eid,
                id: menuId
            },
            callback: res => {
                if(res){
                    notification.success({message: '删除成功'})
                    this.handleCloseDelete()
                    this.handleGetMenuList()
                }
            }
        })
    }
    // 打开删除弹窗
    onDeleteMenu = (value)=> {
        this.setState({
            deleteMenuPath: true,
            menuId: value.id
        })
    } 
    // 取消删除
    handleCloseDelete = () => {
        this.setState({
            deleteMenuPath: false
        })
    }
    render() {
        const columns = [
            {
                title: '菜单名称',
                dataIndex: "title",
                rowKey: "title",
                width: "20%"
            },
            {
                title: '菜单链接',
                dataIndex: "path",
                rowKey: "path",
                width: "55%"
            },
            {
                title: '外链',
                dataIndex: "iframe",
                rowKey: "iframe",
                width: "10%",
                render: (val, index) => {
                    return (
                        <div>{val ? '是' : '否'}</div>
                    );
                }
            },
            {
                title: '操作',
                width: "15%",
                render: (val, index) => {
                    return (
                        <>
                            <Button
                                onClick={() => {
                                    this.handleEdit(index);
                                }}
                            >
                                编辑
                            </Button>
                            <Button
                                style={{ marginLeft:'10px' }}
                                onClick={() => {
                                    this.onDeleteMenu(index);
                                }}
                            >
                                删除
                            </Button>
                        </>
                    );
                }
            },
        ]
        const { visible, menuList, editData, isAddOrEdit, deleteMenuPath, treeData } = this.state
        const operation = (
            <Col span={4} offset={20} style={{ textAlign: 'right', marginRight: 10 }}>
                <Button
                    type="primary"
                    onClick={this.onCreateMenu}
                    className={styles.btns}
                >
                    创建菜单
                </Button>
            </Col>
        );
        return (
            <div>
                <Row
                    style={{
                        padding: '10px 0',
                    }}
                >
                    {operation}
                </Row>
                <Table
                    dataSource={menuList}
                    columns={columns}
                    pagination={false}
                    style={{ background: "#fff", marginTop: "20px" }}
                />

                {visible && 
                    <AddOrEditMenuForm 
                        editData={editData}
                        treeData={treeData}
                        isAddOrEdit={isAddOrEdit}
                        onOk={this.handleSubmit}
                        onCancel={this.cancelCreateMenu}
                    />
                }
                {deleteMenuPath &&
                    <ConfirmModal
                        onOk={this.handleDeleteMenuPath}
                        subDesc='删除此菜单、子级菜单也会删除，确定删除吗?'
                        desc='确定要删除次菜单吗？'
                        title='删除菜单'
                        onCancel={this.handleCloseDelete}
                  />
                }
            </div>
        );
    }
}

