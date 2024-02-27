import React, { useState, useEffect } from 'react';
import { connect, useDispatch } from 'dva';
import {
    Tabs,
    Card,
    Table,
    Form,
    Select,
    Button,
    Row,
    Col,
    Input,
    Tag,
    Tooltip,
    DatePicker,
    Modal
} from 'antd';
import moment from 'moment';
import PropTypes, { string } from 'prop-types';
import globalUtil from '@/utils/global';
import { formatMessage } from 'umi-plugin-locale';

const { RangePicker } = DatePicker;
// 主功能组件
const Index = (props) => {
    // 使用解构赋值提取 props，以便更轻松地访问
    const { user, teamName, eid, dispatch } = props;
    // 使用 useState 钩子创建状态变量
    const [page_num, setPageNum] = useState(1);
    const [page_size, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expand, setExpand] = useState(false);
    const [searchInfo, setSearchInfo] = useState({});
    const [data, setData] = useState([]);
    const [visible, setVisible] = useState(false);
    const [comment, setComment] = useState('');
    const [editData, setEditData] = useState(0);
    const [stateType, setStateType] = useState(false);
    // useEffect 钩子，当依赖项发生变化时获取数据
    useEffect(() => {
        getTableInfo();
    }, [page_num, page_size, searchInfo, eid, teamName]);
    // 获取表格信息的函数，根据企业 ID 或团队名称选择不同的获取方式
    const getTableInfo = () => {
        if (eid) {
            fetchEidAuditInfo();
        } else if (teamName) {
            fetchAppAuditInfo();
        }
    };
    // 获取团队的应用审批信息
    const fetchAppAuditInfo = () => {
        dispatch({
            type: 'teamControl/getApprovalList',
            payload: {
                page_num,
                page_size,
                team_name: teamName,
                query: searchInfo.query || '',
                type: searchInfo.type || '',
                state: searchInfo.state || '',
                start_time: searchInfo.start_time || '',
                end_time: searchInfo.end_time || '',
            },
            callback: (res) => {
                if (res && res.status_code === 200) {
                    setTotal(res.total);
                    setLoading(false);
                    setData(res.list);
                }
            },
            handleError: (err) => {
                setLoading(false);
                setData([]);
            }
        });
    };
    // 获取企业的审计信息
    const fetchEidAuditInfo = () => {
        dispatch({
            type: 'region/fetchAuditInfo',
            payload: {
                page_num,
                page_size,
                enterprise_id: eid,
                query: searchInfo.query || '',
                type: searchInfo.type || '',
                state: searchInfo.state || '',
                start_time: searchInfo.start_time || '',
                end_time: searchInfo.end_time || '',
            },
            callback: (res) => {
                if (res && res.status_code === 200) {
                    setTotal(res.total);
                    setLoading(false);
                    setData(res.list);
                }
            },
            handleError: (err) => {
                setLoading(false);
                setData([]);
            }
        });
    };
    // 显示审计信息的弹出框
    const showModal = (ID, bool) => {
        setVisible(true);
        setEditData(ID);
        setStateType(bool);
    };
    // 处理审计操作的函数
    const handleAudit = () => {
        dispatch({
            type: 'region/updataAuditInfo',
            payload: {
                enterprise_id: eid,
                id: editData,
                comment: comment,
                state: stateType ? 1 : 2,
            },
            callback: (res) => {
                if (res && res.status_code === 200) {
                    setVisible(false);
                    fetchEidAuditInfo();
                }
            },
            handleError: (err) => {
                setVisible(false);
            }
        });
    };
    // 取消审计操作的函数
    const handleCancel = () => {
        setVisible(false);
    }
    /**
     * 生成工具提示内容的函数
     * @param {Object} json - 包含信息的 JSON 对象
     * @returns {Array} - 包含根据 JSON 键生成的中文显示的段落数组
     */
    const generateTooltipContent = (json, type) => {
        if (type == 'component_library') {
            return Object.keys(json).map((item, index) => {
                const displayMapping = {
                    'version': formatMessage({id:'helmAppInstall.UpgradeInfo.version'}),
                    'info': formatMessage({id:'auditEnterprise.AuditTable.Description'}),
                };
                const shouldDisplay = displayMapping.hasOwnProperty(item);
                const displayText = shouldDisplay ? displayMapping[item] : '';
                return shouldDisplay && (
                    <p key={index}>
                        {displayText}:{json[item]}
                    </p>
                );
            })
        }
        // 根据 json 的 key 生成对应的中文显示
        return Object.keys(json).map((item, index) => {
            // 映射每个 key 到对应的中文显示文本
            const displayMapping = {
                'memory': formatMessage({ id: 'auditEnterprise.AuditTable.Memory' }),
                'cpu': formatMessage({ id: 'auditEnterprise.AuditTable.cpu' }),
                'storage': formatMessage({ id: 'auditEnterprise.AuditTable.storage' }),
                'region': formatMessage({ id: 'auditEnterprise.AuditTable.colony' })
            };

            // 判断当前 key 是否在映射中存在
            const shouldDisplay = displayMapping.hasOwnProperty(item);

            // 获取显示文本，如果不存在则为空字符串
            const displayText = shouldDisplay ? displayMapping[item] : '';

            // 生成包含显示文本和对应值的段落
            return shouldDisplay && (
                <p key={index}>
                    {displayText}:{json[item]}
                    {/* 根据显示文本不同添加不同单位 */}
                    {displayText === '申请内存' ? ' MB' : displayText === '申请CPU' ? ' m' : displayText === '申请存储' ? ' GB' : ''}
                </p>
            );
        });
    };
    // TooltipContent 子组件，用于显示 Tooltip 内容
    const TooltipContent = ({ json, type }) => (

        <>{generateTooltipContent(json, type)}</>
    );
    // 禁止选择今天以后日期的函数
    const disabledDate = (current) => {
        return current && current > moment().endOf('day');
    };
    // 渲染表格的函数
    const tableRender = () => {
        const column = [
            {
                title: formatMessage({ id: 'auditEnterprise.AuditTable.name' }),
                dataIndex: 'name',
                key: 'name',
            },
            {
                title: formatMessage({ id: 'auditEnterprise.AuditTable.type' }),
                dataIndex: 'type',
                key: 'type',
                /*
                 * 'type' 值与审核来源的映射关系：
                 * - 'tenant_resource': '团队资源'
                 * - 'app_library': '应用库'
                 * - 'component_library': '组件资源库'
                 */
                render: (i, record) => (
                    <Tag>
                        {
                            i == 'tenant_resource' ?
                                formatMessage({ id: 'auditEnterprise.AuditTable.source' })
                                :
                                i == 'app_library' ?
                                    formatMessage({ id: 'auditEnterprise.AuditTable.app' })
                                    :
                                    formatMessage({ id: 'auditEnterprise.AuditTable.com' })
                        }
                    </Tag>
                )
            },
            {
                title: formatMessage({ id: 'auditEnterprise.AuditTable.reason' }),
                dataIndex: 'reason',
                key: 'reason',
                width: '80px',
                render: (i, record) => (
                    <Tooltip placement="top" title={i} type={record.type}>
                    <p 
                    style={{overflow: 'hidden',textOverflow: 'ellipsis',whiteSpace: 'nowrap', width:80}}>
                        {i || '-'}
                        </p>
                    </Tooltip>
                )
            },
            {
                title: formatMessage({ id: 'auditEnterprise.AuditTable.applicant' }),
                dataIndex: 'applicant',
                key: 'applicant',
            },
            {
                title: formatMessage({ id: 'auditEnterprise.AuditTable.content' }),
                dataIndex: 'detail',
                key: 'detail',
                render: (i, record) => (
                    <Tooltip placement="top" title={<TooltipContent json={JSON.parse(i)} type={record.type} />}>
                        <Button>{formatMessage({ id: 'auditEnterprise.AuditTable.look' })}</Button>
                    </Tooltip>
                )
            },
            {
                title: formatMessage({ id: 'auditEnterprise.AuditTable.state' }),
                dataIndex: 'state',
                key: 'state',
                /*
                * 映射状态值到显示内容及颜色：
                * - 0: 未审核 (#ffd666)
                * - 1: 审核通过 (#95de64)
                * - 2: 审核未通过 (#ff7875)
                */
                render: (i, record) => (
                    <Tag color={i == 0 ? globalUtil.getPublicColor('rbd-error-status') : i == 1 ? globalUtil.getPublicColor('rbd-warning-status') : globalUtil.getPublicColor('rbd-success-status')}>
                        {
                            i == 0 ?
                                formatMessage({ id: 'auditEnterprise.AuditTable.stay' })
                                :
                                i == 1 ?
                                    formatMessage({ id: 'auditEnterprise.AuditTable.pass' })
                                    :
                                    formatMessage({ id: 'auditEnterprise.AuditTable.Notpassed' })
                        }
                    </Tag>
                )
            },
            {
                title: formatMessage({ id: 'auditEnterprise.AuditTable.Reviewer' }),
                dataIndex: 'reviewer',
                key: 'reviewer',
                render: (i, record) => (
                    <span>{i || '-'}</span>
                )
            },
            {
                title: formatMessage({ id: 'auditEnterprise.AuditTable.comment' }),
                dataIndex: 'comment',
                key: 'comment',
                width: '80px',
                render: (i, record) => (
                    <Tooltip placement="top" title={i} type={record.type}>
                    <p 
                    style={{overflow: 'hidden',textOverflow: 'ellipsis',whiteSpace: 'nowrap', width:80}}>
                        {i || '-'}
                        </p>
                    </Tooltip>
                )
            },
            {
                title: formatMessage({ id: 'auditEnterprise.AuditTable.Review_time' }),
                dataIndex: 'review_time',
                key: 'review_time',
                render: (i, record) => (
                    <span>{i || '-'}</span>
                )
            },
            {
                title: formatMessage({ id: 'auditEnterprise.AuditTable.Application_time' }),
                dataIndex: 'application_time',
                key: 'application_time',
            },
        ];
        // 如果是企业审计，添加操作列
        if (eid) {
            column.push({
                title: formatMessage({ id: 'auditEnterprise.AuditTable.operation' }),
                dataIndex: 'handle',
                key: 'handle',
                width: 160,
                render: (i, record) => (
                    <>
                        {record.state == 0 &&
                            <>
                                <Button
                                    type="link"
                                    size='small'
                                    onClick={() => showModal(record.ID, true)}
                                >
                                    {formatMessage({ id: 'auditEnterprise.AuditTable.adopt' })}
                                </Button>
                                <Button
                                    type="link"
                                    size='small'
                                    style={{ color: 'red' }}
                                    onClick={() => showModal(record.ID, false)}
                                >
                                    {formatMessage({ id: 'auditEnterprise.AuditTable.refuse' })}
                                </Button>
                            </>
                        }
                    </>
                )
            })
        }
        // 返回 Ant Design 的 Table 组件
        return <Table
            dataSource={data}
            columns={column}
            loading={loading}
            pagination={{
                current: page_num,
                pageSize: page_size,
                total: total,
                onChange: onPageChange
            }}
            rowKey={record => record.ID}
        />
    };
    // 分页变化时的回调函数
    const onPageChange = (page_num) => {
        setPageNum(page_num);
        setLoading(true);
    };
    // 表单搜索的处理函数
    const handleSearch = (e) => {
        e.preventDefault();
        const { form } = props;
        form.validateFields((err, values) => {
            if (!err) {
                const { time, query, type, state } = values;
                const formattedStartDate = time?.[0]?.format('YYYY-MM-DD HH:mm:ss') || '';
                const formattedEndDate = time?.[1]?.format('YYYY-MM-DD HH:mm:ss') || '';
                const searchData = {
                    start_time: formattedStartDate,
                    end_time: formattedEndDate,
                    query,
                    type: type === 'all' ? '' : type || '',
                    state: state === '3' ? '' : state || '',
                };
                setPageNum(1);
                setSearchInfo(searchData);
                setLoading(true);
            }
        });
    };

    // 表单重置的处理函数
    const handleReset = () => {
        props.form.resetFields();
        setSearchInfo({});
    };

    const { getFieldDecorator } = props.form;
    // 返回 Card 组件，包含搜索表单、表格和弹出框
    return (
        <Card>
            <Form className="ant-advanced-search-form" onSubmit={handleSearch}>
                <Row gutter={24}>
                    <Col span={4}>
                        <Form.Item >
                            {getFieldDecorator(`query`, {
                            })(<Input placeholder={formatMessage({ id: 'auditEnterprise.AuditTable.input' })} />)}
                        </Form.Item>
                    </Col>
                    <Col span={4}>
                        <Form.Item >
                            {getFieldDecorator(`type`, {
                            })(<Select placeholder={formatMessage({ id: 'auditEnterprise.AuditTable.select_type' })}>
                                <Select.Option value="all">{formatMessage({ id: 'auditEnterprise.AuditTable.all_type' })}</Select.Option>
                                <Select.Option value="tenant_resource">{formatMessage({ id: 'auditEnterprise.AuditTable.team_type' })}</Select.Option>
                                <Select.Option value="app_library">{formatMessage({ id: 'auditEnterprise.AuditTable.app_type' })}</Select.Option>
                                <Select.Option value="component_library">{formatMessage({ id: 'auditEnterprise.AuditTable.com_type' })}</Select.Option>
                            </Select>)}
                        </Form.Item>
                    </Col>
                    <Col span={4}>
                        <Form.Item >
                            {getFieldDecorator(`state`, {
                            })(<Select placeholder={formatMessage({ id: 'auditEnterprise.AuditTable.select_state' })}>
                                <Select.Option value="3">{formatMessage({ id: 'auditEnterprise.AuditTable.all_state' })}</Select.Option>
                                <Select.Option value="0">{formatMessage({ id: 'auditEnterprise.AuditTable.stay' })}</Select.Option>
                                <Select.Option value="1">{formatMessage({ id: 'auditEnterprise.AuditTable.pass' })}</Select.Option>
                                <Select.Option value="2">{formatMessage({ id: 'auditEnterprise.AuditTable.Notpassed' })}</Select.Option>
                            </Select>)}
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item >
                            {getFieldDecorator(`time`)
                                (<RangePicker
                                    disabledDate={disabledDate}
                                    showTime={{ format: 'HH:mm' }}
                                    format="YYYY-MM-DD HH:mm"
                                    placeholder={[formatMessage({ id: 'auditEnterprise.AuditTable.start_time' }), formatMessage({ id: 'auditEnterprise.AuditTable.end_time' })]}
                                />)}
                        </Form.Item>
                    </Col>
                    <Col span={4}>
                        <Button type="primary" htmlType="submit">
                            {formatMessage({ id: 'auditEnterprise.AuditTable.search' })}
                        </Button>
                        <Button style={{ marginLeft: 8 }} onClick={handleReset}>
                            {formatMessage({ id: 'auditEnterprise.AuditTable.empty' })}
                        </Button>
                    </Col>

                </Row>
            </Form>
            {tableRender()}
            <Modal
                title={stateType ? formatMessage({ id: 'auditEnterprise.AuditTable.adopt' }) : formatMessage({ id: 'auditEnterprise.AuditTable.refuse' })}
                visible={visible}
                onOk={handleAudit}
                onCancel={handleCancel}
            >
                <Row align='middle'>
                    <Col span={4}>{formatMessage({ id: 'auditEnterprise.AuditTable.comment' })}</Col>
                    <Col span={20}>
                        <Input value={comment} placeholder={formatMessage({ id: 'auditEnterprise.AuditTable.input_comment' })} onChange={(e) => setComment(e.target.value)} />
                    </Col>
                </Row>
            </Modal>
        </Card >
    );
};
Index.propTypes = {
    teamName: PropTypes.string,
    eid: PropTypes.string
}
export default Form.create()(connect()(Index));
