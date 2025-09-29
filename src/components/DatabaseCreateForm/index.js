import { Button, Form, Input, Select, Divider, message } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from 'umi-plugin-locale';
import { pinyin } from 'pinyin-pro';
import globalUtil from '../../utils/global';
import styles from '../../pages/Create/Index.less';

const { Option } = Select;
const formItemLayout = {
    labelCol: { span: 7 },
    wrapperCol: { span: 15 }
};

@connect(({ teamControl, global }) => ({
    groups: global.groups,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
@Form.create()
export default class Index extends PureComponent {
    state = {
        comNames: [], // 当前应用内已存在的组件英文名列表，用于预检重名
        showAdvanced: false
    };

    componentDidMount() {
        // 如果存在应用组ID，获取当前应用下已有组件的英文名列表，用于生成默认英文名时避免冲突
        const group_id = globalUtil.getGroupID();
        if (group_id) {
            this.fetchComponentNames(group_id);
        }
    }

    fetchComponentNames = (group_id) => {
        const { dispatch } = this.props;
        dispatch({
            type: 'appControl/getComponentNames',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id
            },
            callback: res => {
                if (res && res.bean) {
                    this.setState({
                        comNames: res.bean.component_names && res.bean.component_names.length > 0
                            ? res.bean.component_names
                            : []
                    });
                }
            }
        });
    };

    // 英文名校验
    handleValiateNameSpace = (_, value, callback) => {
        if (!value) {
            return callback(new Error(formatMessage({ id: 'placeholder.k8s_component_name' })));
        }
        if (value && value.length <= 32) {
            const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
            if (!Reg.test(value)) {
                return callback(
                    new Error(formatMessage({ id: 'placeholder.nameSpaceReg' }))
                );
            }
            callback();
        }
        if (value.length > 32) {
            return callback(new Error(formatMessage({ id: 'placeholder.max32' })));
        }
    };

    generateEnglishName = (name) => {
        if (name != undefined && name !== '') {
            const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
            const cleanedPinyinName = pinyinName.toLowerCase();
            return cleanedPinyinName;
        }
        return '';
    };

    // 检查英文名是否与已存在组件冲突
    checkK8sNameConflict = (k8s_name) => {
        const { comNames } = this.state;
        return comNames && comNames.includes(k8s_name);
    };

    handleSubmit = e => {
        e.preventDefault();
        const { form, onSubmit } = this.props;
        const group_id = globalUtil.getGroupID();

        form.validateFields((err, fieldsValue) => {
            if (err) {
                return;
            }

            // 如果存在应用组ID，检查英文名是否与已有组件冲突
            if (group_id && fieldsValue.k8s_component_name) {
                if (this.checkK8sNameConflict(fieldsValue.k8s_component_name)) {
                    message.error('当前应用下英文名已存在，请更换');
                    return;
                }
            }

            // 如果没有 group_id，设置应用组相关字段
            if (!group_id) {
                if (!fieldsValue.group_name || !fieldsValue.k8s_app) {
                    fieldsValue.group_name = fieldsValue.service_cname;
                    fieldsValue.k8s_app = this.generateEnglishName(fieldsValue.service_cname);
                }
            } else {
                fieldsValue.group_id = group_id;
            }

            if (onSubmit) {
                onSubmit(fieldsValue);
            }
        });
    };

    render() {
        const { form, databaseTypes = [], loading } = this.props;
        const { getFieldDecorator, getFieldValue } = form;
        const group_id = globalUtil.getGroupID();

        return (
            <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
                <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
                    {getFieldDecorator('service_cname', {
                        initialValue: '',
                        rules: [
                            { required: true, message: formatMessage({ id: 'placeholder.service_cname' }) },
                            { max: 24, message: formatMessage({ id: 'placeholder.max24' }) }
                        ]
                    })(
                        <Input
                            placeholder={formatMessage({ id: 'placeholder.service_cname' })}
                        />
                    )}
                </Form.Item>

                <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
                    {getFieldDecorator('k8s_component_name', {
                        initialValue: this.generateEnglishName(getFieldValue('service_cname') || ''),
                        rules: [
                            { required: true, validator: this.handleValiateNameSpace }
                        ]
                    })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} />)}
                </Form.Item>

                <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.create.form.database_type.label' })}>
                    {getFieldDecorator('database_type', {
                        initialValue: databaseTypes[0] ? databaseTypes[0].value : '',
                        rules: [
                            { required: true, message: formatMessage({ id: 'kubeblocks.database.create.form.database_type.required' }) }
                        ]
                    })(
                        <Select placeholder={formatMessage({ id: 'kubeblocks.database.create.form.database_type.placeholder' })}>
                            {databaseTypes.map(type => (
                                <Option key={type.value} value={type.value}>{type.label}</Option>
                            ))}
                        </Select>
                    )}
                </Form.Item>

                {!group_id && <>
                    <Divider />
                    <div className="advanced-btn" style={{ justifyContent: 'flex-start', marginLeft: 2 }}>
                        <Button
                            type="link"
                            style={{ fontWeight: 500, fontSize: 18, padding: 0 }}
                            onClick={() => this.setState({ showAdvanced: !this.state.showAdvanced })}
                        >
                            {formatMessage({ id: 'kubeblocks.database.create.form.advanced.title' })} {this.state.showAdvanced ? <span style={{ fontSize: 16 }}>&#94;</span> : <span style={{ fontSize: 16 }}>&#8964;</span>}
                        </Button>
                    </div>
                    {this.state.showAdvanced && (
                        <div
                            className="userpass-card"
                            style={{
                                margin: '24px 0',
                                background: '#fafbfc',
                                border: '1px solid #e6e6e6',
                                borderRadius: 8,
                                boxShadow: '0 2px 8px #f0f1f2',
                                padding: 24,
                            }}>
                            <div className="advanced-divider" style={{ margin: '0 0 16px 0' }} />
                            <Form.Item
                                label={formatMessage({ id: 'popover.newApp.appName' })}
                                colon={false}
                                {...formItemLayout}
                                style={{ marginBottom: 18 }}
                            >
                                {getFieldDecorator('group_name', {
                                    initialValue: getFieldValue('service_cname') || '',
                                    rules: [
                                        { required: true, message: formatMessage({ id: 'popover.newApp.appName.placeholder' }) },
                                        {
                                            max: 24,
                                            message: formatMessage({ id: 'placeholder.max24' })
                                        }
                                    ]
                                })(<Input
                                    placeholder={formatMessage({ id: 'popover.newApp.appName.placeholder' })}
                                    style={{
                                        borderRadius: 6,
                                        height: 40,
                                        fontSize: 15,
                                        boxShadow: '0 1px 3px #f0f1f2',
                                        border: '1px solid #e6e6e6',
                                        transition: 'border 0.2s, box-shadow 0.2s'
                                    }}
                                />)}
                            </Form.Item>
                            <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
                                {getFieldDecorator('k8s_app', {
                                    initialValue: this.generateEnglishName(getFieldValue('group_name') || ''),
                                    rules: [
                                        { required: true, message: formatMessage({ id: 'placeholder.k8s_component_name' }) },
                                        { validator: this.handleValiateNameSpace }
                                    ]
                                })(<Input
                                    placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })}
                                    style={{
                                        borderRadius: 6,
                                        height: 40,
                                        fontSize: 15,
                                        boxShadow: '0 1px 3px #f0f1f2',
                                        border: '1px solid #e6e6e6',
                                        transition: 'border 0.2s, box-shadow 0.2s'
                                    }}
                                />)}
                            </Form.Item>
                        </div>
                    )}
                </>}

                <Form.Item style={{ textAlign: 'center', marginTop: '32px' }}>
                    <Button
                        type="primary"
                        size="large"
                        loading={loading}
                        htmlType="submit"
                        style={{ minWidth: '120px' }}
                    >
                        {formatMessage({ id: 'kubeblocks.database.create.form.button.next' })}
                    </Button>
                </Form.Item>
            </Form>
        );
    }
} 