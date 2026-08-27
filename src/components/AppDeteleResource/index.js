/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Button, Modal, Table, Row, Col, Icon, Tag, Badge, Tooltip, notification } from 'antd';
import { UpOutlined, DownOutlined, FrownOutlined } from '@ant-design/icons';
import globalUtil from '../../utils/global';
import appUtil from '../../utils/app';
import styles from './index.less'
import { getK8sResources, hasK8sResources } from './k8sResourceGuard';
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
        const { dispatch, onCancel, group_id, team_name, regionName, onSuccess, skipRedirect, infoList } = this.props;
        if (hasK8sResources(infoList)) {
            this.handleManageK8sResources();
            return;
        }
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
              if (onSuccess) {
                onSuccess(res);
              }
              if (!skipRedirect) {
                dispatch({ type: 'application/clearGroupDetail' });
                dispatch({
                  type: 'global/fetchGroups',
                  payload: { team_name }
                });
                dispatch(routerRedux.replace(`/team/${team_name}/region/${regionName}/index`));
              }
            }
          }
            });
          };
    handleManageK8sResources = () => {
        const { dispatch, onCancel, group_id, team_name, regionName } = this.props;
        onCancel();
        dispatch(routerRedux.push(`/team/${team_name}/region/${regionName}/apps/${group_id}/asset`));
    };
    getK8sResourceDeleteStatus = status => {
        if (status === 'ACTIVE') {
            return formatMessage({ id: 'addKubenetesResource.table.active' });
        }
        if (status === 'DELETING') {
            return formatMessage({ id: 'addKubenetesResource.table.deleting' });
        }
        if (status === 'DELETE_FAILED') {
            return formatMessage({ id: 'addKubenetesResource.table.delete_failed' });
        }
        return status;
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
            const { onCancel, onOk, infoList, isflag, desc, subDesc, goBack, onDelete, loading } = this.props;
            const { } = this.state;
            const k8sResources = getK8sResources(infoList);
            const hasK8sResourceList = hasK8sResources(infoList);
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
                        const records = record.app_share_records.length > 0 && record.app_share_records.filter(i=>i.name && i.name.trim())
                        return (
                            <div>
                                {record.name}
                                <span className={styles.tableNameSpan}>{records.length}</span>
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
        const data = []
        if(infoList){
            Object.keys(infoList).map((item)=>{
                if(item == 'services_info' && infoList[item].length > 0){
                    data.push({
                        name: formatMessage({id:'appOverview.app.delete.table.th.service'}),
                        services_info: infoList[item] || []
                    })
                }else if(item == 'config_groups' && infoList[item].length > 0){
                    data.push({
                        name: formatMessage({id:'appOverview.app.delete.table.th.configGroups'}),
                        config_groups: infoList[item] || []
                    })
                }else if(item == 'k8s_resources' && k8sResources.length > 0){
                    data.push({
                        name: formatMessage({id:'appOverview.app.delete.table.th.k8s'}),
                        k8s_resources: k8sResources
                    })
                }else if(item == 'domains' && infoList[item].length > 0){
                    data.push({
                        name: formatMessage({id:'appOverview.app.delete.table.th.domains'}),
                        domains: infoList[item] || []
                    })
                }else if(item == 'app_share_records' && infoList[item].length > 0){
                    data.push({
                        name: formatMessage({id:'appOverview.app.delete.table.th.shareRecords'}),
                        app_share_records: infoList[item] || []
                    })
                }
            })
        }
        return (
                <Modal
                    title={formatMessage({id:'appOverview.app.delete.title'})}
                    bodyStyle={{ height: !hasK8sResourceList && isflag ? '200px' : '500px', overflowY: 'auto' }}
                    visible
                    width={600}
                    onCancel={onCancel}
                    footer={hasK8sResourceList ? [
                        <Button onClick={onCancel}> <FormattedMessage id='button.cancel'/> </Button>,
                        <Button
                          type="primary"
                          onClick={this.handleManageK8sResources}
                        >
                          {formatMessage({id:'appOverview.app.delete.k8s.manage'})}
                        </Button>
                    ] : !isflag ? [
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
                      loading={loading}
                      onClick={this.handleDeleteResource}
                    >
                      {formatMessage({id:'button.confirm'})}
                        </Button>
                    ]}
                >
                    {!hasK8sResourceList && isflag ? (
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
                        <>
                            {hasK8sResourceList && (
                                <p>{formatMessage({id:'appOverview.app.delete.k8s.blocked'})}</p>
                            )}
                            <Table
                                dataSource={data}
                                rowKey={(record,index) => index}
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
                                    {record.services_info.map((item, index) => {
                                        return (
                                            <div className={styles.tableBox} key={item.service_id || item.service_name || index}>
                                                <div className={styles.storageContent}>
                                                    <div className={styles.serviceName}>
                                                        <p style={{ margin: 0 }}>
                                                            {item.status && <Badge status={appUtil.appStatusToBadgeStatus(item.status)} />}
                                                            {item.service_name}
                                                            {item.is_related && <Tooltip title={formatMessage({id:'appOverview.app.delete.table.td.related'})}> <span style={{ color: '#8b8b8b' }}>（{formatMessage({id:'appOverview.app.delete.table.td.related'})}）</span></Tooltip>}
                                                        </p>
                                                    </div>
                                                    <div className={styles.volumeName}>
                                                        {item.volume.length > 0 ? item.volume.map((v, index) => {
                                                            return (
                                                                <Tag className={styles.tags} color="blue" key={`${v}-${index}`}>{v}</Tag>
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
                                        {record.config_groups.map((item, index) => {
                                            return (
                                                <Tag className={styles.tags} color="blue" key={`${item}-${index}`}>{item}</Tag>
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
                                        {record.k8s_resources.map((item, index) => {
                                            return (
                                                <div key={item.resource_id || item.ID || item.id || `${item.type}-${item.name}-${index}`}>
                                                    <Tag className={styles.tags} color="blue">{item.name}（{item.type}）</Tag>
                                                    {item.delete_status && (
                                                        <p>{formatMessage({id:'appOverview.app.delete.k8s.status'}, { status: this.getK8sResourceDeleteStatus(item.delete_status) })}</p>
                                                    )}
                                                    {item.delete_error && (
                                                        <p>{formatMessage({id:'appOverview.app.delete.k8s.error'}, { error: item.delete_error })}</p>
                                                    )}
                                                </div>
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
                                        {record.domains.map((item, index) => {
                                            return (
                                                <Tag className={styles.tags} color="blue" key={`${item}-${index}`}>{item}</Tag>
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
                                        {record.app_share_records.map((item, index) => {
                                            return (item != null && item != '') && (
                                                <Tag className={styles.tags} color="blue" key={`${item.name}-${item.version}-${index}`}>{item.name}（{item.version}）</Tag>
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
                        </>
                    )}
            </Modal>
        );
    }
}
