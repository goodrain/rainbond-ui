import { Button, Form, Icon, Input, Modal, Radio, Select, Switch, Tooltip } from 'antd';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import {
  FRAMEWORK_ICONS,
  NODEJS_FRAMEWORKS,
  getStaticFrameworks,
  getServerFrameworks,
  getFrameworkByValue,
  FRAMEWORK_NAME_MAP,
  matchFramework
} from '@/utils/nodejs-frameworks';

const { Option, OptGroup } = Select;
const { TextArea } = Input;

// Mirror 配置文件类型 - 根据包管理器映射
// 注意：pnpm 使用 .npmrc（不是 .pnpmrc），与 npm 相同
const MIRROR_CONFIG_MAP = {
  npm: { value: '.npmrc', label: '.npmrc', fieldName: 'CNB_MIRROR_NPMRC' },
  yarn: { value: '.yarnrc', label: '.yarnrc', fieldName: 'CNB_MIRROR_YARNRC' },
  pnpm: { value: '.npmrc', label: '.npmrc', fieldName: 'CNB_MIRROR_NPMRC' },
};

// 获取包管理器对应的配置文件
const getConfigForPackageManager = (pmName) => {
  // 默认使用 npm
  const pm = pmName?.toLowerCase() || 'npm';
  return MIRROR_CONFIG_MAP[pm] || MIRROR_CONFIG_MAP.npm;
};

// Node.js 版本列表（按从小到大排序）
// TODO: 考虑从后端 API 获取支持的版本列表
const NODE_VERSIONS = [
  '18.20.7',
  '18.20.8',
  '20.19.6',
  '20.20.0',
  '22.21.1',
  '22.22.0',
  '24.12.0',
  '24.13.0',
];

// 版本匹配：将模糊版本映射到精确版本
// 支持格式: >=20.0, ^20.0, ~20.0, 20.x, 20, 20.20.0
const matchNodeVersion = (version) => {
  if (!version) return '20.20.0'; // 默认版本

  // 如果是精确版本且在列表中，直接返回
  if (NODE_VERSIONS.includes(version)) {
    return version;
  }

  // 处理范围表达式 (>=, >, ^, ~)
  // 对于 >=N.x，应该返回满足条件的最新版本
  const rangeMatch = version.match(/^(>=|>|\^|~|<=|<)?(\d+)(?:\.(\d+))?/);
  if (rangeMatch) {
    const [, operator, majorStr, minorStr] = rangeMatch;
    const major = parseInt(majorStr, 10);
    const minor = minorStr ? parseInt(minorStr, 10) : 0;

    if (operator === '>=' || operator === '>') {
      // >=20.0 或 >20.0: 返回满足条件的最新版本
      const satisfying = NODE_VERSIONS.filter(v => {
        const [vMajor, vMinor] = v.split('.').map(Number);
        if (operator === '>=') {
          return vMajor > major || (vMajor === major && vMinor >= minor);
        } else {
          return vMajor > major || (vMajor === major && vMinor > minor);
        }
      });
      if (satisfying.length > 0) {
        return satisfying[satisfying.length - 1]; // 返回最新的
      }
    } else if (operator === '^' || operator === '~') {
      // ^20.0 或 ~20.0: 返回该主版本的最新版本
      const matched = NODE_VERSIONS.filter(v => v.startsWith(major + '.')).pop();
      if (matched) return matched;
    } else {
      // 没有操作符，按主版本匹配
      const matched = NODE_VERSIONS.filter(v => v.startsWith(major + '.')).pop();
      if (matched) return matched;
    }
  }

  // 提取主版本号（如 "20.x" -> "20", "20" -> "20"）
  const majorMatch = version.match(/^(\d+)/);
  if (majorMatch) {
    const major = majorMatch[1];
    // 找到该主版本的最新版本
    const matched = NODE_VERSIONS.filter(v => v.startsWith(major + '.')).pop();
    if (matched) return matched;
  }

  // 默认返回
  return '20.20.0';
};

