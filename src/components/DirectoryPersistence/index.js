import React, { Component } from 'react';
import { connect } from 'dva';
import {
    Modal,
    Button,
    Tree,
    Row,
    Col,
    Empty,
    Tooltip,
    Icon,
    Upload,
    Popconfirm,
    Select,
    Spin,
    notification
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../utils/global'
import download from '@/utils/download';
import apiconfig from '../../../config/api.config';
import SVG from './svg';
import styles from './index.less';

const { TreeNode, DirectoryTree } = Tree;
@connect(
    ({ appControl }) => ({
        appDetail: appControl.appDetail,
    })
)

class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            treeData: [],
            selectedKeys: [],
            expandedKeys: [],
            pathArr: [],
            keyArr: [],
            dowloadArr: [],
            path: '',
            podsList: [],
            selectDefaultValue: '',
            hostPath: this.props && this.props.hostPath,
            selectLoading: false,
            treeDataLoading: false,
            loadedKeys: [],
            userName: '',
            showDataLoading: false,
            nameSpace: '',
            containerName: ''
        }
    }
    componentDidMount() {
        this.fetchInstanceInfo()
        this.fetchUserInfo()
    }
    // 获取用户信息
    fetchUserInfo = () => {
        this.props.dispatch({
            type: 'user/fetchCurrent',
            callback: res => {
                if (res) {
                    this.setState({
                        userName: res.bean.user_name
                    })
                }
            },
        });
    }
    // 获取podname
    fetchInstanceInfo = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'appControl/fetchPods',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appAlias,
            },
            callback: res => {
                if (res && res.list) {
                    this.setState({
                        podsList: res.list.new_pods,
                        selectDefaultValue: res.list.new_pods && res.list.new_pods[0] && res.list.new_pods[0].pod_name,
                        containerName: res.list.new_pods && res.list.new_pods[0] && res.list.new_pods[0].container[0] && res.list.new_pods[0].container[0].container_name,
                        selectLoading: true
                    }, () => {
                        if (this.props.isType) {
                            this.determineStorageType()
                        } else {
                            this.getListFiles()
                        }
                    })
                }
            }
        });
    };
    // 获取文件类型
    determineStorageType = () => {
        this.props.dispatch({
            type: 'appControl/determineStorageType',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id: this.props.appAlias,
                region_name: globalUtil.getCurrRegionName(),
                pod_name: this.state.selectDefaultValue,
                namespace: this.props.appDetail && this.props.appDetail.service && this.props.appDetail.service.namespace,
                volume_path: this.props && this.props.volumePath,
            },
            callback: res => {
                if (res) {
                    this.setState({
                        hostPath: res.bean,
                    }, () => {
                        this.getListFiles( true )
                    })
                }
            }
        });
    };
    // 获取文件列表
    getListFiles = ( bool = false ) => {
        this.props.dispatch({
            type: 'appControl/getListFiles',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id: this.props.appAlias,
                region_name: globalUtil.getCurrRegionName(),
                pod_name: this.state.selectDefaultValue,
                host_path: this.state.hostPath,
                container_name: this.state.containerName,
                extend_method: this.props.appDetail && this.props.appDetail.service && this.props.appDetail.service.extend_method
            },
            callback: res => {
                if (res && res.bean) {
                    this.setState({
                        nameSpace: res.bean.namespace
                    })
                }
                if (res && res.list) {
                    res.list.map((item, index) => {
                        item.key = index,
                            item.isLeaf = item.is_leaf
                    })
                    const downOruploadPath = `${window.location.protocol}${res.bean && res.bean.ws_url && res.bean.ws_url.substring(res.bean.ws_url.indexOf("/"))}`
                    this.setState({
                        treeData: res.list,
                        showData: this.sortShowData(res.list),
                        treeDataLoading: true,
                        downOrUploadPath: downOruploadPath,
                        showDataLoading: true
                    })
                }
            },
            handleError: res => {
                if (res) {
                    notification.error({ message: formatMessage({ id: 'componentOverview.body.DirectoryPersistence.error' }) });
                    this.setState({
                        showData: [],
                        treeData: [],
                        showDataLoading: true
                    })
                }
            }
        });
    }
    // 加载树图
    onLoadData = treeNode =>
        new Promise(resolve => {
            if (treeNode.props.children) {
                resolve();
                return;
            }
            this.setState({
                showDataLoading: false
            })
            setTimeout(() => {
                this.props.dispatch({
                    type: 'appControl/getListFiles',
                    payload: {
                        team_name: globalUtil.getCurrTeamName(),
                        group_id: this.props.appAlias,
                        region_name: globalUtil.getCurrRegionName(),
                        pod_name: this.state.selectDefaultValue,
                        container_name: this.state.containerName,
                        host_path: `${this.state.hostPath}/${this.state.path}`,
                        extend_method: this.props.appDetail && this.props.appDetail.service && this.props.appDetail.service.extend_method
                    },
                    callback: res => {
                        if (res) {
                            if (res.list && res.list.length == 0) {
                                this.setState({
                                    treeData: [...this.state.treeData],
                                    showData: this.sortShowData(res.list),
                                    showDataLoading: true
                                });
                                treeNode.props.dataRef.children = []
                                resolve();
                            } else {
                                const arr = res.list
                                arr.map((item, index) => {
                                    item.key = `${treeNode.props.eventKey}-${index}`
                                    item.isLeaf = item.is_leaf
                                })
                                treeNode.props.dataRef.children = arr
                                this.setState({
                                    treeData: [...this.state.treeData],
                                    showData: this.sortShowData(res.list),
                                    showDataLoading: true
                                });
                                resolve();
                            }
                        }
                    }
                });
            }, 100)
        });
    // 渲染函数
    renderTreeNodes = data =>
        data && data.map((item, index) => {
            if (item.isLeaf) {
                return (
                    <TreeNode title={item.title} key={item.key} dataRef={item} >
                        {this.renderTreeNodes(item.children)}
                    </TreeNode>
                );
            }
            return null;
        });
    //选择树节点 
    onSelect = (selectedKeys, info) => {
        // 选择为空时直接return
        if (selectedKeys && selectedKeys.length == 0) {
            return null
        }
        if (info) {
            const { selectedNodes } = info
            const { props } = selectedNodes[0]
            const { dataRef } = props
            this.setState({
                selectedKeys: selectedKeys,
                expandedKeys: this.state.expandedKeys.includes(selectedKeys[0]) ? [...this.state.expandedKeys] : [...this.state.expandedKeys, ...selectedKeys],
                showData: this.sortShowData(dataRef.children) || this.sortShowData(this.state.showData),
                dowloadArr: [],
                pathArr: [],
                path: ''
            }, () => {
                this.getPath()
            })
        } else {
            this.setState({
                selectedKeys: selectedKeys,
                expandedKeys: this.state.expandedKeys.includes(selectedKeys[0]) ? [...this.state.expandedKeys] : [...this.state.expandedKeys, ...selectedKeys],
                dowloadArr: [],
                pathArr: [],
                path: ''
            }, () => {
                this.getPath()
            })
        }
    }
    onLoad = (loadedKeys) => {
        this.setState({
            loadedKeys: loadedKeys
        })
    }
    // 展开树图
    onExpand = (expandedKeys, info) => {
        let newLoadKeys = this.state.loadedKeys
        if (this.state.expandedKeys.length > expandedKeys.length) {
            //  当是收起的时候，把这个收起的节点从loadedKeys中移除
            newLoadKeys = this.state.loadedKeys.filter((i) => expandedKeys.includes(i))
        }
        this.setState({
            expandedKeys: expandedKeys,
            selectedKeys: [`${info.node.props.dataRef.key}`],
            showData: this.sortShowData(info.node.props.dataRef.children),
            loadedKeys: newLoadKeys
        }, () => {
            this.getPath()
        })
    };
    // 获取后缀名
    getSvgIcon = (name) => {
        if (name) {
            const str = name.substr(name.lastIndexOf('.') + 1)
            return `${str}`
        }
    }
    // 鼠标点击
    folderClick = (data) => {
        // 判断data数据是否有孩子，如果没有就加载，如果有就
        if (data && data.children && data.children.length > 0) {
            this.setState({
                expandedKeys: [...this.state.expandedKeys, ...[`${data.key}`]],
                selectedKeys: [`${data.key}`],
                showData: this.sortShowData(data.children),
                dowloadArr: []
            }, () => {
                this.getPath()
            })
        } else {
            this.setState({
                expandedKeys: [...this.state.expandedKeys, ...[`${data.key}`]],
                selectedKeys: [`${data.key}`],
                dowloadArr: []
            }, () => {
                this.getPath()
            })
        }
    }
    //递归获取Showdata数据 
    getShowData = (datas) => {
        const { selectedKeys } = this.state
        datas.map(item => {
            const { key, children } = item
            if (key == selectedKeys[0]) {
                this.setState({
                    showData: this.sortShowData(datas)
                })
            }
            if (children && children.length > 0) {
                this.getShowData(children)
            }
        })
    }
    // 获取key值的path数据
    getPathData = (data) => {
        const { treeData, keyArr } = this.state
        data.map(item => {
            const { title, children } = item
            if (keyArr.indexOf(`${item.key}`) != -1) {
                const arr = this.state.pathArr
                arr.push(title)
                this.setState({
                    pathArr: arr
                })
            }
            if (children && children.length > 0) {
                this.getPathData(children)
            }
        })
    }
    //递归获取path数据 
    getPath = () => {
        const { selectedKeys, treeData, pathArr } = this.state
        if (selectedKeys.length == 0) {
            this.setState({
                path: ''
            })
            return
        }
        if (selectedKeys && selectedKeys[0]) {
            const str = selectedKeys[0]
            const arr = str.split("-")
            const keyArr = []
            for (let index = 0; index < arr.length + 1; index++) {
                const newarr = arr.slice(0, index)
                const newstr = newarr.join("-")
                keyArr.push(newstr)
            }
            keyArr.shift();
            this.setState({
                keyArr: keyArr,
                pathArr: []
            }, () => {
                this.getPathData(treeData)
            })
            setTimeout(() => {
                const path = this.state.pathArr.join("/")
                this.setState({
                    path: path
                })
            }, 100)
        }
    }
    // 返回上一级
    goBack = () => {
        const { selectedKeys } = this.state
        // 如果选择为空，则展示所有数据
        if (selectedKeys[0] == undefined) {
            return
        }
        // 如果选择有值且值不大于1
        if ((selectedKeys[0]).indexOf("-") == -1) {
            this.setState({
                selectedKeys: [],
                showData: this.sortShowData(this.state.treeData),
                dowloadArr: []
            }, () => {
                this.getPath()
            })
            // 如果选择有值且值大于1
        } else {
            this.getShowData(this.state.treeData)
            this.setState({
                selectedKeys: [`${selectedKeys[0].substring(0, (selectedKeys[0]).lastIndexOf("-"))}`],
                dowloadArr: []
            }, () => {
                this.getPath()
            })
        }
    }
    // 下载
    dowloadTitle = (val) => {
        const { dowloadArr } = this.state
        setTimeout(() => {
            if (dowloadArr.includes(val)) {
                const arr = []
                dowloadArr.map(item => {
                    if (item != val) {
                        arr.push(item)
                    }
                })
                this.setState({
                    dowloadArr: [...arr]
                })
            } else {
                const arr = []
                arr.push(val)
                this.setState({
                    dowloadArr: [...this.state.dowloadArr, ...arr]
                })
            }
        }, 10)
    }
    // 下拉框选择
    selectChange = (val) => {
        this.setState({
            selectDefaultValue: val
        }, () => {
            this.getListFiles()
        })
    }
    fileDownload = () => {
        const { dowloadArr } = this.state
        if (dowloadArr.length == 0) {
            notification.info({ message: formatMessage({ id: 'componentOverview.body.DirectoryPersistence.download' }) });
        } else {
            dowloadArr.map(item => {
                this.fileDownloadApi(item)
            })
        }
        setTimeout(() => {
            this.setState({
                dowloadArr: []
            })
        }, 100)
    }
    // 下载接口
    fileDownloadApi = (title) => {
        const { downOrUploadPath, nameSpace, containerName } = this.state
        const dowloadPath = this.state.path ? `${this.state.hostPath}/${encodeURIComponent(this.state.path)}` : `${this.state.hostPath}`;
        var dowloadString = dowloadPath.replace(/\/+$/, "");
        const path = `${downOrUploadPath}/v2/file-operate/download/${encodeURIComponent(title)}?path=${dowloadString}&pod_name=${this.state.selectDefaultValue}&namespace=${nameSpace}&fileName=${encodeURIComponent(title)}&container_name=${containerName}`
        download(`${path}`, title, {}, true)
    }
    uploadChange = info => {
        const { path, selectedKeys } = this.state
        if (info && info.file && info.file.status === 'done') {
            notification.success({ message: formatMessage({ id: 'notification.success.upload' }) });
            if (selectedKeys[0] == undefined) {
                this.getListFiles()
            } else {
                this.updateTree()
            }
        } else if (info && info.file && info.file.status === 'error') {
            notification.error({ message: formatMessage({ id: 'notification.error.update' }) });
            if (selectedKeys[0] == undefined) {
                this.getListFiles()
            } else {
                this.updateTree()
            }
        }
    };
    updateTree = () => {
        const { selectedKeys, expandedKeys, loadedKeys, treeData } = this.state
        // 获取新的expandedKeys数组，不包含该节点及子节点
        const newExpandedKeys = expandedKeys.filter(item => {
            return item.indexOf(selectedKeys[0]) == -1
        })
        // 获取新的loadedKeys数组，不包含该节点及子节点
        const newLoadedKeys = loadedKeys.filter(item => {
            return item.indexOf(selectedKeys[0]) == -1
        })
        const newTreedata = treeData
        this.setState({
            expandedKeys: [...newExpandedKeys, ...[`${selectedKeys[0]}`]],
            loadedKeys: [...newLoadedKeys],
            treeData: this.removeShowData(newTreedata),
            selectedKeys: [`${selectedKeys[0]}`],
        })
    }
    // 获取新的treeData数据
    removeShowData = (datas) => {
        const { selectedKeys } = this.state
        const newData = datas;
        function setGrayNode(data) { 
            for (var i = 0; i < data.length; i++) {
                if (data[i].key == selectedKeys[0]) {
                    delete data[i].children
                    continue;
                } else {
                    if (data[i].children) {
                        setGrayNode(data[i].children);
                    }
                }
            }
        }
        setGrayNode(newData)
        return newData;
    }
    sortShowData = (array) => {
        const isFile = (array && array.length > 0) ? array.filter(item => { return item.title.indexOf('.') == -1 }) : []
        const notFile = (array && array.length > 0) ? array.filter(item => { return item.title.indexOf('.') != -1 }) : []
        const folder = []
        isFile.map((item, index) => {
            if (item.isLeaf == true) {
                folder.unshift(item)
            } else {
                folder.push(item)
            }
        })
        // 对文件进行归类
        const groups = notFile.reduce((accumulator, currentValue) => {
            const title = (currentValue.title).substring(currentValue.title.lastIndexOf("."));
            if (!accumulator[title]) {
                accumulator[title] = [];
            }
            accumulator[title].push(currentValue);
            return accumulator;
        }, {});
        function sortObjectProps(obj) {
            const propArr = [];
            for (let prop in obj) {
                propArr.push([prop, obj[prop]]);
            }
            propArr.sort((a, b) => b[1].length - a[1].length);
            return propArr.reduce((arr, prop) => arr.concat(prop[1]), []);
        }
        const valuesArray = sortObjectProps(groups)
        const showDataArr = [...folder, ...valuesArray]
        return showDataArr
    }
    render() {
        const {
            selectedKeys,
            expandedKeys,
            showData,
            path,
            dowloadArr,
            podsList,
            selectDefaultValue,
            selectLoading,
            treeDataLoading,
            hostPath,
            loadedKeys,
            downOrUploadPath,
            userName,
            showDataLoading,
            containerName,
            nameSpace
        } = this.state
        const { volumeName } = this.props
        const upLoadPath = this.state.path ? `${this.state.hostPath}/${this.state.path}` : `${this.state.hostPath}`;
        var uploadString = upLoadPath.replace(/\/+$/, "");
        const upload = `${downOrUploadPath}/v2/file-operate/upload`
        const props = {
            action: upload,
            data: {
                path: uploadString,
                container_name: containerName,
                pod_name: selectDefaultValue,
                namespace: nameSpace,
                user_name: userName,
                tenant_id: this.props.appDetail && this.props.appDetail.service && this.props.appDetail.service.tenant_id,
                service_id: this.props.appDetail && this.props.appDetail.service && this.props.appDetail.service.service_id,
                volume_name: volumeName
            },
            method: "post",
            name: 'file',
        };
        return (
            <div>
                <Modal
                    className={styles.ModalStyle}
                    title={<>
                        {formatMessage({ id: 'componentOverview.body.DirectoryPersistence.example' })}
                        <Select
                            value={selectDefaultValue}
                            style={{ maxWidth: 184, marginLeft: 5 }}
                            onChange={this.selectChange}
                            loading={!selectLoading}
                        >
                            {podsList && podsList.length > 0 &&
                                podsList.map(item => {
                                    return <Select.Option value={item.pod_name}>{item.pod_name}</Select.Option>
                                })
                            }
                        </Select>
                    </>}
                    visible={true}
                    width={1000}
                    closable={false}
                    footer={
                        <>
                            <Upload
                                {...props}
                                showUploadList={false}
                                multiple
                                onChange={this.uploadChange}
                            >
                                <Button type="primary" style={{ marginRight: 10 }}>
                                    <Icon type="upload" /> {formatMessage({ id: 'applicationMarket.Offline.upload' })}
                                </Button>
                            </Upload>
                            <Button type="primary" onClick={this.fileDownload}>
                                <Icon type="download" />
                                {formatMessage({ id: 'button.download' })}
                            </Button>
                            <Button onClick={this.props.isShow}>
                                {formatMessage({ id: 'popover.cancel' })}
                            </Button>
                        </>
                    }
                >
                    {treeDataLoading ? (
                        <Row>
                            <Col span={6}>
                                <Tree
                                    loadData={this.onLoadData}
                                    onSelect={this.onSelect}
                                    selectedKeys={selectedKeys}
                                    onExpand={this.onExpand}
                                    expandedKeys={expandedKeys}
                                    switcherIcon={<Icon type="down" />}
                                    onLoad={this.onLoad}
                                    loadedKeys={loadedKeys}
                                >
                                    {this.renderTreeNodes(this.state.treeData)}
                                </Tree>
                            </Col>
                            <Col span={18} style={{ position: 'relative' }}>
                                <div className={styles.goBack}>
                                    <button onClick={this.goBack}>{SVG.getSvg("goBack", 12)}{formatMessage({ id: 'componentOverview.body.DirectoryPersistence.return' })}</button>
                                </div>
                                {showDataLoading ? (
                                    <div className={styles.iconShow}>
                                        {showData && showData.length > 0 ? (
                                            showData.map((item, index) => {
                                                const { title, isLeaf } = item
                                                if (isLeaf) {
                                                    return <div className={styles.outerLayer} style={{ cursor: "pointer" }} onDoubleClick={() => this.folderClick(item)}>
                                                        <div>
                                                            {SVG.getSvg('file', 70)}
                                                        </div>
                                                        <div>
                                                            <Tooltip placement="top" title={item.title}>
                                                                {item.title}
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                } else {
                                                    return <div className={styles.outerLayer} onClick={() => this.dowloadTitle(item.title)} style={{ background: dowloadArr.includes(item.title) ? "#e6f7ff" : '#fff' }}>
                                                        <div>
                                                            {SVG.getSvg(this.getSvgIcon(title), 70)}
                                                        </div>
                                                        <div>
                                                            <Tooltip placement="top" title={item.title}>
                                                                {item.title}
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                }
                                            })
                                        ) : (
                                            <Empty className={styles.emptyStyle} />
                                        )}
                                    </div>
                                ) : (
                                    <Spin size="large" style={{
                                        width: '100%',
                                        height: 400,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }} />
                                )}
                            </Col>
                        </Row>
                    ) : (
                        <Spin size="large" style={{
                            width: '100%',
                            height: 400,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }} />
                    )}

                </Modal>
            </div>
        );
    }
}

export default Index;

