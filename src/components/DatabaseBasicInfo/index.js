import React, { PureComponent } from 'react';
import { Card, Form, Slider, InputNumber, Select, Radio, Input, Icon } from 'antd';
import { formatMessage } from '@/utils/intl';
import styles from './index.less';

const { Option } = Select;
const RadioGroup = Radio.Group;
const { Group: InputGroup } = Input;

export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            memoryMarks: {
                1: '128M',
                2: '256M',
                3: '512M',
                4: '1G',
                5: '2G',
                6: '4G',
                7: '8G',
                8: '16G'
            },
            memoryMarksObj: {
                128: 1,
                256: 2,
                512: 3,
                1024: 4,
                2048: 5,
                4096: 6,
                8192: 7,
                16384: 8
            },
            cpuMarks: {
                1: '100m',
                2: '250m',
                3: '500m',
                4: '1Core',
                5: '2Core',
                6: '4Core',
                7: '8Core',
            },
            cpuMarksObj: {
                100: 1,
                250: 2,
                500: 3,
                1000: 4,
                2000: 5,
                4000: 6,
                8000: 7,
            },
            memorySliderMin: 1,
            memorySliderMax: 8,
            cpuSliderMin: 1,
            cpuSliderMax: 7,
            cpuValue: 4,
            memoryValue: 4
        };
    }

    componentDidMount() {
        // 支持无限制选项
        this.setState({
            memoryMarks: { 0: formatMessage({ id: 'appOverview.no_limit' }), ...this.state.memoryMarks, 9: '32G' },
            cpuMarks: { 0: formatMessage({ id: 'appOverview.no_limit' }), ...this.state.cpuMarks, 8: '16Core' },
            memoryMarksObj: { 0: 0, ...this.state.memoryMarksObj, 32768: 9 },
            cpuMarksObj: { 0: 0, ...this.state.cpuMarksObj, 18000: 8 },
            memorySliderMax: 9,
            memorySliderMin: 0,
            cpuSliderMax: 8,
            cpuSliderMin: 0
        });

        if (this.props.onRef) {
            this.props.onRef(this);
        }
    }

    handleMemoryChange = (value) => {
        const memoryToCpuMap = {
            0: 0,
            1: 1,
            2: 1,
            3: 2,
            4: 3,
            5: 4,
            6: 5,
            7: 6,
            8: 7,
            9: 8
        };
        const newCpuValue = memoryToCpuMap[value] !== undefined ? memoryToCpuMap[value] : 8;
        this.setState({
            memoryValue: value,
            cpuValue: newCpuValue
        }, () => {
            // 更新表单中的 CPU 值
            const { form } = this.props;
            form.setFieldsValue({
                min_cpu: newCpuValue
            });
        });
    };

    handleCpuChange = (value) => {
        this.setState({
            cpuValue: value
        });
    };

    checkNum = (value, type) => {
        const { memoryMarksObj, cpuMarksObj } = this.state;
        let num = 0;
        if (type == 'memory') {
            Object.keys(memoryMarksObj).forEach(item => {
                if (item == value) {
                    num = memoryMarksObj[item];
                }
            });
        }
        if (type == 'cpu') {
            Object.keys(cpuMarksObj).forEach(item => {
                if (item == value) {
                    num = cpuMarksObj[item];
                }
            });
        }
        return num;
    }

    getFormValues = (data, type) => {
        const { cpuMarksObj, memoryMarksObj } = this.state;
        let num = 0;
        if (type == 'memory') {
            Object.keys(memoryMarksObj).forEach(item => {
                if (memoryMarksObj[item] == data) {
                    num = item;
                }
            });
        } else {
            Object.keys(cpuMarksObj).forEach(item => {
                if (cpuMarksObj[item] == data) {
                    num = item;
                }
            });
        }
        return num;
    }

    handleSubmit = () => {
        const { memoryMarksObj, cpuMarksObj } = this.state;
        const { form, onSubmit } = this.props;
        form.validateFields((err, fieldsValue) => {
            if (!err && onSubmit && fieldsValue) {
                Object.keys(memoryMarksObj).forEach(item => {
                    if (memoryMarksObj[item] == fieldsValue.min_memory) {
                        fieldsValue.min_memory = item;
                    }
                });
                Object.keys(cpuMarksObj).forEach(item => {
                    if (cpuMarksObj[item] == fieldsValue.min_cpu) {
                        fieldsValue.min_cpu = item;
                    }
                });
                onSubmit(fieldsValue);
            }
        });
    };

    render() {
        const { form, dbVersions = [], storageClasses = [], databaseType = '' } = this.props;
        const { getFieldDecorator } = form;
        const {
            memoryMarks,
            cpuMarks,
            memoryValue,
            cpuValue,
            memorySliderMin,
            memorySliderMax,
            cpuSliderMin,
            cpuSliderMax
        } = this.state;

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
            <div className={styles.databaseBasicInfo}>
                <Card title={formatMessage({ id: 'kubeblocks.database.basic.title' })} style={{ marginBottom: 16 }}>
                    <Form layout="horizontal" hideRequiredMark>
                        {/* 内存配置 */}
                        <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.config.memory_label' })}>
                            {getFieldDecorator('min_memory', {
                                initialValue: memoryValue,
                                rules: [
                                    {
                                        required: true,
                                        message: formatMessage({ id: 'kubeblocks.database.config.memory_required' })
                                    }
                                ]
                            })(
                                <Slider
                                    style={{ width: '500px' }}
                                    marks={memoryMarks}
                                    min={memorySliderMin}
                                    max={memorySliderMax}
                                    step={null}
                                    defaultValue={memoryValue}
                                    onChange={this.handleMemoryChange}
                                    tooltipVisible={false}
                                />
                            )}
                        </Form.Item>

                        {/* CPU配置 */}
                        <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.config.cpu_label' })}>
                            {getFieldDecorator('min_cpu', {
                                initialValue: cpuValue,
                                rules: [
                                    {
                                        required: true,
                                        message: formatMessage({ id: 'kubeblocks.database.config.cpu_required' })
                                    }
                                ]
                            })(
                                <Slider
                                    style={{ width: '500px' }}
                                    marks={cpuMarks}
                                    min={cpuSliderMin}
                                    max={cpuSliderMax}
                                    step={null}
                                    defaultValue={cpuValue}
                                    onChange={this.handleCpuChange}
                                    tooltipVisible={false}
                                />
                            )}
                        </Form.Item>

                        {/* 数据库版本配置 */}
                        <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.config.version_label' })}>
                            {getFieldDecorator('dbVersion', {
                                initialValue: dbVersions.length > 0 ? dbVersions[0] : '',
                                rules: [
                                    {
                                        required: true,
                                        message: formatMessage({ id: 'kubeblocks.database.config.version_required' })
                                    }
                                ]
                            })(
                                <Select style={{ width: '200px' }} placeholder={formatMessage({ id: 'kubeblocks.database.config.version_placeholder' })}>
                                    {dbVersions.map(version => (
                                        <Option key={version} value={version} title={databaseType ? `${databaseType}-${version}` : version}>
                                            {databaseType ? `${databaseType}-${version}` : version}
                                        </Option>
                                    ))}
                                </Select>
                            )}
                        </Form.Item>

                        {/* 副本数配置 */}
                        <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.config.replicas_label' })}>
                            {getFieldDecorator('replicas', {
                                initialValue: 1,
                                rules: [
                                    {
                                        required: true,
                                        message: formatMessage({ id: 'kubeblocks.database.config.replicas_required' })
                                    }
                                ]
                            })(
                                <InputNumber
                                    style={{ width: '180px' }}
                                    min={1}
                                    max={10}
                                    placeholder={formatMessage({ id: 'kubeblocks.database.config.replicas_placeholder' })}
                                />
                            )}
                        </Form.Item>

                        {/* StorageClass配置 */}
                        <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.config.storageClass_label' })}>
                            {getFieldDecorator('storageClass', {
                                initialValue: storageClasses.length > 0 ? storageClasses[0].name : '',
                                rules: [
                                    {
                                        required: true,
                                        message: formatMessage({ id: 'kubeblocks.database.config.storageClass_required' })
                                    }
                                ]
                            })(
                                <Select style={{ width: '180px' }} placeholder={formatMessage({ id: 'kubeblocks.database.config.storageClass_placeholder' })}>
                                    {storageClasses.map(storageClass => (
                                        <Option key={storageClass.name} value={storageClass.name}>
                                            {storageClass.name}
                                        </Option>
                                    ))}
                                </Select>
                            )}
                        </Form.Item>

                        {/* 磁盘配置 */}
                        <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.config.storage' })}>
                            <div style={{ position: 'relative', display: 'inline-block', width: '180px' }}>
                                {getFieldDecorator('disk_cap', {
                                    initialValue: 10,
                                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.config.storage_required' }) }]
                                })(
                                    <InputNumber
                                        style={{ width: '100%', paddingRight: '35px' }}
                                        min={1}
                                        max={10000}
                                        placeholder={formatMessage({ id: 'kubeblocks.database.config.storage_placeholder' })}
                                    />
                                )}
                                <span style={{
                                    position: 'absolute',
                                    right: '32px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'rgba(0, 0, 0, 0.65)',
                                    pointerEvents: 'none',
                                    fontSize: '14px'
                                }}>
                                    Gi
                                </span>
                            </div>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        );
    }
} 