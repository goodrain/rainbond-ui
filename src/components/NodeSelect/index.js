import { Button, Drawer, Select, Form, Icon, Modal, Checkbox, Row, Col, message, Spin, Divider, Radio } from 'antd';
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
function formatdada(list) {

    const cachelist = list.filter(({ status, role }) => status === 'Ready' && role.includes('edge'))
    return cachelist.map(({ name }) => ({ value: name, label: name }))
}


function NodeSelect({ ondone, form, enterpriseId, createApp, dispatch }) {

    const sytles = { paddingLeft: 20 }

    const [loading, setloadng] = useState(false)
    const [nodelist, setnodelist] = useState([])


    const [value, setvalue ]= useState(null)

    useEffect(() => {

        setloadng(true)
        getEdgeNodeList({
            // enterprise_id, regions_name
            enterprise_id: enterpriseId,
            region_name: globalUtil.getCurrRegionName()
        }).then((res) => {
            const { list } = res
            setnodelist(formatdada(list))
        }).finally(() => {
            setloadng(false)
        })

    }, [])



    const handlechange =(e)=>{
        setvalue(e.target.value)
    }


    const handleDone = () => {

        const result = value

        if (!result) {
            message.warn(formatMessage({ id: 'componentCheck.advanced.setup.edge_config.select_node' }))
            return
        }

        dispatch({
            type: 'createApp/changeEdgeNode',
            payload: {
                edge_node: result,
            },
        })
        ondone && ondone(result)
    }


    return <>
        <h3>{formatMessage({ id: 'componentCheck.advanced.setup.edge_config.select_node' })}</h3>

        <Spin spinning={loading}>
            <Row style={sytles}>
                <Radio.Group value={value} onChange={handlechange}>
                    {
                        nodelist.map(node => <Radio key={node.value} value={node.value}>{node.label}</Radio>)
                    }
                </Radio.Group>
            </Row>
            <div
                style={{
                    textAlign: "center",
                    marginBottom: 12
                }}
            >
                <Button type="primary" onClick={handleDone}>{formatMessage({ id: 'componentOverview.body.tab.env.table.column.preservation' })}</Button>
            </div>
        </Spin>

    </>
}

export default Form.create()(connect(mapStateToProps)(NodeSelect))

