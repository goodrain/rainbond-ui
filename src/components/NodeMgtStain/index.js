import React, { Component } from 'react';
import {
Button,
Form,
Skeleton,
notification,
Empty
} from 'antd';
import { formatMessage } from '@/utils/intl';
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
        const { form, taintsList, showTaints, titleIcon, titleText } = this.props;
        const { getFieldDecorator, setFieldsValue } = form;

        const exportButton = (
            <div className={styles.buttonGroup}>
                {showSubmit &&
                    <Button type="primary" icon="diff" onClick={this.handleSubmit} style={{ marginRight: 15 }}>{formatMessage({ id: 'enterpriseColony.mgt.node.submit' })}</Button>
                }
                {editState ?
                    <Button icon="form" onClick={this.editStain}>{formatMessage({ id: 'enterpriseColony.mgt.node.editStain' })}</Button>
                    :
                    <Button icon="close-circle" onClick={this.cancelStain}>{formatMessage({ id: 'enterpriseColony.mgt.node.editCancel' })}</Button>}
            </div>
        )
        const bool = taintsList && taintsList.length == 1 ? true : false
        return (
            <>
                <div className={styles.cardContainer}>
                    <div className={styles.cardHeader}>
                        <div className={styles.titleStyle}>
                            <span>{titleIcon}</span>
                            <span>{titleText}</span>
                        </div>
                        {showTaints && exportButton}
                    </div>
                    <div className={styles.cardBody}>
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
                    </div>
                </div>
            </>
        );
    }
}

export default Index;