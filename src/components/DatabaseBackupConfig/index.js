import React, { PureComponent } from 'react';
import { Form, Card, Radio, InputNumber, Select, Button, Input } from 'antd';
import { formatMessage } from 'umi-plugin-locale';
import styles from './index.less';

const { Option } = Select;
const RadioGroup = Radio.Group;
const { Group: InputGroup } = Input;

export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            // 备份设置
            backupCycle: 'hour', // 小时
            backupStartDay: '5', // 周五
            backupStartHour: '00',
            backupStartMinute: '45',
            backupRetentionTime: 7,
            backupRetentionUnit: 'day',
            termination_policy: 'Delete', // 保留备份
            backupRepo: ''
        };
    }

    componentDidMount() {
        const { onRef } = this.props;
        if (onRef) {
            this.props.onRef(this);
        }
    }

    handleBackupRepoChange = (value) => {
        this.setState({ backupRepo: value });
        const { form } = this.props;
        form.setFieldsValue({ backupRepo: value });
    };

    handleBackupCycleChange = (e) => {
        this.setState({ backupCycle: e.target.value });
        const { form } = this.props;
        form.setFieldsValue({ backupCycle: e.target.value });
    };

    handleTerminationPolicyChange = (e) => {
        this.setState({ termination_policy: e.target.value });
        const { form } = this.props;
        form.setFieldsValue({ termination_policy: e.target.value });
    };

    getBackupStartTimeInitialValue = () => {
        const { backupCycle, backupStartDay, backupStartHour, backupStartMinute } = this.state;
        return {
            day: backupStartDay,
            hour: backupStartHour,
            minute: backupStartMinute
        };
    };

    handleSubmit = () => {
        const { form, onSubmit } = this.props;

        form.validateFields((err, fieldsValue) => {
            if (!err && onSubmit && fieldsValue) {
                // 根据备份周期，构建完整的时间设置对象
                const { backupCycle } = fieldsValue;
                const { backupStartDay, backupStartHour, backupStartMinute, backupRetentionTime } = this.state;

                // 构建时间设置对象，包含用户实际设置的值
                let backupStartTime = {};

                switch (backupCycle) {
                    case 'hour':
                        // 每小时备份，只需要分钟
                        backupStartTime = {
                            minute: backupStartMinute
                        };
                        break;

                    case 'day':
                        // 每天备份，需要小时和分钟
                        backupStartTime = {
                            hour: backupStartHour,
                            minute: backupStartMinute
                        };
                        break;

                    case 'week':
                        // 每周备份，需要星期、小时和分钟
                        backupStartTime = {
                            day: backupStartDay,
                            hour: backupStartHour,
                            minute: backupStartMinute
                        };
                        break;

                    default:
                        // 默认配置
                        backupStartTime = {
                            hour: '02',
                            minute: '00'
                        };
                }

                // 更新字段值，确保传递正确的时间设置
                fieldsValue.backupStartTime = backupStartTime;

                // 处理备份保留时间，直接使用数字值（天数）
                fieldsValue.backupRetention = backupRetentionTime;


                onSubmit(fieldsValue);
            }
        });
    };

    render() {
        const { form, backupRepos = [] } = this.props;
        const { getFieldDecorator } = form;
        const {
            backupCycle,
            backupStartDay,
            backupStartHour,
            backupStartMinute,
            backupRetentionTime,
            termination_policy,
            backupRepo
        } = this.state;

        const repoOptions = backupRepos;

        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 6 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 18 }
            }
        };

        const requiredLabel = (label) => (<span><span style={{ color: 'red' }}>*</span> {label}</span>);

        return (
            <div className={styles.databaseBackupConfig}>
                <Card title={formatMessage({ id: 'kubeblocks.database.backup.title' })} style={{ marginBottom: 16 }}>
                    <Form layout="horizontal" hideRequiredMark>
                        {/* BackupRepo */}
                        <Form.Item {...formItemLayout} label={requiredLabel(formatMessage({ id: 'kubeblocks.database.backup.repo_label' }))}>
                            {getFieldDecorator('backupRepo', {
                                initialValue: backupRepo,
                                rules: [{ required: false }]
                            })(
                                <Select placeholder={formatMessage({ id: 'kubeblocks.database.backup.repo_placeholder' })} onChange={this.handleBackupRepoChange} allowClear>
                                    <Option value=''>{formatMessage({ id: 'kubeblocks.database.backup.repo_none' })}</Option>
                                    {repoOptions.map(repo => (
                                        <Option key={repo.name} value={repo.name}>
                                            {repo.displayName || repo.name}
                                        </Option>
                                    ))}
                                </Select>
                            )}
                        </Form.Item>
                        {form.getFieldValue('backupRepo') ? <>
                            <Form.Item {...formItemLayout} label={requiredLabel(formatMessage({ id: 'kubeblocks.database.backup.cycle_label' }))}>
                                {getFieldDecorator('backupCycle', {
                                    initialValue: backupCycle,
                                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.cycle_required' }) }]
                                })(
                                    <RadioGroup onChange={this.handleBackupCycleChange}>
                                        <Radio value="hour">{formatMessage({ id: 'kubeblocks.database.backup.cycle_hour' })}</Radio>
                                        <Radio value="day">{formatMessage({ id: 'kubeblocks.database.backup.cycle_day' })}</Radio>
                                        <Radio value="week">{formatMessage({ id: 'kubeblocks.database.backup.cycle_week' })}</Radio>
                                    </RadioGroup>
                                )}
                            </Form.Item>
                            <Form.Item {...formItemLayout} label={requiredLabel(formatMessage({ id: 'kubeblocks.database.backup.startTime_label' }))}>
                                {getFieldDecorator('backupStartTime', {
                                    initialValue: this.getBackupStartTimeInitialValue(),
                                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.startTime_required' }) }]
                                })(
                                    <div className={styles.backupTimeSelector} style={{ display: 'flex', alignItems: 'center' }}>
                                        {backupCycle === 'week' && (
                                            <Select value={backupStartDay} onChange={v => this.setState({ backupStartDay: v })} style={{ width: 80, marginRight: 8 }}>
                                                <Option value="1">{formatMessage({ id: 'kubeblocks.database.backup.startTime_mon' })}</Option>
                                                <Option value="2">{formatMessage({ id: 'kubeblocks.database.backup.startTime_tue' })}</Option>
                                                <Option value="3">{formatMessage({ id: 'kubeblocks.database.backup.startTime_wed' })}</Option>
                                                <Option value="4">{formatMessage({ id: 'kubeblocks.database.backup.startTime_thu' })}</Option>
                                                <Option value="5">{formatMessage({ id: 'kubeblocks.database.backup.startTime_fri' })}</Option>
                                                <Option value="6">{formatMessage({ id: 'kubeblocks.database.backup.startTime_sat' })}</Option>
                                                <Option value="0">{formatMessage({ id: 'kubeblocks.database.backup.startTime_sun' })}</Option>
                                            </Select>
                                        )}
                                        {(backupCycle === 'day' || backupCycle === 'week') && (
                                            <>
                                                <Select value={backupStartHour} onChange={v => this.setState({ backupStartHour: v })} style={{ width: 80, marginRight: 4 }}>
                                                    {Array.from({ length: 24 }, (_, i) => (
                                                        <Option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</Option>
                                                    ))}
                                                </Select>
                                                <span style={{ marginRight: 8 }}>{formatMessage({ id: 'kubeblocks.database.backup.startTime_hour' })}</span>
                                            </>
                                        )}
                                        <Select value={backupStartMinute} onChange={v => this.setState({ backupStartMinute: v })} style={{ width: 80, marginRight: 4 }}>
                                            {Array.from({ length: 60 }, (_, i) => (
                                                <Option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</Option>
                                            ))}
                                        </Select>
                                        <span>{formatMessage({ id: 'kubeblocks.database.backup.startTime_minute' })}</span>
                                    </div>
                                )}
                            </Form.Item>
                            <Form.Item {...formItemLayout} label={requiredLabel(formatMessage({ id: 'kubeblocks.database.backup.retention_label' }))}>
                                {getFieldDecorator('backupRetention', {
                                    initialValue: backupRetentionTime,
                                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.retention_required' }) }]
                                })(
                                    <InputNumber
                                        style={{ width: '120px' }}
                                        min={1}
                                        max={365}
                                        value={backupRetentionTime}
                                        onChange={v => this.setState({ backupRetentionTime: v })}
                                        placeholder={formatMessage({ id: 'kubeblocks.database.backup.retention_placeholder' })}
                                    />
                                )}
                                <span style={{ marginLeft: 8, color: '#666' }}>{formatMessage({ id: 'kubeblocks.database.backup.retention_unit' })}</span>
                            </Form.Item>
                            <Form.Item {...formItemLayout} label={requiredLabel(formatMessage({ id: 'kubeblocks.database.backup.policy_label' }))}>
                                {getFieldDecorator('termination_policy', {
                                    initialValue: termination_policy,
                                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.policy_required' }) }]
                                })(
                                    <RadioGroup onChange={this.handleTerminationPolicyChange}>
                                        {/* Delete 在 Kubeblocks 的 TerminationPolicy 中不会删除备份，WipeOut 会同时删除备份数据*/}
                                        <Radio value="Delete">{formatMessage({ id: 'kubeblocks.database.backup.policy_delete' })}</Radio>
                                        <Radio value="WipeOut">{formatMessage({ id: 'kubeblocks.database.backup.policy_wipeout' })}</Radio>
                                    </RadioGroup>
                                )}
                            </Form.Item>
                        </> : null}
                    </Form>
                </Card>
            </div>
        );
    }
}