// 渲染框架选项（带图标）
const renderFrameworkOption = (framework) => (
  <Option key={framework.value} value={framework.value}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={FRAMEWORK_ICONS[framework.value]}
        alt={framework.label}
        style={{ width: 16, height: 16, marginRight: 8 }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <span>{framework.label}</span>
    </div>
  </Option>
);

@connect(
  ({ loading, teamControl }) => ({
    soundCodeLanguage: teamControl.codeLanguage,
    packageType: teamControl.packageNpmOrYarn
  }), null, null, { withRef: true })
class NodeJSCNBConfig extends PureComponent {
  constructor(props) {
    super(props);
    const { envs, runtimeInfo, isPureStatic = false } = props;

    // 获取框架信息
    // 优先级：
    // 1. runtimeInfo.framework（新的结构化数据）
    // 2. CNB_FRAMEWORK（用户保存的框架选择）
    // 3. BUILD_FRAMEWORK（检测阶段返回的框架，来自 build_envs API）
    // 4. 纯静态项目默认为 'other-static'
    let detectedFramework = isPureStatic ? 'other-static' : 'vue';
    let detectedFrameworkType = '';

    if (runtimeInfo?.framework) {
      // 使用新的结构化 runtime_info
      detectedFramework = runtimeInfo.framework.name;
      detectedFrameworkType = runtimeInfo.framework.type;
    } else if (envs?.CNB_FRAMEWORK) {
      detectedFramework = envs.CNB_FRAMEWORK;
    } else if (envs?.BUILD_FRAMEWORK) {
      detectedFramework = envs.BUILD_FRAMEWORK;
    }

    // 使用共享的框架匹配逻辑
    const frameworkInfo = matchFramework(detectedFramework);
    const finalFramework = frameworkInfo?.value || detectedFramework;
    // 纯静态项目强制为静态框架类型
    const isStatic = isPureStatic ? true : (detectedFrameworkType === 'static' || frameworkInfo?.type === 'static');

    // 获取配置文件检测结果
    // 优先级: runtimeInfo.config_files > envs 中的 BUILD_HAS_* 标志
    // 注意：pnpm 使用 .npmrc，不存在 .pnpmrc
    let hasProjectConfig = false;
    let configFilesInfo = {
      hasNpmrc: false,
      hasYarnrc: false
    };

    if (runtimeInfo?.config_files) {
      configFilesInfo = {
        hasNpmrc: runtimeInfo.config_files.has_npmrc || false,
        hasYarnrc: runtimeInfo.config_files.has_yarnrc || false
      };
      hasProjectConfig = configFilesInfo.hasNpmrc || configFilesInfo.hasYarnrc;
    } else if (envs) {
      configFilesInfo = {
        hasNpmrc: envs.BUILD_HAS_NPMRC === 'true',
        hasYarnrc: envs.BUILD_HAS_YARNRC === 'true'
      };
      hasProjectConfig = configFilesInfo.hasNpmrc || configFilesInfo.hasYarnrc;
      // Fallback: 如果 BUILD_HAS_* 标志不存在，但 CNB_MIRROR_SOURCE 已保存为 'project'，
      // 说明创建时检测到了配置文件（兼容旧数据）
      if (!hasProjectConfig && envs.CNB_MIRROR_SOURCE === 'project') {
        hasProjectConfig = true;
      }
    }

    // Mirror 来源：如果用户已保存选择，使用保存的值；否则根据检测结果自动选择
    const savedMirrorSource = envs?.CNB_MIRROR_SOURCE;
    const autoMirrorSource = hasProjectConfig ? 'project' : 'global';

    // 获取检测到的包管理器（用于决定显示哪个配置文件）
    // 优先级: runtimeInfo.package_manager > BUILD_PACKAGE_TOOL (保存的) > 默认 npm
    const detectedPackageManager = runtimeInfo?.package_manager?.name
      || envs?.BUILD_PACKAGE_TOOL
      || 'npm';
    const mirrorConfig = getConfigForPackageManager(detectedPackageManager);

    this.state = {
      selectedFramework: finalFramework,
      isStaticFramework: isStatic,
      isPureStatic,  // 新增：纯静态项目标志
      // Mirror 配置相关状态
      mirrorSource: savedMirrorSource || autoMirrorSource,
      mirrorConfigType: mirrorConfig.value,
      mirrorConfigContent: envs?.CNB_MIRROR_CONTENT || '',
      mirrorModalVisible: false,
      tempMirrorContent: '',
      // 配置文件检测结果
      configFilesInfo,
      hasProjectConfig,
      // 检测到的包管理器
      detectedPackageManager,
      mirrorConfig,
      // 从 envs 中恢复已保存的 Mirror 配置内容
      'mirrorContent_.npmrc': envs?.CNB_MIRROR_NPMRC || '',
      'mirrorContent_.yarnrc': envs?.CNB_MIRROR_YARNRC || '',
    };
  }

  onFrameworkChange = (value) => {
    const frameworkInfo = NODEJS_FRAMEWORKS.find(f => f.value === value);
    const isStatic = frameworkInfo?.type === 'static';

    this.setState({
      selectedFramework: value,
      isStaticFramework: isStatic
    });

    // 更新输出目录默认值
    if (isStatic && frameworkInfo?.outputDir) {
      this.props.form.setFieldsValue({
        CNB_OUTPUT_DIR: frameworkInfo.outputDir
      });
    }
  };

  // Mirror 配置来源切换
  onMirrorSourceChange = (e) => {
    this.setState({ mirrorSource: e.target.value });
  };

  // Mirror 配置类型切换
  onMirrorTypeChange = (value) => {
    this.setState({ mirrorConfigType: value });
  };

  // 打开编辑弹窗
  openMirrorModal = () => {
    this.setState({
      mirrorModalVisible: true,
      tempMirrorContent: this.state.mirrorConfigContent
    });
  };

  // 关闭编辑弹窗
  closeMirrorModal = () => {
    this.setState({ mirrorModalVisible: false });
  };

  // 保存 Mirror 配置
  saveMirrorConfig = () => {
    const { mirrorConfigType, tempMirrorContent, mirrorConfig } = this.state;
    this.setState({
      [`mirrorContent_${mirrorConfigType}`]: tempMirrorContent,
      mirrorModalVisible: false
    });
    // 更新隐藏表单字段（使用当前包管理器对应的字段名）
    this.props.form.setFieldsValue({
      [mirrorConfig.fieldName]: tempMirrorContent
    });
  };

  render() {
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 }
      }
    };

    const { envs, runtimeInfo } = this.props;
    const { getFieldDecorator } = this.props.form;
    const {
      selectedFramework,
      isStaticFramework,
      isPureStatic,
      mirrorSource,
      mirrorConfigType,
      mirrorConfigContent,
      mirrorModalVisible,
      tempMirrorContent,
      configFilesInfo,
      hasProjectConfig,
      detectedPackageManager,
      mirrorConfig
    } = this.state;

    // 获取 Node.js 版本
    // 优先级: CNB_NODE_VERSION > runtimeInfo.language_version > BUILD_RUNTIMES
    const rawNodeVersion = envs?.CNB_NODE_VERSION
      || runtimeInfo?.language_version
      || envs?.BUILD_RUNTIMES
      || '';
    const nodeVersion = matchNodeVersion(rawNodeVersion);

    // 获取构建配置
    // 优先级: CNB_* > runtimeInfo.build_config.* > BUILD_*
    const outputDir = envs?.CNB_OUTPUT_DIR
      || runtimeInfo?.build_config?.output_dir
      || envs?.BUILD_OUTPUT_DIR
      || (isPureStatic ? '.' : 'dist');  // 纯静态项目默认为根目录

    const buildScript = envs?.CNB_BUILD_SCRIPT
      || runtimeInfo?.build_config?.build_command
      || envs?.BUILD_BUILD_CMD
      || (isStaticFramework ? 'build' : '');

    const startCommand = envs?.CNB_START_COMMAND
      || runtimeInfo?.build_config?.start_command
      || envs?.BUILD_START_CMD
      || 'start'; // CNB expects script name only, not full command

    return (
      <div>
        {/* 1. 项目框架（和创建时保持一致） */}
        <Form.Item
          {...formItemLayout}
          label={
            <span>
              项目框架
              <Tooltip title={isPureStatic
                ? "纯静态项目，选择静态站点框架"
                : "选择您的项目使用的框架，前端框架将构建为静态站点，后端框架将作为 Node.js 服务运行"}>
                <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
              </Tooltip>
            </span>
          }
        >
          {getFieldDecorator('CNB_FRAMEWORK', {
            initialValue: selectedFramework
          })(
            <Select
              style={{ width: 300 }}
              onChange={this.onFrameworkChange}
              placeholder="请选择框架"
            >
              {isPureStatic ? (
                // 纯静态项目：仅显示静态框架
                <OptGroup label="纯静态站点">
                  {NODEJS_FRAMEWORKS.filter(f => f.type === 'static').map(renderFrameworkOption)}
                </OptGroup>
              ) : ([
                // Node.js 项目：显示所有框架
                <OptGroup key="static" label="前端框架（静态站点）">
                  {NODEJS_FRAMEWORKS.filter(f => f.type === 'static').map(renderFrameworkOption)}
                </OptGroup>,
                <OptGroup key="server" label="后端框架（Node.js 服务）">
                  {NODEJS_FRAMEWORKS.filter(f => f.type === 'server').map(renderFrameworkOption)}
                </OptGroup>
              ])}
            </Select>
          )}
        </Form.Item>

        {/* 2. 禁用缓存 */}
        <Form.Item
          {...formItemLayout}
          label={
            <span>
              <FormattedMessage id="componentOverview.body.GoConfig.Disable"/>
              <Tooltip title={<FormattedMessage id="componentOverview.body.GoConfig.remove"/>}>
                <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
              </Tooltip>
            </span>
          }
        >
          {getFieldDecorator('BUILD_NO_CACHE', {
            initialValue: !!(envs && envs.BUILD_NO_CACHE)
          })(<Switch defaultChecked={!!(envs && envs.BUILD_NO_CACHE)} />)}
        </Form.Item>

        {/* 3. Node.js 版本选择 - 仅 Node.js 项目显示 */}
        {!isPureStatic && (
          <Form.Item
            {...formItemLayout}
            label={
              <span>
                Node 版本
                <Tooltip title="选择 Node.js 运行时版本">
                  <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('CNB_NODE_VERSION', {
              initialValue: nodeVersion
            })(
              <Radio.Group>
                {NODE_VERSIONS.map(v => (
                  <Radio key={v} value={v}>{v}</Radio>
                ))}
              </Radio.Group>
            )}
          </Form.Item>
        )}

        {/* 4. Mirror 配置 - 仅 Node.js 项目显示 */}
        {!isPureStatic && (
          <>
            <Form.Item
              {...formItemLayout}
              label={
                <span>
                  Mirror 配置
                  <Tooltip title="配置 npm/yarn/pnpm 的镜像源。可以使用项目中的配置文件，或自定义配置内容">
                    <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                  </Tooltip>
                </span>
              }
            >
              <div>
                {getFieldDecorator('CNB_MIRROR_SOURCE', {
                  initialValue: mirrorSource
                })(
                  <Radio.Group onChange={this.onMirrorSourceChange}>
                    <Radio value="project">
                      使用项目配置
                      {hasProjectConfig && (
                        <span style={{ color: '#52c41a', marginLeft: 8, fontSize: 12 }}>
                          <Icon type="check-circle" style={{ marginRight: 4 }} />
                          已检测到
                        </span>
                      )}
                    </Radio>
                    <Radio value="global">
                      使用自定义配置
                      {!hasProjectConfig && (
                        <Tooltip title="项目中未检测到配置文件，将使用自定义的镜像配置">
                          <span style={{ color: '#1890ff', marginLeft: 8, fontSize: 12 }}>
                            <Icon type="info-circle" style={{ marginRight: 4 }} />
                            推荐
                          </span>
                        </Tooltip>
                      )}
                    </Radio>
                  </Radio.Group>
                )}
                {/* 显示检测到的配置文件 */}
                {hasProjectConfig && mirrorSource === 'project' && (
                  <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                    检测到配置文件：
                    {configFilesInfo.hasNpmrc && <span style={{ marginLeft: 8, padding: '2px 6px', background: '#f0f0f0', borderRadius: 4 }}>.npmrc</span>}
                    {configFilesInfo.hasYarnrc && <span style={{ marginLeft: 8, padding: '2px 6px', background: '#f0f0f0', borderRadius: 4 }}>.yarnrc</span>}
                  </div>
                )}
                {!hasProjectConfig && mirrorSource === 'project' && (
                  <div style={{ marginTop: 8, color: '#fa8c16', fontSize: 12 }}>
                    <Icon type="warning" style={{ marginRight: 4 }} />
                    项目中未检测到 .npmrc/.yarnrc 文件，建议切换到"使用自定义配置"
                  </div>
                )}
              </div>
            </Form.Item>

            {/* 全局配置 - 只显示检测到的包管理器对应的配置文件 */}
            {mirrorSource === 'global' && (
              <Form.Item
                {...formItemLayout}
                label={
                  <span>
                    自定义配置
                    <Tooltip title="为当前组件配置镜像源，构建时将自动注入到容器中">
                      <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                    </Tooltip>
                  </span>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* 只显示对应包管理器的配置文件 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#fafafa',
                    borderRadius: 4,
                    border: '1px solid #e8e8e8'
                  }}>
                    <span style={{ fontWeight: 500, width: 80 }}>{mirrorConfig.label}</span>
                    <Button
                      type="link"
                      size="small"
                      icon="edit"
                      onClick={() => {
                        this.setState({
                          mirrorConfigType: mirrorConfig.value,
                          mirrorModalVisible: true,
                          tempMirrorContent: this.state[`mirrorContent_${mirrorConfig.value}`] || ''
                        });
                      }}
                    >
                      编辑
                    </Button>
                    {this.state[`mirrorContent_${mirrorConfig.value}`] && (
                      <span style={{ color: '#52c41a', fontSize: 12, marginLeft: 8 }}>
                        <Icon type="check-circle" style={{ marginRight: 4 }} />
                        已配置
                      </span>
                    )}
                  </div>
                </div>
                {/* 隐藏字段用于表单提交 - 只提交对应包管理器的配置 */}
                {getFieldDecorator(mirrorConfig.fieldName, {
                  initialValue: this.state[`mirrorContent_${mirrorConfig.value}`] || ''
                })(<Input type="hidden" />)}
              </Form.Item>
            )}

            {/* Mirror 配置编辑弹窗 */}
            <Modal
              title={`编辑 ${mirrorConfigType} 配置`}
              visible={mirrorModalVisible}
              onOk={this.saveMirrorConfig}
              onCancel={this.closeMirrorModal}
              width={600}
              okText="保存"
              cancelText="取消"
            >
              <TextArea
                rows={12}
                value={tempMirrorContent}
                onChange={(e) => this.setState({ tempMirrorContent: e.target.value })}
                placeholder={`请输入 ${mirrorConfigType} 配置内容，例如：\nregistry=https://registry.npmmirror.com`}
                style={{ fontFamily: 'monospace' }}
              />
            </Modal>
          </>
        )}

        {/* 5. 输出目录 - 静态项目显示（包括纯静态和 Node.js 静态） */}
        {(isStaticFramework || isPureStatic) && (
          <Form.Item
            {...formItemLayout}
            label={
              <span>
                输出目录
                <Tooltip title={isPureStatic
                  ? "静态文件所在目录，默认为根目录 ."
                  : "构建产物目录，如 dist、build、out"}>
                  <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('CNB_OUTPUT_DIR', {
              initialValue: outputDir
            })(<Input placeholder={isPureStatic ? "." : "dist"} style={{ width: 300 }} />)}
          </Form.Item>
        )}

        {/* 6. 构建命令 - Node.js 项目显示（纯静态项目不显示） */}
        {!isPureStatic && (
          <Form.Item
            {...formItemLayout}
            label={
              <span>
                构建命令
                <Tooltip title="package.json 中的 scripts 名称，如 build、build:prod">
                  <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('CNB_BUILD_SCRIPT', {
              initialValue: buildScript
            })(<Input placeholder="build" style={{ width: 300 }} />)}
          </Form.Item>
        )}

        {/* 7. 启动命令 - 仅 Node.js 后端服务显示（纯静态和前端框架不显示） */}
        {!isPureStatic && !isStaticFramework && (
          <Form.Item
            {...formItemLayout}
            label={
              <span>
                启动命令
                <Tooltip title="Node.js 服务启动命令，如 npm start、node server.js">
                  <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('CNB_START_COMMAND', {
              initialValue: startCommand
            })(<Input placeholder="npm start" style={{ width: 300 }} />)}
          </Form.Item>
        )}
      </div>
    );
  }
}

export default NodeJSCNBConfig;
