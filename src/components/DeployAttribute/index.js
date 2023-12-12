import React, { Component } from 'react'
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { Card, Row, Col, Empty, Select } from 'antd';
import globalUtil from '../../utils/global';
import styles from './index.less'

const { Option } = Select;
@connect(null, null, null, { withRef: true })
export default class DeployAttribute extends Component {
    constructor(props) {
        super(props)
        this.state = {
            localImageTags: [],
            changeFlag: false,
            localValue: '',
            tag: ''
        }
    }

    // 获取本地列表选择的镜像
    handleChangeLocalValue = (value) => {
        this.setState({
            localValue: value
        }, () => {
            this.handleGetImageTags(value)
        })
    }

    // 获取本地列表选择的镜像的Tag
    handleChangeLocalTag = (value) => {
        this.setState({
            tag: value
        })
    }

    // 获取本地镜像的Tags
    handleGetImageTags = (imageValue) => {
        const { dispatch } = this.props
        dispatch({
            type: 'createApp/getImageTags',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                repository: imageValue,
            },
            callback: data => {
                if (data) {
                    this.setState({
                        localImageTags: data.list
                    });
                }
            }
        })
    }
    // 更改状态
    onChangeFlag = () => {
        this.setState({
            changeFlag: true
        })
    }
    // 取消更改状态
    onCancelFlag = () => {
        this.setState({
            changeFlag: false
        })
    }
    // 保存镜像
    saveImage = () => {
        const { dispatch, handleDeployAttribute, value, indexKey, saveChildData } = this.props
        const { localValue, tag } = this.state
        const imageName = `${localValue}:${tag}`
        value.image = imageName
        saveChildData(indexKey, imageName)
        this.setState({
            changeFlag: false
        })
    }
    render() {
        const { value, typeHelm, localImageList } = this.props
        const { changeFlag, localImageTags, localValue, tag } = this.state
        return (
            <Card
                title={formatMessage({ id: 'enterpriseColony.import.recognition.tabs.deploy' })}
                className={styles.deployCard}
                style={{
                    marginBottom: 16,
                    borderRadius: 5,
                    boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
                }}>

                {value && Object.keys(value).length > 0 ? (
                    <>
                        <Row className={styles.row_bottom} type='flex'>
                            <Col span={2} className={styles.title}>
                                {formatMessage({ id: 'enterpriseColony.import.recognition.tabs.deploy.type' })}
                            </Col>
                            <Col className={styles.value}>
                                {value.resource_type ? value.resource_type : '-'}
                            </Col>
                        </Row>
                        <Row className={styles.row_bottom}>
                            <Col span={2} className={styles.title}>
                                {formatMessage({ id: 'enterpriseColony.import.recognition.tabs.deploy.instance' })}
                            </Col>
                            <Col className={styles.value}>
                                {value.replicas ? value.replicas : 0}
                            </Col>
                        </Row>
                        <Row className={styles.row_bottom}>
                            <Col span={2} className={styles.title}>
                                {formatMessage({ id: 'enterpriseColony.import.recognition.tabs.deploy.memory' })}
                            </Col>
                            <Col className={styles.value}>
                                {(value.memory != null && value.memory === 0) ? formatMessage({ id: 'enterpriseColony.import.recognition.tabs.deploy.unlimited' }) : value.memory}M
                            </Col>
                        </Row>
                        <Row className={styles.row_bottom}>
                            <Col span={2} className={styles.title}>
                                {formatMessage({ id: 'enterpriseColony.import.recognition.tabs.deploy.cpu' })}
                            </Col>
                            <Col className={styles.value}>
                                {(value.cpu != null && value.cpu === 0) ? formatMessage({ id: 'enterpriseColony.import.recognition.tabs.deploy.unlimited' }) : value.cpu >= 1000 ? ((value.cpu / 1000).toFixed(2)) : (value.cpu)}
                                {value.cpu >= 1000 ? 'c' : 'm'}
                            </Col>
                        </Row>
                        <Row className={styles.row_bottom}>
                            <Col span={2} className={styles.title}>
                                {formatMessage({ id: 'enterpriseColony.import.recognition.tabs.deploy.image' })}
                            </Col>
                            {!changeFlag ? (
                                <Col className={styles.value}>
                                    {value.image}
                                    <span onClick={this.onChangeFlag}>
                                        {formatMessage({ id: 'button.change' })}
                                    </span>
                                </Col>
                            ) : (
                                <Col className={styles.value}>
                                    <Select defaultValue={localValue} style={{ width: 600 }} onChange={this.handleChangeLocalValue}>
                                        {localImageList && localImageList.length > 0 && localImageList.map((item, index) => {
                                            return (
                                                <Option value={item} key={index}>{item}</Option>
                                            )
                                        })}
                                    </Select> ：
                                    <Select defaultValue={tag} style={{ width: 200 }} disabled={!localValue} onChange={this.handleChangeLocalTag}>
                                        {localImageTags && localImageTags.length > 0 && localImageTags.map((item, index) => {
                                            return (
                                                <Option value={item} key={index}>{item}</Option>
                                            )
                                        })}
                                    </Select>
                                    <span onClick={this.onCancelFlag}>
                                        {formatMessage({ id: 'button.cancel' })}
                                    </span>
                                    <span onClick={this.saveImage}>
                                        {formatMessage({ id: 'button.save' })}
                                    </span>
                                </Col>
                            )}
                        </Row>
                    </>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}

            </Card>
        )
    }
}