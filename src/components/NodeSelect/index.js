import { Button, Drawer, Select, Form, Icon, Modal, Checkbox, Row, Col, message, Spin, Divider, Radio, Empty } from 'antd';
import React, { memo, useState, useEffect } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { getEdgeNodeList } from '@/services/app'
import globalUtil from '../../utils/global';
import { connect } from 'dva';

// 获取enterprise_id
const mapStateToProps = (state) => {
    return {
        enterpriseId: state.user.currentUser.enterprise_id,
        createApp: state.createApp,
    };
};

// 过滤出可选择的边缘节点
function formatData(list) {
    const cachelist = list.filter(({ status, role }) => status === 'Ready' && role.includes('edge'))
    return cachelist.map(({ name }) => ({ value: name, label: name }))
}

function NodeSelect({ ondone, enterpriseId, dispatch }) {

    const styles = { paddingLeft: 20 }

    const [loading, setLoadng] = useState(false)
    const [nodelist, setNodeList] = useState([])
    const [isNode, setIsNode] = useState(false)
    const [value, setValue] = useState(null)
    
    const handlechange = (e) => {
        setValue(e.target.value)
    }

    const handleDone = () => {

        const result = value
        dispatch({
            type: 'createApp/changeEdgeNode',
            payload: {
                edge_node: result,
            },
        })
        ondone && ondone(result)
    }
    useEffect(() => {
        handleDone(); 
    }, [value]);

    useEffect(() => {
        setLoadng(true)
        getEdgeNodeList({
            enterprise_id: enterpriseId,
            region_name: globalUtil.getCurrRegionName()
        }).then((res) => {
            const { list } = res
            setNodeList(formatData(list))
            if (formatData(list).length > 0) {
                setIsNode(true);
            }
        }).finally(() => {
            setLoadng(false)
        })
    }, [])

    return <>
        {isNode ?
            <Spin spinning={loading}>
                <Row style={styles}>
                    <Radio.Group value={value} onChange={handlechange}>
                        {
                            nodelist.map(node => <Radio key={node.value} value={node.value}>{node.label}</Radio>)
                        }
                    </Radio.Group>
                </Row>
            </Spin> :
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        }
    </>
}

export default Form.create()(connect(mapStateToProps)(NodeSelect))

