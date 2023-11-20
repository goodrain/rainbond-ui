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
  Tooltip,
  Select,
  AutoComplete
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddPort from '../../components/AddPort';
import AddRelation from '../../components/AddRelation';
import ScrollerX from '../../components/ScrollerX';
import AddRelationMnt from '../../components/AddRelationMnt';
import ConfirmModal from '../../components/ConfirmModal';
import EditPortAlias from '../../components/EditPortAlias';
import EnvironmentVariable from '../../components/EnvironmentVariable';
import NoPermTip from '../../components/NoPermTip';
import Port from '../../components/Port';
import ViewRelationInfo from '../../components/ViewRelationInfo';
import CustomFooter from "../../layouts/CustomFooter";
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
import sourceUtil from '../../utils/source';
import cookie from '@/utils/cookie';
import { getVolumeTypeShowName } from '../../utils/utils';
import CodeBuildConfig from '../CodeBuildConfig';
import styles from './setting.less';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Option, OptGroup } = Select;
@connect(null, null, null, { withRef: true })
@Form.create()
// 基础信息设置
class BaseInfo extends PureComponent {
  constructor(props) {
    super(props);
    const methods = props.appDetail && props.appDetail.service && props.appDetail.service.extend_method || 'stateless_multiple'
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
      is_flag: false,
      method: false,
      memory: false,
      cpu: false,
      isComponentType: methods !== 'stateless_multiple' ? true : false,
      isMemory: (props.appDetail.service.min_memory == 0) ? false : true,
      isCpu: (props.appDetail.service.min_cpu == 0) ? false : true,
      setUnit: (props.appDetail.service.min_memory % 1024 == 0) ? 'G' : 'M'
    };
  }
  componentDidMount() {
    const { onRefCpu } = this.props
    if (onRefCpu) {
      this.props.onRefCpu(this)
    }
  }

  handleSubmitCpu = () => {
    const { setUnit } = this.state
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit && fieldsValue) {
        if (fieldsValue.change_memory && fieldsValue.min_memory) {
          if (setUnit) {
            const memoryNum = setUnit == "G" ? fieldsValue.min_memory * 1024 : fieldsValue.min_memory
            fieldsValue.min_memory = memoryNum
          } else {
            const memoryNum = sourceUtil.getUnit(512) == "G" ? Number(fieldsValue.min_memory * 1024) : Number(fieldsValue.min_memory)
            fieldsValue.min_memory = memoryNum
          }
        } else {
          fieldsValue.min_memory = 0
        }
        if (!fieldsValue.change_cpu) {
          fieldsValue.min_cpu = 0
        }
        if (!fieldsValue.extend) {
          fieldsValue.extend_method = 'stateless_multiple'
        }
        onSubmit(fieldsValue);
      }
    });
  };

  onChecks = (e) => {
    const { appDetail, form, handleBuildSwitch } = this.props;
    const { method, memory, cpu } = this.state;
    const {
      extend_method: extendMethod,
    } = appDetail.service;
    if (e.target.value != extendMethod) {
      this.setState({
        method: true
      }, () => {
        this.handleSwitch()
      })

    } else {
      this.setState({
        method: false
      }, () => {
        this.handleSwitch()
      })
    }
    if (e.target.value === 'cronjob') {
      this.setState({
        is_flag: true
      })
    } else {
      this.setState({
        is_flag: false
      })
    }
  }

  RadioGroupChange = (e) => {
    const { appDetail, handleBuildSwitch } = this.props;
    const {
      min_memory: minMemory,
    } = appDetail.service;
    if (e.target.value != minMemory) {
      this.setState({
        memory: true
      }, () => {
        this.handleSwitch()
      })
    } else {
      this.setState({
        memory: false
      }, () => {
        this.handleSwitch()
      })
    }
  }
  inputChange = (e) => {
    const { appDetail, handleBuildSwitch } = this.props;
    const {
      min_cpu: minCpu
    } = appDetail.service;
    if (e.target.value != minCpu) {
      this.setState({
        cpu: true
      }, () => {
        this.handleSwitch()
      })
    } else {
      this.setState({
        cpu: false
      }, () => {
        this.handleSwitch()
      })
    }
  }
  handleSwitch = () => {
    const { handleBuildSwitch } = this.props
    const { method, memory, cpu } = this.state;
    handleBuildSwitch((method || memory || cpu))
  }
  selectAfterChange = (val) => {
    this.setState({
      setUnit: val
    })
  }
  // 组件类型
  RadioChangeComponentType = (e) => {
    if (!e.target.value) {
      this.setState({
        is_flag: false
      })
    }
    this.setState({
      isComponentType: e.target.value
    })
  }
  // CPU
  RadioGroupChangeCpu = (e) => {
    this.setState({
      isCpu: e.target.value
    })
  }
  // 内存
  RadioGroupChangeMemory = (e) => {
    this.setState({
      isMemory: e.target.value
    })
  }

  render() {
    const { appDetail, form } = this.props;
    const { is_flag, setUnit, isComponentType, isMemory, isCpu } = this.state
    const { getFieldDecorator } = form;
    const {
      extend_method: extendMethod,
      min_memory,
      min_cpu: minCpu
    } = appDetail.service;
    const method = appDetail && appDetail.service && appDetail.service.extend_method
    const extendMethods = method == 'state_singleton' ? 'state_multiple' : method == 'stateless_singleton' ? 'stateless_multiple' : method == 'job' ? 'job' : method == 'cronjob' ? 'cronjob' : method;
    const list = this.state.memoryList;
    const arrOption = ['0 * * * *', '0 0 * * *', '0 0 * * 0', '0 0 1 * *', '0 0 1 1 *']
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
        title={formatMessage({ id: 'componentCheck.advanced.setup.basic_info' })}
        style={{
          marginBottom: 16
        }}
      >
        <Form.Item style={{ marginTop: '6px' }} {...formItemLayout} label={formatMessage({ id: 'componentCheck.advanced.setup.basic_info.label.extend_method' })}>
          {getFieldDecorator('extend', {
            initialValue: method !== 'stateless_multiple' ? true : false,
            rules: [
              {
                required: true,
                message: formatMessage({ id: 'placeholder.setting.extend_method' })
              }
            ]
          })(
            <RadioGroup onChange={this.RadioChangeComponentType}>
              <RadioButton key='default' value={false}>
                {formatMessage({ id: 'componentCheck.advanced.setup.deploy_attr.Stateless_type' })}
              </RadioButton>
              <RadioButton key='rest' value={true}>
                {formatMessage({ id: 'componentCheck.advanced.setup.deploy_attr.Other_types' })}
              </RadioButton>
            </RadioGroup>
          )}
        </Form.Item>
        {isComponentType && <Form.Item style={{ paddingLeft: '160px' }} {...formItemLayout}>
          {getFieldDecorator('extend_method', {
            initialValue: extendMethods,
            rules: [
              {
                required: true,
                message: formatMessage({ id: 'placeholder.setting.extend_method' })
              }
            ]
          })(
            <RadioGroup>
              {globalUtil.getSupportComponentTyps().map(item => {
                return (
                  <Radio key={item.type} onChange={this.onChecks} style={radioStyle} value={item.type}>
                    {item.desc}
                  </Radio>
                );
              })}
            </RadioGroup>
          )}
        </Form.Item>}
        {is_flag && <Form.Item {...formItemLayout}>
          {getFieldDecorator('schedule', {
            initialValue: '0 * * * *',
            rules: [
              {
                required: false,
                message: formatMessage({ id: 'placeholder.setting.schedule' })
              }
            ]
          })(
            <Row className={styles.selectRow} type="flex" style={{ margin: '14px 0px', marginTop: '-20px' }}>
              <div style={{ marginLeft: '160px', fontWeight: 'bolder', marginTop: '-4px' }}>
                {formatMessage({ id: 'componentCheck.advanced.setup.basic_info.label.schedule' })}
              </div>
              <AutoComplete
                defaultValue={'0 * * * *'}
              >
                {(arrOption.length > 0)
                  ? arrOption.map((item) => {
                    const res = (
                      <AutoComplete.Option value={item}>
                        {item}
                      </AutoComplete.Option>
                    );
                    return res;
                  })
                  : null}
              </AutoComplete>
            </Row>
          )}
        </Form.Item>
        }
        <Form.Item {...formItemLayout} label={formatMessage({ id: 'componentCheck.advanced.setup.basic_info.label.min_memory' })}>
          {getFieldDecorator('change_memory', {
            initialValue: isMemory,
            rules: [
              {
                required: true,
              }
            ]
          })(
            <RadioGroup onChange={this.RadioGroupChangeMemory}>
              <RadioButton key='noLimitMemory' value={false}>
                {formatMessage({ id: 'componentCheck.advanced.setup.basic_info.label.noLimit' })}
              </RadioButton>
              <RadioButton key='limitMemory' value={true}>
                {formatMessage({ id: 'componentCheck.advanced.setup.basic_info.label.customize' })}
              </RadioButton>
            </RadioGroup>
          )}
        </Form.Item>
        {isMemory && <Form.Item style={{ paddingLeft: '149px' }}  {...formItemLayout}>
          {getFieldDecorator('min_memory', {
            initialValue: `${min_memory % 1024 == 0 ? min_memory / 1024 : min_memory}` || 0,
            rules: [
              {
                required: true,
                message: formatMessage({ id: 'placeholder.setting.min_memory' })
              }
            ]
          })(
            <Input
              style={{ width: '200px', marginTop: '3px', marginLeft: '12px' }}
              type="number"
              addonAfter={
                <Select value={setUnit ? setUnit : sourceUtil.getUnit(min_memory)} onChange={this.selectAfterChange}>
                  <Option value="M">M</Option>
                  <Option value="G">G</Option>
                </Select>
              }
            />
          )}

        </Form.Item>}
        <Form.Item {...formItemLayout} label={formatMessage({ id: 'componentCheck.advanced.setup.basic_info.label.min_cpu' })}>
          {getFieldDecorator('change_cpu', {
            initialValue: isCpu,
            rules: [
              {
                required: true,
                message: formatMessage({ id: 'placeholder.plugin.min_cpu' })
              }
            ]
          })(
            <RadioGroup onChange={this.RadioGroupChangeCpu}>
              <RadioButton key='noLimitCpu' value={false}>
                {formatMessage({ id: 'componentCheck.advanced.setup.basic_info.label.noLimit' })}
              </RadioButton>
              <RadioButton key='limitCpu' value={true}>
                {formatMessage({ id: 'componentCheck.advanced.setup.basic_info.label.customize' })}
              </RadioButton>
            </RadioGroup>
          )}
        </Form.Item>
        {isCpu && <Form.Item {...formItemLayout} style={{ paddingLeft: '160px' }} >
          {getFieldDecorator('min_cpu', {
            initialValue: minCpu || 0,
            rules: [
              {
                required: true,
                message: formatMessage({ id: 'placeholder.plugin.min_cpu' })
              },
              {
                pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                message: formatMessage({ id: 'placeholder.plugin.min_cpuMsg' })
              }
            ]
          })(
            <Input
              style={{ width: '200px' }}
              type="number"
              min={0}
              addonAfter="m"
              placeholder={formatMessage({ id: 'placeholder.plugin.min_cpu' })}
              onChange={this.inputChange}
            />
          )}
        </Form.Item>}
      </Card>
    );
  }
}

