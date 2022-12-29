import React, { Component } from 'react';
import {
Card,
Row,
Col,
Button,
Tooltip,
Drawer,
Form,
Skeleton,
notification,
Empty
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { connect } from 'dva';
import DApvcinputSelect from '../../components/DApvcinputSelect'
import styles from "./index.less";


@connect()
@Form.create()

class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editState: true,
            showSubmit: false,
            value: false
        }
    }
    editStain = () => {
        this.setState({
            editState: false,
            showSubmit: true
        })
    }
    cancelStain = () => {
        const { form, taintsList, clusterInfo, fetTaints } = this.props;
        this.setState({
            editState: true,
            showSubmit: false
        }, () => {
            fetTaints(clusterInfo);
        })
    }
    handleSubmit = (e) => {
        e.preventDefault()
        const { form, dispatch, updataTaints } = this.props;
        var bool = true
        form.validateFields((err, value) => {
            if (value.taints.length == 1 && value.taints[0].key == "" && value.taints[0].value == "" && value.taints[0].effect == "") {
                value.taints = []
                updataTaints(value)
            } else if (value.taints.length == 1 && (value.taints[0].key == "" || value.taints[0].value == "" || value.taints[0].effect == "")) {
                bool = false
                return notification.warning({
                    message: formatMessage({ id: 'enterpriseColony.mgt.node.full' })
                });
            }
            if (value.taints.length > 1) {
                value.taints.map(item => {
                    if (item.key == "" || item.vlaue == "" || item.effect == "") {
                        bool = false
                        return notification.warning({
                            message: formatMessage({ id: 'enterpriseColony.mgt.node.full' })
                        });
                    }
                })
            }
            if (bool) {
                updataTaints(value)
            }
            this.setState({
                editState: true,
                showSubmit: false
            })
        })
    }
    removeValue = () => {
        const { remove } = this.props
        remove()
    }
    render() {
        const { editState, showSubmit } = this.state
        const { form, taintsList, showTaints } = this.props;
        const { getFieldDecorator, setFieldsValue } = form;

        const exportButton = (
            <>
                {showSubmit &&
                    <Button type="primary" icon="diff" onClick={this.handleSubmit} style={{ marginRight: 15 }}>{formatMessage({ id: 'enterpriseColony.mgt.node.submit' })}</Button>
                }
                {editState ?
                    <Button icon="form" onClick={this.editStain}>{formatMessage({ id: 'enterpriseColony.mgt.node.editStain' })}</Button>
                    :
                    <Button icon="close-circle" onClick={this.cancelStain}>{formatMessage({ id: 'enterpriseColony.mgt.node.editCancel' })}</Button>}

            </>
        )
        const bool = taintsList && taintsList.length == 1 ? true : false
        return (
            <>
                <Card
                    extra={showTaints && exportButton}
                    style={
                        { boxShadow: 'rgba(36, 46, 66, 0.16) 2px 4px 10px 0px', marginBottom: 30 }
                    }
                >
                    {showTaints ?
                        <Form onSubmit={this.handleSubmit}>
                            {(taintsList.length > 0 || !editState) ?
                                (<Form.Item >
                                    {getFieldDecorator(`taints`, {
                                        initialValue: taintsList.length > 0 ? taintsList : [],
                                        rules: [{ required: false, message: formatMessage({ id: 'enterpriseColony.mgt.node.key' }), }]
                                    })(
                                        <DApvcinputSelect
                                            editState={editState}
                                            removeShow={bool}
                                            setspan={8}
                                            removeValue={this.removeValue}
                                        />)}
                                </Form.Item>) : (
                                    <Empty />
                                )
                            }
                        </Form>
                        :
                        <Skeleton active />
                    }
                </Card>
            </>
        );
    }
}

export default Index;