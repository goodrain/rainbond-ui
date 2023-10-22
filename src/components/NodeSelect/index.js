import { Button, Drawer, Select, Form, Icon, Modal, Checkbox, Row, Col, message, Spin, Divider } from 'antd';
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


// const testnode = (new Array(4).fill(null)).map((_, index) => {
//     return {
//         value: `node${index}`,
//         label: `node${index}`
//     }
// })

function NodeSelect({ ondone, form, enterpriseId, createApp, dispatch }) {

    // const { getFieldDecorator } = form

    // const [open, setopen] = useState(false)

    // const handleclick = () => setopen(true)

    const sytles = { paddingLeft: 20 }

    const [loading, setloadng] = useState(false)
    const [nodelist, setnodelist] = useState([])

    const [config, setconfig] = useState({
        indeterminate: false,
        checked: false,
        nodes: []
    })

    const { nodes, ...props } = config


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

    const handleChange = (checkedVal) => {
        setconfig({
            indeterminate: checkedVal.length < nodelist.length && checkedVal.length > 0,
            checked: checkedVal.length === nodelist.length,
            nodes: checkedVal
        })
    }
    const handleAll = (e) => {
        const checked = e.target.checked
        setconfig({
            indeterminate: false,
            checked,
            nodes: checked ? nodelist.map(i => i.value) : []
        })

    }

    const handleDone = () => {

        const result = nodes[0]

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
                <Col span={24}>
                    <Checkbox {...props} onChange={handleAll}>{formatMessage({ id: 'componentOverview.body.tab.BatchDeleteChart.all' })}</Checkbox>

                </Col>

                <Col span={24}>
                    <Divider />
                    <Checkbox.Group value={nodes} options={nodelist} onChange={handleChange} />
                </Col>
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

