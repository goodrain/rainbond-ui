/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Button, Modal, Table, Row, Col, Icon, Tag, Badge, Tooltip, notification } from 'antd';
import { UpOutlined, DownOutlined, FrownOutlined } from '@ant-design/icons';
import globalUtil from '../../utils/global';
import appUtil from '../../utils/app';
import styles from './index.less'
@connect(
    ({ loading }) => ({
        batchDeleteLoading: loading.effects['appControl/putBatchDelete']
    }),
    null,
    null,
    {
        pure: false
    }
)

export default class AppDeteleResource extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    handleDeleteResource = () => {
        const { dispatch, onCancel, group_id, team_name, regionName } = this.props;
        dispatch({
          type: 'application/deleteGroupAllResource',
          payload: {
            team_name,
            group_id
          },
          callback: res => {
            if (res && res.status_code === 200) {
              notification.success({ message: formatMessage({id:'notification.success.delete'}) });
              onCancel()
              dispatch(
                routerRedux.replace(
                  `/team/${team_name}/region/${regionName}/index`
                )
              );
            }
          }
        });
      };
    handleExpandIcon = (props) => {
        if (
            (props.record.services_info && props.record.services_info.length > 0) ||
            (props.record.config_groups && props.record.config_groups.length > 0) ||
            (props.record.k8s_resources && props.record.k8s_resources.length > 0) ||
            (props.record.domains && props.record.domains.length > 0) ||
            (props.record.app_share_records && props.record.app_share_records.length > 0)
        ) {
            if (props.expanded) {//有数据-展开时候图标
                return (
                    <a
                        style={{ marginright: '0px' }}
                        onClick={(e) => {
                            props.onExpand(props.record, e);
                        }}
                    >
                        {formatMessage({id:'button.fold'})}
                    </a>
                );
            } else {//有数据-未展开时候图标
                return (
                    <a
                        style={{ marginRight: '0px' }}
                        onClick={(e) => {
                            props.onExpand(props.record, e);
                        }}
                    >
                        {formatMessage({id:'button.more'})}
                    </a>
                );
            }
        }
    }
    render() {
        const { onCancel, onOk, infoList, isflag, desc, subDesc, goBack, onDelete } = this.props;
        const { } = this.state;
        const columns = [
            {
                dataIndex: 'name',
                key: 'name',
                width: '30%',
                render: (text, record) => {
                    if (record.services_info) {
                        return (
                            <div>
                                {record.name}
                                <span className={styles.tableNameSpan}>{record.services_info.length}</span>
                            </div>
                        )
                    } else if (record.config_groups) {
                        return (
                            <div>
                                {record.name}
                                <span className={styles.tableNameSpan}>{record.config_groups.length}</span>
                            </div>
                        )
                    } else if (record.k8s_resources) {
                        return (
                            <div>
                                {record.name}
                                <span className={styles.tableNameSpan}>{record.k8s_resources.length}</span>
                            </div>
                        )
                    } else if (record.domains) {
                        return (
                            <div>
                                {record.name}
                                <span className={styles.tableNameSpan}>{record.domains.length}</span>
                            </div>
                        )
                    } else if (record.app_share_records) {
                        return (
                            <div>
                                {record.name}
                                <span className={styles.tableNameSpan}>{record.app_share_records.length}</span>
                            </div>
                        )
                    }
                }
            },
            {
                title: '',
                dataIndex: '',
                width: '5%',
                align: 'center'
            }
        ]
        const data = [
            {
                name: formatMessage({id:'appOverview.app.delete.table.th.service'}),
                services_info: infoList.services_info
            },
            {
                name: formatMessage({id:'appOverview.app.delete.table.th.configGroups'}),
                config_groups: infoList.config_groups
            },
            {
                name: formatMessage({id:'appOverview.app.delete.table.th.k8s'}),
                k8s_resources: infoList.k8s_resources
            },
            {
                name: formatMessage({id:'appOverview.app.delete.table.th.domains'}),
                domains: infoList.domains
            },
            {
                name: formatMessage({id:'appOverview.app.delete.table.th.shareRecords'}),
                app_share_records: infoList.app_share_records
            },
        ]
        return (
            <Modal
                title={formatMessage({id:'appOverview.app.delete.title'})}
                bodyStyle={{ height: isflag ? '200px' : '500px', overflowY: 'auto' }}
                visible
                width={600}
                onCancel={onCancel}
                footer={!isflag ? [
                    <Button onClick={onCancel}> <FormattedMessage id='button.cancel'/> </Button>,
                    <Button
                      type="primary"
                      onClick={onDelete}
                    >
                      {formatMessage({id:'button.delete'})}
                    </Button>
                ] : [
                    <Button onClick={onCancel}> <FormattedMessage id='button.cancel'/> </Button>,
                    <Button onClick={goBack}> {formatMessage({id:'button.last_step'})} </Button>,
                    <Button
                      type="primary"
                      onClick={this.handleDeleteResource}
                    >
                      {formatMessage({id:'button.confirm'})}
                    </Button>
                ]}
            >
                {isflag ? (
                    <div className={styles.content}>
                        <div className={styles.inner}>
                            <span className={styles.icon}>
                                <Icon type="exclamation-circle-o" />
                            </span>
                            <div className={styles.desc}>
                                <p>{desc}</p>
                                <p>{subDesc}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Table
                        dataSource={data}
                        showHeader={false}
                        pagination={false}
                        expandIconColumnIndex={1}
                        expandIconAsCell={false}
                        expandIcon={this.handleExpandIcon}
                        expandedRowRender={record => {
                            if (record.services_info && record.services_info.length > 0) {
                                return <>
                                    <div className={styles.titleDesc}>
                                        <div className={styles.componentName}>{formatMessage({id:'appOverview.app.delete.table.td.serviceName'})}</div>
                                        <div className={styles.storageName}>{formatMessage({id:'appOverview.app.delete.table.td.storageName'})}</div>
                                    </div>
                                    {record.services_info.map((item) => {
                                        return (
                                            <div className={styles.tableBox}>
                                                <div className={styles.storageContent}>
                                                    <div className={styles.serviceName}>
                                                        <p style={{ margin: 0 }}>
                                                            {item.status && <Badge status={appUtil.appStatusToBadgeStatus(item.status)} />}
                                                            {item.service_name}
                                                            {item.is_related && <Tooltip title={formatMessage({id:'appOverview.app.delete.table.td.related'})}> <span style={{ color: '#8b8b8b' }}>（{formatMessage({id:'appOverview.app.delete.table.td.related'})}）</span></Tooltip>}
                                                        </p>
                                                    </div>
                                                    <div className={styles.volumeName}>
                                                        {item.volume.length > 0 ? item.volume.map((v) => {
                                                            return (
                                                                <Tag className={styles.tags} color="blue">{v}</Tag>
                                                            )
                                                        }) : '-'}
                                                    </div>
                                                </div>

                                            </div>
                                        )
                                    })}
                                </>
                            } else if (record.config_groups && record.config_groups.length > 0) {
                                return <>
                                    <div className={styles.titleDesc}>
                                        <div className={styles.componentName}>{formatMessage({id:'appOverview.app.delete.table.td.appConfigGroups'})}</div>
                                    </div>
                                    <div className={styles.configGroups}>
                                        {record.config_groups.map((item) => {
                                            return (
                                                <Tag className={styles.tags} color="blue">{item}</Tag>
                                            )
                                        })}
                                    </div>
                                </>
                            } else if (record.k8s_resources && record.k8s_resources.length > 0) {
                                return <>
                                    <div className={styles.titleDesc}>
                                        <div className={styles.componentName}>{formatMessage({id:'appOverview.app.delete.table.td.k8s'})}</div>
                                    </div>
                                    <div className={styles.k8sResources}>
                                        {record.k8s_resources.map((item) => {
                                            return (
                                                <Tag className={styles.tags} color="blue">{item.name}（{item.type}）</Tag>
                                            )
                                        })}
                                    </div>
                                </>
                            } else if (record.domains && record.domains.length > 0) {
                                return <>
                                    <div className={styles.titleDesc}>
                                        <div className={styles.componentName}>{formatMessage({id:'appOverview.app.delete.table.td.domain'})}</div>
                                    </div>
                                    <div className={styles.k8sResources}>
                                        {record.domains.map((item) => {
                                            return (
                                                <Tag className={styles.tags} color="blue">{item}</Tag>
                                            )
                                        })}
                                    </div>
                                </>
                            } else if (record.app_share_records && record.app_share_records.length > 0) {
                                return <>
                                    <div className={styles.titleDesc}>
                                        <div className={styles.componentName}>{formatMessage({id:'appOverview.app.delete.table.td.shareRecords'})}</div>
                                    </div>
                                    <div className={styles.k8sResources}>
                                        {record.app_share_records.map((item) => {
                                            return (
                                                <Tag className={styles.tags} color="blue">{item}</Tag>
                                            )
                                        })}
                                    </div>
                                </>
                            } else {
                                return <>

                                </>
                            }
                        }}
                        columns={columns}
                    />
                )}
            </Modal>
        );
    }
}
