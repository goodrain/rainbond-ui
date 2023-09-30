import { Button, Drawer, Select, Form, Icon } from 'antd';
import React, { memo, useState, useEffect } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { getEdgeNodeList } from '@/services/app'
import globalUtil from '../../utils/global';
import { connect } from 'dva';

// 获取enterprise_id
const mapStateToProps = (state) => {
    return {
        enterpriseId: state.user.currentUser.enterprise_id,
    };
};


// 过滤出可选择的边缘节点
function formatdada(list) {

    const cachelist = list.filter(({ status, role }) => status === 'Ready' && role.includes('edge'))
    return cachelist.map(({ name }) => ({ key: name, label: name }))
}

function NodeSelect({ ondone, form, enterpriseId }) {

    const { getFieldDecorator } = form

    const [open, setopen] = useState(false)

    const handleclick = () => setopen(true)

    const handledone = () => {
        form.validateFields((err, values) => {
            if (err) {
                return console.err(err);
            }
            console.log('values', values)
            setopen(false)
            ondone && ondone(values?.node || "")
        })
    }
    const [loading, setloadng] = useState(false)
    const [nodelist, setnodelist] = useState([])
    useEffect(() => {
        if (open) {
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
        }
    }, [open])

    return <>

        <div
            style={{
                textAlign: 'right',
                marginBottom: 12
            }}
        >

            <Button onClick={handleclick} >
                <Icon type="plus" />
                选择节点</Button>
        </div>
        <Drawer visible={open}
            width={500}
            title='选择节点'
            closable={false}
            maskClosable={false}
            style={{
                height: '100%',
                overflow: 'auto',
                paddingBottom: 53
            }}

        >
            <Form>
                <Form.Item label='选择节点' name="node" rule={[{ require: true }]}>
                    {
                        getFieldDecorator("node", {
                            rules: [{ required: true, message: '所选节点不能为空!' }],
                        })(<Select loading={loading}>
                            {
                                nodelist.map(({ key, label }) => <Select.Option value={key}>{label}</Select.Option>)
                            }
                        </Select>)
                    }

                </Form.Item>
                <div
                    style={{
                        borderTop: '1px solid #e8e8e8',
                        padding: '10px 16px',
                        textAlign: 'right',
                        background: '#fff',
                        borderRadius: '0 0 4px 4px',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        zIndex: 99999
                    }}
                >
                    <Button
                        style={{
                            marginRight: 8
                        }}
                        onClick={() => setopen(false)}
                    >
                        <FormattedMessage id='button.cancel' />
                    </Button>
                    <Button onClick={handledone} type="primary">
                        <FormattedMessage id='button.determine' />
                    </Button>
                </div>
            </Form>
        </Drawer>
    </>
}

export default Form.create()(connect(mapStateToProps)(NodeSelect))

