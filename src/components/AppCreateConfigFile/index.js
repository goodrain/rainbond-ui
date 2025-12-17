import {
  Button,
  Card,
  Col,
  Form,
  Input,
  notification,
  Radio,
  Row,
  Select,
  AutoComplete,
  Slider
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import Port from '../../components/Port';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import sourceUtil from '../../utils/source';
import cookie from '@/utils/cookie';
import CodeBuildConfig from '../CodeBuildConfig';
import PriceCard from '../../components/PriceCard';
import handleAPIError from '../../utils/error';
import styles from './setting.less';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Option } = Select;
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
      isComponentType: methods !== 'stateless_multiple',
      isMemory: props.appDetail.service.min_memory !== 0,
      isCpu: props.appDetail.service.min_cpu !== 0,
      setUnit: (props.appDetail.service.min_memory % 1024 === 0) ? 'G' : 'M',
      memorySliderMin: 1,
      memorySliderMax: 8,
      cpuSliderMin: 1,
      cpuSliderMax: 7,
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
      cpuValue: 0,
      memoryValue: 0,
      isCustomMemory: false,
      isCustomCpu: false,
      customMemoryValue: '',
      customCpuValue: '',
      customMemoryUnit: 'GB', // 默认单位为GB
      customMemoryError: '' // 内存输入错误信息
    };
  }
  componentDidMount() {
    const { onRefCpu, appDetail, showEnterprisePlugin } = this.props
    if (!showEnterprisePlugin) {
      this.setState({
        memoryMarks: { 0: formatMessage({ id: 'appOverview.no_limit' }), ...this.state.memoryMarks, 9:'32G', 10: '自定义' },
        cpuMarks: { 0: formatMessage({ id: 'appOverview.no_limit' }), ...this.state.cpuMarks, 8:'16Core', 9: '自定义' },
        memoryMarksObj: { 0: 0, ...this.state.memoryMarksObj, 32768: 9, 'custom': 10 },
        cpuMarksObj: { 0: 0, ...this.state.cpuMarksObj, 16000: 8, 'custom': 9 },
        memorySliderMax: 10,
        memorySliderMin: 0,
        cpuSliderMax: 9,
        cpuSliderMin: 0
      })
    }
    setTimeout(() => {
      const memoryValue = this.checkNum(appDetail.service.min_memory, 'memory');
      const cpuValue = this.checkNum(appDetail.service.min_cpu, 'cpu');
      const isCustomMemory = memoryValue === 10;
      const isCustomCpu = cpuValue === 9;

      // 智能选择内存单位
      let memoryUnit = 'MB';
      let memoryDisplayValue = '';
      if (isCustomMemory && appDetail.service.min_memory > 0) {
        const memoryValueRaw = appDetail.service.min_memory;
        if (memoryValueRaw >= 1024) {
          const gbValue = memoryValueRaw / 1024;
          // 如果GB值是整数或者小数位不超过2位的简单小数，使用GB
          if (Number.isInteger(gbValue) || parseFloat(gbValue.toFixed(2)) === gbValue) {
            memoryUnit = 'GB';
            memoryDisplayValue = gbValue.toString();
          } else {
            memoryUnit = 'MB';
            memoryDisplayValue = memoryValueRaw.toString();
          }
        } else {
          memoryUnit = 'MB';
          memoryDisplayValue = memoryValueRaw.toString();
        }
      }

      this.setState({
        cpuValue: cpuValue,
        memoryValue: memoryValue,
        isCustomMemory: isCustomMemory,
        isCustomCpu: isCustomCpu,
        customMemoryValue: memoryDisplayValue,
        customCpuValue: isCustomCpu ? (appDetail.service.min_cpu / 1000).toString() : '',
        customMemoryUnit: memoryUnit
      })
    }, 10)
    if (onRefCpu) {
      this.props.onRefCpu(this)
    }
  }

  handleSubmitCpu = () => {
    const { setUnit, memoryMarksObj, cpuMarksObj, isCustomMemory, isCustomCpu, customMemoryValue, customCpuValue, customMemoryUnit } = this.state
    const { form, onSubmit, showEnterprisePlugin } = this.props;

    // 如果是自定义内存，先进行验证
    if (isCustomMemory) {
      if (!this.validateCustomMemory()) {
        // 验证失败，返回 false
        return false;
      }
    }

    let submitSuccess = true;

    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit && fieldsValue) {
        // 处理自定义内存值
        if (isCustomMemory) {
          // 再次验证以确保数据有效
          if (!this.validateCustomMemory()) {
            submitSuccess = false;
            return;
          }
          const memValue = parseFloat(customMemoryValue);
          // 根据单位转换为MB
          fieldsValue.min_memory = customMemoryUnit === 'GB' ? memValue * 1024 : memValue;
        } else {
          Object.keys(memoryMarksObj).forEach(item => {
            if (memoryMarksObj[item] == fieldsValue.min_memory) {
              fieldsValue.min_memory = item
            }
          })
        }

        // 处理自定义CPU值
        if (isCustomCpu) {
          if (customCpuValue && customCpuValue !== '') {
            fieldsValue.min_cpu = parseFloat(customCpuValue) * 1000; // 转换Core为m
          } else {
            notification.warning({ message: '请输入自定义CPU值' });
            return;
          }
        } else {
          Object.keys(cpuMarksObj).forEach(item => {
            if (cpuMarksObj[item] == fieldsValue.min_cpu) {
              fieldsValue.min_cpu = item
            }
          })
        }
        
        if (!fieldsValue.extend) {
          fieldsValue.extend_method = 'stateless_multiple'
        }
        onSubmit(fieldsValue);
      } else {
        submitSuccess = false;
      }
    });

    return submitSuccess;
  };

  onChecks = (e) => {
    const { appDetail, handleBuildSwitch } = this.props;
    const {
      extend_method: extendMethod,
    } = appDetail.service;
    if (e.target.value !== extendMethod) {
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
    const { appDetail } = this.props;
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
    const { appDetail } = this.props;
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
      9: 8,
      10: 9  // 自定义选项对应的CPU值
    };
    const newCpuValue = memoryToCpuMap[value] !== undefined ? memoryToCpuMap[value] : 8;
    const isCustom = value === 10;
    this.setState({
      memoryValue: value,
      cpuValue: newCpuValue,
      isCustomMemory: isCustom,
      isCustomCpu: isCustom  // 当选择自定义内存时，CPU也自动变为自定义
    }, () => {
      // 更新表单中的 CPU 值
      const { form } = this.props;
      form.setFieldsValue({
        min_cpu: newCpuValue
      });
    });
  }
  handleCpuChange = (value) => {
    const isCustom = value === 9;
    this.setState({
      cpuValue: value,
      isCustomCpu: isCustom
    });
  }
  
  handleCustomMemoryChange = (e) => {
    const value = e.target.value;

    // 实时更新输入值，验证在 validateCustomMemory 中处理
    this.setState({
      customMemoryValue: value,
      customMemoryError: '' // 清除错误信息
    });
  }

  // 验证自定义内存值
  validateCustomMemory = () => {
    const { customMemoryValue, customMemoryUnit } = this.state;

    // 如果为空，显示错误
    if (!customMemoryValue || customMemoryValue === '') {
      this.setState({
        customMemoryError: '请输入内存值'
      });
      return false;
    }

    const numValue = parseFloat(customMemoryValue);

    // 验证是否为有效数字
    if (isNaN(numValue)) {
      this.setState({
        customMemoryError: '请输入有效的数字'
      });
      return false;
    }

    // 不允许负数或零
    if (numValue <= 0) {
      this.setState({
        customMemoryError: '内存值必须大于0'
      });
      return false;
    }

    // MB单位时必须是整数
    if (customMemoryUnit === 'MB') {
      if (!Number.isInteger(numValue)) {
        this.setState({
          customMemoryError: 'MB单位时请输入整数'
        });
        return false;
      }
      if (numValue < 1) {
        this.setState({
          customMemoryError: 'MB单位时最小值为 1 MB'
        });
        return false;
      }
      if (numValue > 1048576) {
        this.setState({
          customMemoryError: '内存不能超过 1048576 MB'
        });
        return false;
      }
    }

    // GB单位时的验证
    if (customMemoryUnit === 'GB') {
      if (numValue < 1) {
        this.setState({
          customMemoryError: 'GB单位时最小值为 1 GB'
        });
        return false;
      }
      if (numValue > 1024) {
        this.setState({
          customMemoryError: '内存不能超过 1024 GB'
        });
        return false;
      }
    }

    // 验证通过
    this.setState({
      customMemoryError: ''
    });
    return true;
  }

  // 内存单位切换处理
  handleMemoryUnitChange = (value) => {
    const { customMemoryValue, customMemoryUnit } = this.state;

    // 如果有输入值，进行单位转换
    if (customMemoryValue && customMemoryValue !== '') {
      const numValue = parseFloat(customMemoryValue);
      let convertedValue = '';

      if (customMemoryUnit === 'GB' && value === 'MB') {
        // GB 转换为 MB
        convertedValue = (numValue * 1024).toString();
      } else if (customMemoryUnit === 'MB' && value === 'GB') {
        // MB 转换为 GB
        const gbValue = numValue / 1024;
        // 保留最多2位小数
        convertedValue = gbValue.toFixed(2);
        // 去除不必要的小数位
        convertedValue = parseFloat(convertedValue).toString();
      }

      this.setState({
        customMemoryUnit: value,
        customMemoryValue: convertedValue,
        customMemoryError: '' // 清除错误信息
      }, () => {
        // 切换单位后重新验证
        this.validateCustomMemory();
      });
    } else {
      this.setState({
        customMemoryUnit: value,
        customMemoryError: ''
      });
    }
  }
  
  handleCustomCpuChange = (e) => {
    this.setState({
      customCpuValue: e.target.value
    });
  }
  checkNum = (value, type) => {
    const { memoryMarksObj, cpuMarksObj } = this.state
    const { showEnterprisePlugin } = this.props
    let num = 0
    if (type == 'memory') {
      Object.keys(memoryMarksObj).forEach(item => {
        if (item == value) {
          num = memoryMarksObj[item]
        }
      })
      // 如果没有匹配到预设值且不是企业版，则认为是自定义值
      if (num === 0 && value > 0 && !showEnterprisePlugin) {
        num = 10; // 自定义选项的滑块位置
      }
    }
    if (type == 'cpu') {
      Object.keys(cpuMarksObj).forEach(item => {
        if (item == value) {
          num = cpuMarksObj[item]
        }
      })
      // 如果没有匹配到预设值且不是企业版，则认为是自定义值
      if (num === 0 && value > 0 && !showEnterprisePlugin) {
        num = 9; // 自定义选项的滑块位置
      }
    }
    return num
  }
  getFormValues = (data, type) => {
    const { cpuMarksObj, memoryMarksObj, isCustomMemory, isCustomCpu, customMemoryValue, customCpuValue, customMemoryUnit } = this.state
    let num = 0
    if (type == 'memory') {
      if (isCustomMemory && data === 10) {
        if (customMemoryValue && customMemoryValue !== '') {
          // 自定义内存值，根据单位转换为MB
          num = customMemoryUnit === 'GB' ? parseFloat(customMemoryValue) * 1024 : parseFloat(customMemoryValue);
        } else {
          num = 0; // 如果没有输入值，返回0
        }
      } else {
        Object.keys(memoryMarksObj).forEach(item => {
          if (memoryMarksObj[item] == data) {
            num = item
          }
        })
      }
    } else {
      if (isCustomCpu && data === 9) {
        if (customCpuValue && customCpuValue !== '') {
          // 自定义CPU值，转换为m
          num = parseFloat(customCpuValue) * 1000;
        } else {
          num = 0; // 如果没有输入值，返回0
        }
      } else {
        Object.keys(cpuMarksObj).forEach(item => {
          if (cpuMarksObj[item] == data) {
            num = item
          }
        })
      }
    }
    return num
  }
  render() {
    const { appDetail, form, showEnterprisePlugin } = this.props;
    const {
      is_flag,
      setUnit,
      isComponentType,
      isMemory,
      isCpu,
      memoryMarks,
      cpuMarks,
      cpuValue,
      memoryValue,
      memorySliderMax,
      memorySliderMin,
      cpuSliderMax,
      cpuSliderMin,
      isCustomMemory,
      isCustomCpu,
      customMemoryValue,
      customCpuValue,
      customMemoryUnit,
      customMemoryError
    } = this.state
    const { getFieldDecorator } = form;
    const {
      extend_method: extendMethod,
      min_memory,
      min_cpu: minCpu
    } = appDetail.service;
    const method = appDetail && appDetail.service && appDetail.service.extend_method
    const extendMethods = method == 'state_singleton' ? 'state_multiple' : method == 'stateless_singleton' ? 'stateless_multiple' : method == 'job' ? 'job' : method == 'cronjob' ? 'cronjob' : method;
    const list = this.state.memoryList;
    const arrOption = [
      { name: formatMessage({ id: 'componentOverview.body.Strategy.hour' }), value: '0 * * * *' },
      { name: formatMessage({ id: 'componentOverview.body.Strategy.day' }), value: '0 0 * * *' },
      { name: formatMessage({ id: 'componentOverview.body.Strategy.week' }), value: '0 0 * * 0' },
      { name: formatMessage({ id: 'componentOverview.body.Strategy.month' }), value: '0 0 1 * *' },
      { name: formatMessage({ id: 'componentOverview.body.Strategy.year' }), value: '0 0 1 1 *' }
    ]
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
        <Row>
          <Col span={18}>
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
                          <AutoComplete.Option value={item.value}>
                            {item.name}
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
              {getFieldDecorator('min_memory', {
                initialValue: memoryValue,
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'placeholder.setting.min_memory' })
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
            {!showEnterprisePlugin && isCustomMemory && (
              <Form.Item
                {...formItemLayout}
                label={formatMessage({ id: 'componentOverview.body.Expansion.customMemory' })}
                validateStatus={customMemoryError ? 'error' : ''}
                help={customMemoryError}
              >
                <Input.Group compact>
                  <Input
                    style={{ width: '150px' }}
                    placeholder={customMemoryUnit === 'GB' ? '例如: 1.5' : '例如: 512'}
                    value={customMemoryValue}
                    onChange={this.handleCustomMemoryChange}
                    onBlur={this.validateCustomMemory}
                    type="number"
                    min={customMemoryUnit === 'GB' ? 1 : 1}
                    step={customMemoryUnit === 'GB' ? 0.1 : 1}
                  />
                  <Select
                    value={customMemoryUnit}
                    onChange={this.handleMemoryUnitChange}
                    style={{ width: 80 }}
                  >
                    <Option value="MB">MB</Option>
                    <Option value="GB">GB</Option>
                  </Select>
                </Input.Group>
              </Form.Item>
            )}
            <Form.Item {...formItemLayout} label={formatMessage({ id: 'componentCheck.advanced.setup.basic_info.label.min_cpu' })}>
              {getFieldDecorator('min_cpu', {
                initialValue: cpuValue,
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
            {!showEnterprisePlugin && isCustomCpu && (
              <Form.Item {...formItemLayout} label="自定义CPU">
                <Input
                  style={{ width: '200px' }}
                  placeholder="请输入CPU大小"
                  value={customCpuValue}
                  onChange={this.handleCustomCpuChange}
                  addonAfter="Core"
                  type="number"
                  min={0.1}
                  step={0.1}
                />
              </Form.Item>
            )}
          </Col>
          {showEnterprisePlugin && (
            <Col span={6}>
              <PriceCard
                key={cpuValue * memoryValue}
                type='card'
                cpu_use={this.getFormValues(cpuValue, 'cpu')}
                memory_use={this.getFormValues(memoryValue, 'memory')}
              />
            </Col>
          )}
        </Row>
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
          text: formatMessage({ id: 'Vm.createVm.2g' }),
          value: 2048
        },
        {
          text: formatMessage({ id: 'Vm.createVm.4g' }),
          value: 1024 * 4
        },
        {
          text: formatMessage({ id: 'Vm.createVm.8g' }),
          value: 1024 * 8
        },
        {
          text: formatMessage({ id: 'Vm.createVm.16g' }),
          value: 1024 * 16
        },
        {
          text: formatMessage({ id: 'Vm.createVm.Custom' }),
          value: "custom"
        }
      ],
      is_flag: false,
      setUnit: (props.appDetail.service.min_memory % 1024 === 0) ? 'G' : 'M',
      setUnitDisk: (props.appDetail.service.disk_cap % 1024 === 0) ? 'G' : 'M',
      memoryValue: props.appDetail && props.appDetail.service && props.appDetail.service.min_memory && this.handleMinMemory(props.appDetail.service.min_memory),
    }
  }

  componentDidMount() {
    const { onRefCpu, appDetail } = this.props
    if (onRefCpu) {
      this.props.onRefCpu(this)
    }
  }

  handleSubmitCpu = () => {
    const { setUnit } = this.state
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
    if (val !== 2048 && val !== 1024 * 4 && val !== 1024 * 8 && val !== 1024 * 16) {
      return "custom"
    } else {
      const { appDetail } = this.props;
      if (val === 2048 && appDetail.service.min_cpu === 2000) {
        return 2048
      } else if (val === 1024 * 4 && appDetail.service.min_cpu === 2000) {
        return 1024 * 4
      } else if (val === 1024 * 8 && appDetail.service.min_cpu === 4000) {
        return 1024 * 8
      } else if (val === 1024 * 16 && appDetail.service.min_cpu === 4000) {
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
          label={formatMessage({ id: 'Vm.createVm.specification' })}
          extra={memoryValue == "custom" && formatMessage({ id: 'Vm.createVm.distribution' })}
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
            label={formatMessage({ id: 'Vm.createVm.memory' })}
          >
            {getFieldDecorator('memory_value', {
              initialValue: (`${min_memory % 1024 === 0 ? min_memory / 1024 : min_memory}` * 1) || 0,
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
        <Form.Item {...formItemLayout} label={formatMessage({ id: 'Vm.createVm.disk' })}>
          {getFieldDecorator('disk_cap', {
            initialValue: (`${disk_cap % 1024 === 0 ? disk_cap / 1024 : disk_cap}` * 1) || 0,
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
    } = this.props;
    const isDeploytype = true;
    const isSource = true;
    const { runtimeInfo } = this.state
    const language = appUtil.getLanguage(appDetail);

    // 先执行 CPU 内存验证，如果验证失败则返回 false
    const cpuResult = this.childCpu.handleSubmitCpu()
    if (cpuResult === false) {
      return false
    }

    // 如果有语言运行时配置，也执行提交
    if (language && runtimeInfo && isSource) {
      this.child.handleSubmit()
    }

    return true
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
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  render() {
    const {
      appDetail,
      handleBuildSwitch,
      handleEditInfo,
      handleEditRuntime,
      showEnterprisePlugin
    } = this.props;
    const isDeploytype = true;
    const isSource = true;
    const { runtimeInfo } = this.state;
    const method = appDetail && appDetail.service && appDetail.service.extend_method
    if (!runtimeInfo) return null;
    const language = appUtil.getLanguage(appDetail);
    return (
      <div>
        {isDeploytype && (
          <>
            {method == 'vm' ? (
              <VirtualMachineBaseInfo onRefCpu={this.onRefCpu} onSubmit={handleEditInfo} handleBuildSwitch={handleBuildSwitch} appDetail={appDetail} showEnterprisePlugin={showEnterprisePlugin} />
            ) : (
              <BaseInfo onRefCpu={this.onRefCpu} appDetail={appDetail} onSubmit={handleEditInfo} handleBuildSwitch={handleBuildSwitch} showEnterprisePlugin={showEnterprisePlugin} />
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
    this.state = {};
  }
  componentDidMount() {
    //通过pros接收父组件传来的方法
    this.props.onRef(this)
  }
  onRef = (ref) => {
    this.child = ref
  }
  childFn = (e) => {
    // 调用子组件的方法并返回验证结果
    const result = this.child.childFn()
    return result
  }
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };

  render() {
    const { appDetail, handleBuildSwitch, handleEditInfo, handleEditRuntime, showEnterprisePlugin } = this.props;
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
              handleBuildSwitch={handleBuildSwitch}
              handleEditRuntime={handleEditRuntime}
              showEnterprisePlugin={showEnterprisePlugin}
              onRef={this.onRef}
            />
          </div>
        </div>
      </div>
    );
  }
}
