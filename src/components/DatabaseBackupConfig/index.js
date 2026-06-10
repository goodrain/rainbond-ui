import React, { PureComponent } from 'react';
import { Form, Card, Radio, InputNumber, Select, Button, Input, Modal } from 'antd';
import { formatMessage } from '@/utils/intl';
import styles from './index.less';

const { Option } = Select;
const RadioGroup = Radio.Group;
const { Group: InputGroup } = Input;
const READY_BACKUP_REPO_PHASE = 'Ready';
const BACKUP_REPO_FIELD = 'backupRepo';
const BACKUP_CONFIG_FIELDS = [
    BACKUP_REPO_FIELD,
    'backupCycle',
    'backupStartTime',
    'backupRetention',
    'termination_policy'
];

const getBackupRepoPhase = repo => (repo && (repo.phase || repo.status)) || '';
const isBackupRepoReady = repo => getBackupRepoPhase(repo) === READY_BACKUP_REPO_PHASE;

export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            // 备份策略
            backupCycle: 'hour', // 小时
            backupStartDay: '5', // 周五
            backupStartHour: '00',
            backupStartMinute: '45',
            backupRetentionTime: 7,
            backupRetentionUnit: 'day',
            termination_policy: 'Delete', // 保留备份
            backupRepo: '',
            createRepoVisible: false,
            createRepoSubmitting: false
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

    handleOpenCreateRepo = () => {
        this.setState({ createRepoVisible: true });
    };

    handleCancelCreateRepo = () => {
        const { form } = this.props;
        form.resetFields([
            'quickRepoName',
            'quickRepoDisplayName',
            'quickRepoBucket',
            'quickRepoEndpoint',
            'quickRepoRegion',
            'quickRepoAccessKeyId',
            'quickRepoSecretAccessKey',
            'quickRepoVolumeCapacity',
            'quickRepoPathPrefix'
        ]);
        this.setState({ createRepoVisible: false, createRepoSubmitting: false });
    };

    handleCreateRepo = () => {
        const { form, onCreateBackupRepo } = this.props;
        const fields = [
            'quickRepoName',
            'quickRepoDisplayName',
            'quickRepoBucket',
            'quickRepoEndpoint',
            'quickRepoRegion',
            'quickRepoAccessKeyId',
            'quickRepoSecretAccessKey',
            'quickRepoVolumeCapacity',
            'quickRepoPathPrefix'
        ];

        form.validateFields(fields, (err, values) => {
            if (err || !onCreateBackupRepo) return;

            this.setState({ createRepoSubmitting: true });
            onCreateBackupRepo(
                {
                    name: values.quickRepoName,
                    display_name: values.quickRepoDisplayName || values.quickRepoName,
                    bucket: values.quickRepoBucket,
                    endpoint: values.quickRepoEndpoint,
                    region: values.quickRepoRegion || '',
                    access_key_id: values.quickRepoAccessKeyId,
                    secret_access_key: values.quickRepoSecretAccessKey,
                    volume_capacity: values.quickRepoVolumeCapacity || '100Gi',
                    path_prefix: values.quickRepoPathPrefix || ''
                },
                repo => {
                    this.setState({ createRepoSubmitting: false });
                    if (repo && repo.name) {
                        this.handleBackupRepoChange(repo.name);
                        this.handleCancelCreateRepo();
                    }
                },
                () => {
                    this.setState({ createRepoSubmitting: false });
                }
            );
        });
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

    getFieldNames = () => {
        const { form } = this.props;
        return form.getFieldValue(BACKUP_REPO_FIELD) ? BACKUP_CONFIG_FIELDS : [BACKUP_REPO_FIELD];
    };

    normalizeSubmitValues = (fieldsValue = {}) => {
        if (!fieldsValue.backupRepo) {
            return {
                backupRepo: ''
            };
        }

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

        return {
            ...fieldsValue,
            backupStartTime,
            backupRetention: backupRetentionTime
        };
    };

    handleSubmit = () => {
        const { form, onSubmit } = this.props;

        form.validateFields(this.getFieldNames(), (err, fieldsValue) => {
            if (!err && onSubmit && fieldsValue) {
                onSubmit(this.normalizeSubmitValues(fieldsValue));
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
            backupRepo,
            createRepoVisible,
            createRepoSubmitting
        } = this.state;

        const repoOptions = backupRepos.filter(repo => {
            return isBackupRepoReady(repo) || repo.name === backupRepo;
        });

        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 3 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 21 }
            }
        };

        return (
            <div className={styles.databaseBackupConfig}>
                <Card title={formatMessage({ id: 'kubeblocks.database.backup.title' })} style={{ marginBottom: 16 }}>
                    <Form layout="horizontal" hideRequiredMark>
                        {/* BackupRepo */}
                        <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.backup.repo_label' })}>
                            <div className={styles.backupRepoSelector}>
                                {getFieldDecorator('backupRepo', {
                                    initialValue: backupRepo,
                                    rules: [{ required: false }]
                                })(
                                    <Select className={styles.backupRepoSelect} placeholder={formatMessage({ id: 'kubeblocks.database.backup.repo_placeholder' })} onChange={this.handleBackupRepoChange} allowClear>
                                        <Option value=''>{formatMessage({ id: 'kubeblocks.database.backup.repo_none' })}</Option>
                                        {repoOptions.map(repo => {
                                            const phase = getBackupRepoPhase(repo);
                                            const disabled = !isBackupRepoReady(repo);
                                            return (
                                                <Option key={repo.name} value={repo.name} disabled={disabled}>
                                                    {repo.displayName || repo.name}{disabled && phase ? ` (${phase})` : ''}
                                                </Option>
                                            );
                                        })}
                                    </Select>
                                )}
                                <Button className={styles.backupRepoCreateButton} icon="plus" onClick={this.handleOpenCreateRepo}>
                                    {formatMessage({ id: 'kubeblocks.database.backup.repo.create_s3' })}
                                </Button>
                            </div>
                        </Form.Item>
                        {form.getFieldValue('backupRepo') ? <>
                            <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.backup.cycle_label' })}>
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
                            <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.backup.startTime_label' })}>
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
                            <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.backup.retention_label' })}>
                                {getFieldDecorator('backupRetention', {
                                    initialValue: backupRetentionTime,
                                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.retention_required' }) }]
                                })(
                                    <InputNumber
                                        style={{ width: '80px' }}
                                        min={1}
                                        max={365}
                                        value={backupRetentionTime}
                                        onChange={v => this.setState({ backupRetentionTime: v })}
                                        placeholder={formatMessage({ id: 'kubeblocks.database.backup.retention_placeholder' })}
                                    />
                                )}
                                <span style={{ marginLeft: 8, color: '#666' }}>{formatMessage({ id: 'kubeblocks.database.backup.retention_unit' })}</span>
                            </Form.Item>
                            <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.backup.policy_label' })}>
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
                <Modal
                    title={formatMessage({ id: 'kubeblocks.database.backup.repo.modal.create_title' })}
                    visible={createRepoVisible}
                    width={760}
                    onOk={this.handleCreateRepo}
                    onCancel={this.handleCancelCreateRepo}
                    confirmLoading={createRepoSubmitting}
                    destroyOnClose
                    className={styles.createRepoModal}
                >
                    <Form layout="vertical" className={styles.createRepoForm}>
                        <div className={styles.createRepoFormGrid}>
                            <Form.Item className={styles.createRepoFormItem} label={formatMessage({ id: 'kubeblocks.database.backup.repo.name' })}>
                                {getFieldDecorator('quickRepoName', {
                                    rules: [
                                        { required: true, message: formatMessage({ id: 'kubeblocks.database.backup.repo.name_required' }) },
                                        { pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/, message: formatMessage({ id: 'kubeblocks.database.backup.repo.name_invalid' }) }
                                    ]
                                })(<Input placeholder="prod-s3" />)}
                            </Form.Item>
                            <Form.Item className={styles.createRepoFormItem} label={formatMessage({ id: 'kubeblocks.database.backup.repo.display_name' })}>
                                {getFieldDecorator('quickRepoDisplayName')(<Input />)}
                            </Form.Item>
                            <Form.Item className={styles.createRepoFormItem} label="Bucket">
                                {getFieldDecorator('quickRepoBucket', {
                                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.repo.bucket_required' }) }]
                                })(<Input />)}
                            </Form.Item>
                            <Form.Item className={styles.createRepoFormItem} label="Endpoint">
                                {getFieldDecorator('quickRepoEndpoint', {
                                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.repo.endpoint_required' }) }]
                                })(<Input placeholder="https://s3.example.com" />)}
                            </Form.Item>
                            <Form.Item className={styles.createRepoFormItem} label="Region">
                                {getFieldDecorator('quickRepoRegion')(<Input />)}
                            </Form.Item>
                            <Form.Item className={styles.createRepoFormItem} label="AccessKey">
                                {getFieldDecorator('quickRepoAccessKeyId', {
                                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.repo.access_key_required' }) }]
                                })(<Input />)}
                            </Form.Item>
                            <Form.Item className={styles.createRepoFormItem} label="SecretKey">
                                {getFieldDecorator('quickRepoSecretAccessKey', {
                                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.repo.secret_key_required' }) }]
                                })(<Input.Password />)}
                            </Form.Item>
                            <Form.Item className={styles.createRepoFormItem} label={formatMessage({ id: 'kubeblocks.database.backup.repo.volume_capacity' })}>
                                {getFieldDecorator('quickRepoVolumeCapacity', {
                                    initialValue: '100Gi'
                                })(<Input />)}
                            </Form.Item>
                            <Form.Item className={styles.createRepoFormItem} label={formatMessage({ id: 'kubeblocks.database.backup.repo.path_prefix' })}>
                                {getFieldDecorator('quickRepoPathPrefix')(<Input />)}
                            </Form.Item>
                        </div>
                    </Form>
                </Modal>
            </div>
        );
    }
}