// 虚拟机基础信息配置
@connect(null, null, null, { withRef: true })
@Form.create()
class VirtualMachineBaseInfo extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      memoryList: [
        {
          text: formatMessage({id:'Vm.createVm.2g'}),
          value: 2048
        },
        {
          text: formatMessage({id:'Vm.createVm.4g'}),
          value: 1024 * 4
        },
        {
          text: formatMessage({id:'Vm.createVm.8g'}),
          value: 1024 * 8
        },
        {
          text: formatMessage({id:'Vm.createVm.16g'}),
          value: 1024 * 16
        },
        {
          text: formatMessage({id:'Vm.createVm.Custom'}),
          value: "custom"
        }
      ],
      is_flag: false,
      setUnit: (props.appDetail.service.min_memory % 1024 == 0) ? 'G' : 'M',
      setUnitDisk: (props.appDetail.service.disk_cap % 1024 == 0) ? 'G' : 'M',
      memoryValue: props.appDetail && props.appDetail.service && props.appDetail.service.min_memory && this.handleMinMemory(props.appDetail.service.min_memory),
    }
  }

  componentDidMount() {
    const { onRefCpu } = this.props
    if (onRefCpu) {
      this.props.onRefCpu(this)
    }
  }

  handleSubmitCpu = () => {
    const { setUnit, setUnitDisk } = this.state
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit && fieldsValue) {
        if (fieldsValue.min_memory == 'custom' && fieldsValue.memory_value) {
          if (setUnit) {
            const memoryNum = setUnit == "G" ? fieldsValue.memory_value * 1024 : fieldsValue.memory_value
            fieldsValue.min_memory = memoryNum
          } else {
            const memoryNum = sourceUtil.getUnit(512) == "G" ? Number(fieldsValue.memory_value * 1024) : Number(fieldsValue.memory_value)
            fieldsValue.min_memory = memoryNum
          }
          fieldsValue.min_cpu = Number(fieldsValue.min_cpu)
        } else {
          switch (fieldsValue.min_memory) {
            case 2048:
              fieldsValue.min_memory = 2048
              fieldsValue.min_cpu = 2000
              break;
            case 1024 * 4:
              fieldsValue.min_memory = 1024 * 4
              fieldsValue.min_cpu = 2000
              break;
            case 1024 * 8:
              fieldsValue.min_memory = 1024 * 8
              fieldsValue.min_cpu = 4000
              break;
            case 1024 * 16:
              fieldsValue.min_memory = 1024 * 16
              fieldsValue.min_cpu = 4000
              break;
            default:
              break;
          }
        }
        fieldsValue.disk_cap = fieldsValue.disk_cap * 1
        onSubmit(fieldsValue);
      }
    });
  };

  handleAfterChange = (val) => {
    this.setState({
      setUnit: val
    })
  }

  handleMemoryChange = (value) => {
    this.setState({
      memoryValue: value.target.value
    })
  }
  handleMinMemory = (val) => {
    if (val != 2048 && val != 1024 * 4 && val != 1024 * 8 && val != 1024 * 16) {
      return "custom"
    } else {
      const { appDetail } = this.props;
      if (val == 2048 && appDetail.service.min_cpu == 2000) {
        return 2048
      } else if (val == 1024 * 4 && appDetail.service.min_cpu == 2000) {
        return 1024 * 4
      } else if (val == 1024 * 8 && appDetail.service.min_cpu == 4000) {
        return 1024 * 8
      } else if (val == 1024 * 16 && appDetail.service.min_cpu == 4000) {
        return 1024 * 16
      }
    }
    return false
  }

  render() {
    const { appDetail, form } = this.props;
    const { getFieldDecorator } = form;
    const {
      extend_method: extendMethod,
      min_memory,
      min_cpu,
      disk_cap
    } = appDetail.service;
    const { setUnit, memoryValue, setUnitDisk } = this.state
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
    const list = this.state.memoryList;
    return (
      <Card
        title={formatMessage({ id: 'componentCheck.advanced.setup.basic_info' })}
        style={{
          marginBottom: 16
        }}
      >
        <Form.Item
          {...formItemLayout}
          label={formatMessage({id:'Vm.createVm.specification'})}
          extra={memoryValue == "custom" && formatMessage({id:'Vm.createVm.distribution'})}
        >
          {getFieldDecorator('min_memory', {
            initialValue: memoryValue || 0,
            rules: [
              {
                required: true,
              }
            ]
          })(
            <RadioGroup style={{ position: 'relative' }} onChange={this.handleMemoryChange}>
              {list.map((item, index) => {
                return (
                  <RadioButton key={index} value={item.value}>
                    {item.text}
                  </RadioButton>
                );
              })}

            </RadioGroup>
          )}
        </Form.Item>
        {memoryValue == "custom" &&
          <Form.Item {...formItemLayout} label='CPU'>
            {getFieldDecorator('min_cpu', {
              initialValue: min_cpu || 0,
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'placeholder.plugin.min_cpu' })
                }
              ]
            })(
              <Input
                style={{ width: '200px' }}
                type='number'
                addonAfter="m"
              />
            )}
          </Form.Item>
        }
        {memoryValue == "custom" &&
          <Form.Item
            {...formItemLayout}
            label={formatMessage({id:'Vm.createVm.memory'})}
          >
            {getFieldDecorator('memory_value', {
              initialValue: (`${min_memory % 1024 == 0 ? min_memory / 1024 : min_memory}` * 1) || 0,
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'placeholder.setting.min_memory' })
                }
              ]
            })(
              <Input
                style={{ width: '160px', margin: '4px 0px 0px 4px' }}
                addonAfter={
                  <Select value={setUnit ? setUnit : sourceUtil.getUnit(min_memory)} onChange={this.handleAfterChange}>
                    <Option value="M">M</Option>
                    <Option value="G">G</Option>
                  </Select>
                }
              />)}
          </Form.Item>
        }
        <Form.Item {...formItemLayout} label={formatMessage({id:'Vm.createVm.disk'})}>
          {getFieldDecorator('disk_cap', {
            initialValue: (`${disk_cap % 1024 == 0 ? disk_cap / 1024 : disk_cap}` * 1) || 0,
            rules: [
              {
                required: true,
                message: formatMessage({ id: 'placeholder.setting.min_memory' })
              }
            ]
          })(
            <Input
              style={{ width: '200px' }}
              type="number"
              min={1}
              addonAfter="GB"
            />
          )}
        </Form.Item>
      </Card>
    )
  }
}

// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class RenderDeploy extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      runtimeInfo: '',
      volumes: [],
      showAddVars: null,
      editor: null,
      toDeleteMnt: null,
      toDeleteVolume: null,
    };
  }
  componentDidMount() {
    this.getRuntimeInfo();
    this.props.onRef(this)
  }
  onRef = (ref) => {
    this.child = ref
  }
  onRefCpu = (ref) => {
    this.childCpu = ref
  }
  childFn = (e) => {
    const {
      appDetail,
      componentPermissions: { isDeploytype, isSource },
    } = this.props;
    const { runtimeInfo } = this.state
    const language = appUtil.getLanguage(appDetail);
    if (language && runtimeInfo && isSource) {
      this.child.handleSubmit()
    }
    this.childCpu.handleSubmitCpu()
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

  render() {
    const {
      visible,
      appDetail,
      componentPermissions: { isDeploytype, isSource },
      handleBuildSwitch,
      handleEditInfo,
      handleEditRuntime
    } = this.props;
    const { runtimeInfo, volumes } = this.state;
    const method = appDetail && appDetail.service && appDetail.service.extend_method
    if (!runtimeInfo) return null;
    const language = appUtil.getLanguage(appDetail);
    return (
      <div>
        {!isDeploytype && !isSource && <NoPermTip />}
        {isDeploytype && (
          <>

            {method == 'vm' ? (
              <VirtualMachineBaseInfo onRefCpu={this.onRefCpu} onSubmit={handleEditInfo} handleBuildSwitch={handleBuildSwitch} appDetail={appDetail} />
            ) : (
              <BaseInfo onRefCpu={this.onRefCpu} appDetail={appDetail} onSubmit={handleEditInfo} handleBuildSwitch={handleBuildSwitch} />
            )}
          </>
        )}
        {language && runtimeInfo && isSource && (
          <CodeBuildConfig
            appDetail={this.props.appDetail}
            onSubmit={handleEditRuntime}
            isBtn={false}
            language={language}
            runtimeInfo={this.state.runtimeInfo}
            onRef={this.onRef}
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
      type: 'deploy',
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  componentDidMount() {
    //通过pros接收父组件传来的方法
    this.props.onRef(this)
  }
  onRef = (ref) => {
    this.child = ref
  }
  childFn = (e) => {
    this.child.childFn()
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
    const { appDetail, handleBuildSwitch, handleEditInfo, handleEditRuntime } = this.props;
    const { type, componentPermissions, language } = this.state;
    return (
      <div>
        <div
          style={{
            overflow: 'hidden'
          }}
        >
          <div
            className={styles.content}
            style={{
              overflow: 'hidden',
              marginBottom: 40
            }}
          >
            <RenderDeploy
              updateDetail={this.props.updateDetail}
              handleEditInfo={handleEditInfo}
              appDetail={appDetail}
              componentPermissions={componentPermissions}
              handleBuildSwitch={handleBuildSwitch}
              handleEditRuntime={handleEditRuntime}
              onRef={this.onRef}
            />
          </div>
        </div>
      </div>
    );
  }
}
