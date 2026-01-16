import { Button, Form, Input, Divider, message, Icon } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import { pinyin } from 'pinyin-pro';
import globalUtil from '../../utils/global';
import handleAPIError from '../../utils/error';
import styles from '../../pages/Create/Index.less';
import {
  getServiceNameRules,
  getK8sComponentNameRules,
  getGroupNameRules,
  getK8sAppRules
} from './validations';

const formItemLayout = {
  labelCol: {
    span: 24
  },
  wrapperCol: {
    span: 24
  }
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
        const group_id = this.props.groupId || globalUtil.getGroupID();
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
            },
            handleError: err => {
                handleAPIError(err);
            }
        });
    };

    generateEnglishName = (name) => {
        if (name !== undefined && name !== '') {
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
        const group_id = this.props.groupId || globalUtil.getGroupID();

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
        const group_id = this.props.groupId || globalUtil.getGroupID();        
        return (
            <Form onSubmit={this.handleSubmit} layout="vertical" hideRequiredMark>
                <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
                    {getFieldDecorator('service_cname', {
                        initialValue: '',
                        rules: getServiceNameRules()
                    })(
                        <Input
                            placeholder={formatMessage({ id: 'placeholder.service_cname' })}
                        />
                    )}
                </Form.Item>

                <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
                    {getFieldDecorator('k8s_component_name', {
                        initialValue: this.generateEnglishName(getFieldValue('service_cname') || ''),
                        rules: getK8sComponentNameRules()
                    })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} />)}
                </Form.Item>


                {!group_id && <>
                    <div className="advanced-btn">
                        <Button
                            type="link"
                            style={{
                                fontWeight: 500,
                                fontSize: 14,
                                padding: '0px 0',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#1890ff'
                            }}
                            onClick={() => this.setState({ showAdvanced: !this.state.showAdvanced })}
                        >
                            <Icon type={this.state.showAdvanced ? "up" : "down"}  />
                            {formatMessage({ id: 'kubeblocks.database.create.form.advanced.title' })}
                        </Button>
                    </div>
                    {this.state.showAdvanced && (
                        <div
                            className="userpass-card">
                            <div className="advanced-divider" style={{ margin: '0 0 10px 0' }} />
                            <Form.Item
                                label={formatMessage({ id: 'popover.newApp.appName' })}
                                colon={false}
                                {...formItemLayout}
                                style={{ marginBottom: 18 }}
                            >
                                {getFieldDecorator('group_name', {
                                    initialValue: getFieldValue('service_cname') || '',
                                    rules: getGroupNameRules()
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
                            <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.k8s_app_name' })}>
                                {getFieldDecorator('k8s_app', {
                                    initialValue: this.generateEnglishName(getFieldValue('group_name') || ''),
                                    rules: getK8sAppRules()
                                })(<Input
                                    placeholder={formatMessage({ id: 'placeholder.appEngName' })}
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

            </Form>
        );
    }
} 