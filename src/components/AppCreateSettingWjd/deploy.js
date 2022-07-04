import {
    Affix,
    Button,
    Card,
    Col,
    Form,
    Icon,
    Input,
    notification,
    Radio,
    Row,
    Table,
    Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import AddOrEditVolume from '../../components/AddOrEditVolume';
import AddPort from '../../components/AddPort';
import AddRelation from '../../components/AddRelation';
import AddRelationMnt from '../../components/AddRelationMnt';
import ConfirmModal from '../../components/ConfirmModal';
import EditPortAlias from '../../components/EditPortAlias';
import EnvironmentVariable from '../../components/EnvironmentVariable';
import NoPermTip from '../../components/NoPermTip';
import Port from '../../components/Port';
import ViewRelationInfo from '../../components/ViewRelationInfo';
import {
    addMnt,
    batchAddRelationedApp,
    getMnt,
    getRelationedApp,
    removeRelationedApp
} from '../../services/app';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import { getVolumeTypeShowName } from '../../utils/utils';
import CodeBuildConfig from '../CodeBuildConfig';
import styles from './deploy.less';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

@connect(null, null, null, { withRef: true })
@Form.create()
class BaseInfo extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            memoryList: [
                {
                    text: '64M',
                    value: 64
                },
                {
                    text: '128M',
                    value: 128
                },
                {
                    text: '256M',
                    value: 256
                },
                {
                    text: '512M',
                    value: 512
                },
                {
                    text: '1G',
                    value: 1024
                },
                {
                    text: '2G',
                    value: 1024 * 2
                },
                {
                    text: '4G',
                    value: 1024 * 4
                },
                {
                    text: '8G',
                    value: 1024 * 8
                },
                {
                    text: '16G',
                    value: 1024 * 16
                }
            ],
            other: false
        };
    }
    //确认修改
    handleSubmit = () => {
        const { form, onSubmit } = this.props;
        console.log(this.props)
        form.validateFields((err, fieldsValue) => {
            if (!err && onSubmit) {
                console.log(fieldsValue);
                return;
                onSubmit(fieldsValue);
            }
        });
    };
    //展示其他
    showOther = other => {
        // const other = this.state.other;
        if (!other) {
            this.setState({ other: true });
        } else {
            this.setState({ other: false });
        }
    };
    //
    hideOther = () => {
        this.setState({ other: false });
    }

    render() {
        const { appDetail, form } = this.props;
        const { getFieldDecorator } = form;
        const {
            extend_method: extendMethod,
            min_memory: minMemory,
            min_cpu: minCpu,
            // minExample:"2",
        } = appDetail.service;
        const list = this.state.memoryList;
        const other = this.state.other;
        console.log("other" + other);
        const radioStyle = {
            display: 'block',
            height: '30px',
            lineHeight: '30px'
        };
        const formItemLayout = {
            labelCol: {
                xs: {
                    span: 24
                },
                sm: {
                    span: 3
                }
            },
            wrapperCol: {
                xs: {
                    span: 24
                },
                sm: {
                    span: 21
                }
            }
        };
        return (
            <Card
                title="部署属性"
                style={{
                    marginBottom: 16
                }}
            >
                <Form.Item {...formItemLayout} label="组件类型">
                    {getFieldDecorator('extend_method', {
                        initialValue: extendMethod || 'stateless_multiple',
                        rules: [
                            {
                                required: false,
                                message: '请输入组件类型'
                            }
                        ]
                    })(
                        <Input
                            style={{ width: '200px' }}
                            type="string"
                            // min={0}
                            // addonAfter="m"
                            placeholder=""
                        />
                    )}
                </Form.Item>
                <Form.Item {...formItemLayout} label="实例数">
                    {getFieldDecorator('min_example', {
                        // initialValue: minExample || 1,
                        rules: [
                            {
                                required: false,
                                message: '请输入实例数'
                            },
                            {
                                pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                                message: '只允许输入整数'
                            }
                        ]
                    })(
                        <Input
                            style={{ width: '200px' }}
                            type="number"
                            min={0}
                            placeholder="请输入实例数"
                        />
                    )}
                </Form.Item>
                <Form.Item {...formItemLayout} label="内存">
                    {!other && (
                        <div>
                            {getFieldDecorator('min_memory', {
                                initialValue: minMemory || 0,
                                rules: [
                                    {
                                        required: false,
                                        message: '请选择内存'
                                    }
                                ]
                            })(
                                <RadioGroup>
                                    <RadioButton key={0} value={0}>
                                        不限制
                                    </RadioButton>
                                    {minMemory < list[0].value && minMemory != 0 ? (
                                        <RadioButton value={minMemory}>{minMemory}M</RadioButton>
                                    ) : null}
                                    {list.map((item, index) => {
                                        return (
                                            <RadioButton key={index} value={item.value}>
                                                {item.text}
                                            </RadioButton>
                                        );
                                    })}
                                    <div style={{ display: "inline-block", margin: "0 20px 0 20px" }} onClick={() => this.showOther(other)}>其他</div>
                                </RadioGroup>
                            )}
                        </div>
                    )}

                    {other && (
                        <div style={{ display: "inline-block" }} className={styles.memoryInputCard}>
                            {/* {getFieldDecorator('min_memory', {
                                initialValue: minMemory || 0,
                                rules: [
                                    {
                                        required: false,
                                        message: '请选择内存'
                                    }
                                ]
                            })( */}
                            <div style={{ display: 'inline-block' }} onClick={this.hideOther}>
                                <RadioGroup>
                                    <RadioButton key={0} value={0}>
                                        不限制
                                    </RadioButton>
                                    {minMemory < list[0].value && minMemory != 0 ? (
                                        <RadioButton value={minMemory}>{minMemory}M</RadioButton>
                                    ) : null}
                                    {list.map((item, index) => {
                                        return (
                                            <RadioButton key={index} value={item.value}>
                                                {item.text}
                                            </RadioButton>
                                        );
                                    })}
                                </RadioGroup>
                            </div>
                            {/* )} */}
                            <div style={{ display: "inline-block", margin: "0 20px 0 20px" }} onClick={() => this.showOther(other)}>其他</div>

                            {getFieldDecorator('min_memory', {
                                initialValue: minMemory || 0,
                                rules: [
                                    {
                                        required: false,
                                        message: '请选择内存'
                                    }
                                ]
                            })(
                                <Input
                                    style={{ width: '200px', lineHeight: "normal" }}
                                    className={styles.memoryInput}
                                    type="number"
                                    min={0}
                                    addonAfter="m"
                                    placeholder="请输入内存"
                                />
                            )}
                        </div>
                    )}
                </Form.Item>

                <Form.Item {...formItemLayout} label="CPU">
                    {getFieldDecorator('min_cpu', {
                        initialValue: minCpu || 0,
                        rules: [
                            {
                                required: false,
                                message: '请输入CPU'
                            },
                            {
                                pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                                message: '只允许输入整数'
                            }
                        ]
                    })(
                        <Input
                            style={{ width: '200px' }}
                            type="number"
                            min={0}
                            addonAfter="m"
                            placeholder="请输入CPU"
                        />
                    )}
                </Form.Item>
                {/* <Row>
                    <Col span="5" />
                    <Col span="19">
                        <Button onClick={this.handleSubmit} type="primary">
                            确认修改
                        </Button>
                    </Col>
                </Row> */}
            </Card >
        );
    }
}
//  部署属性
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class RenderDeploy extends PureComponent {
    constructor(arg) {
        super(arg);
        this.state = {
            runtimeInfo: ''
        };
    }
    componentDidMount() {
        this.getRuntimeInfo();
    }

    getRuntimeInfo = () => {
        this.props.dispatch({
            type: 'appControl/getRuntimeBuildInfo',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias
            },
            callback: data => {
                if (data) {
                    this.setState({ runtimeInfo: data.bean ? data.bean : {} });
                }
            }
        });
    };
    handleEditRuntime = (build_env_dict = {}) => {
        this.props.dispatch({
            type: 'appControl/editRuntimeBuildInfo',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias,
                build_env_dict
            },
            callback: res => {
                if (res && res.status_code === 200) {
                    notification.success({ message: '修改成功' });
                    this.getRuntimeInfo();
                }
            }
        });
    };
    handleEditInfo = (val = {}) => {
        this.props.dispatch({
            type: 'appControl/editAppCreateInfo',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias,
                ...val
            },
            callback: data => {
                if (data) {
                    this.props.updateDetail();
                    notification.success({ message: '更新成功' });
                }
            }
        });
    };
    render() {
        const {
            visible,
            appDetail,
            componentPermissions: { isDeploytype, isSource }
        } = this.props;
        const { runtimeInfo } = this.state;
        if (!runtimeInfo) return null;
        const language = appUtil.getLanguage(appDetail);

        return (
            <div
                style={{
                    display: visible ? 'block' : 'none'
                }}
            >
                {!isDeploytype && !isSource && <NoPermTip />}
                {isDeploytype && (
                    <BaseInfo appDetail={appDetail} onSubmit={this.handleEditInfo} />
                )}

                {language && runtimeInfo && isSource && (
                    <CodeBuildConfig
                        appDetail={this.props.appDetail}
                        onSubmit={this.handleEditRuntime}
                        language={language}
                        runtimeInfo={this.state.runtimeInfo}
                    />
                )}
            </div>
        );
    }
}
// eslint-disable-next-line react/no-multi-comp
@connect(
    ({ teamControl }) => ({
        currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
    }),
    null,
    null,
    {
        withRef: true
    }
)
export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            componentPermissions: this.handlePermissions('queryComponentInfo'),
            type: 'property'
        };
    }
    getAppAlias() {
        return this.props.match.params.appAlias;
    }
    handleType = type => {
        if (this.state.type !== type) {
            this.setState({ type });
        }
    };
    handlePermissions = type => {
        const { currentTeamPermissionsInfo } = this.props;
        return roleUtil.querySpecifiedPermissionsInfo(
            currentTeamPermissionsInfo,
            type
        );
    };
    render() {
        const { appDetail } = this.props;
        const { componentPermissions } = this.state;

        return (
            <div>
                <RenderDeploy
                    updateDetail={this.props.updateDetail}
                    appDetail={appDetail}
                    // visible={type === 'deploy'}
                    visible={true}
                    componentPermissions={componentPermissions}
                />

            </div>
        );
    }
}


