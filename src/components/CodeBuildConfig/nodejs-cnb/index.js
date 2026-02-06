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

// Mirror 配置文件类型
const MIRROR_CONFIG_TYPES = [
  { value: '.npmrc', label: '.npmrc' },
  { value: '.yarnrc', label: '.yarnrc' },
  { value: '.pnpmrc', label: '.pnpmrc' },
];

// Node.js 版本列表
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

// 版本匹配：将模糊版本（如 20.x）映射到精确版本
const matchNodeVersion = (version) => {
  if (!version) return '20.20.0'; // 默认版本

  // 如果是精确版本且在列表中，直接返回
  if (NODE_VERSIONS.includes(version)) {
    return version;
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
    const { envs, runtimeInfo } = props;

    // 获取框架信息
    // 优先级：
    // 1. runtimeInfo.framework（新的结构化数据）
    // 2. CNB_FRAMEWORK（用户保存的框架选择）
    // 3. BUILD_FRAMEWORK（检测阶段返回的框架，来自 build_envs API）
    let detectedFramework = 'vue';
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
    const isStatic = detectedFrameworkType === 'static' || frameworkInfo?.type === 'static';

    // 获取配置文件检测结果
    // 优先级: runtimeInfo.config_files > envs 中的 BUILD_HAS_* 标志
    let hasProjectConfig = false;
    let configFilesInfo = {
      hasNpmrc: false,
      hasYarnrc: false,
      hasPnpmrc: false
    };

    if (runtimeInfo?.config_files) {
      configFilesInfo = {
        hasNpmrc: runtimeInfo.config_files.has_npmrc || false,
        hasYarnrc: runtimeInfo.config_files.has_yarnrc || false,
        hasPnpmrc: runtimeInfo.config_files.has_pnpmrc || false
      };
      hasProjectConfig = configFilesInfo.hasNpmrc || configFilesInfo.hasYarnrc || configFilesInfo.hasPnpmrc;
    } else if (envs) {
      configFilesInfo = {
        hasNpmrc: envs.BUILD_HAS_NPMRC === 'true',
        hasYarnrc: envs.BUILD_HAS_YARNRC === 'true',
        hasPnpmrc: envs.BUILD_HAS_PNPMRC === 'true'
      };
      hasProjectConfig = configFilesInfo.hasNpmrc || configFilesInfo.hasYarnrc || configFilesInfo.hasPnpmrc;
    }

    // Mirror 来源：如果用户已保存选择，使用保存的值；否则根据检测结果自动选择
    const savedMirrorSource = envs?.CNB_MIRROR_SOURCE;
    const autoMirrorSource = hasProjectConfig ? 'project' : 'global';

    this.state = {
      selectedFramework: finalFramework,
      isStaticFramework: isStatic,
      // Mirror 配置相关状态
      mirrorSource: savedMirrorSource || autoMirrorSource,
      mirrorConfigType: envs?.CNB_MIRROR_TYPE || '.npmrc',
      mirrorConfigContent: envs?.CNB_MIRROR_CONTENT || '',
      mirrorModalVisible: false,
      tempMirrorContent: '',
      // 配置文件检测结果
      configFilesInfo,
      hasProjectConfig,
      // 从 envs 中恢复已保存的 Mirror 配置内容
      'mirrorContent_.npmrc': envs?.CNB_MIRROR_NPMRC || '',
      'mirrorContent_.yarnrc': envs?.CNB_MIRROR_YARNRC || '',
      'mirrorContent_.pnpmrc': envs?.CNB_MIRROR_PNPMRC || ''
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
    const { mirrorConfigType, tempMirrorContent } = this.state;
    this.setState({
      [`mirrorContent_${mirrorConfigType}`]: tempMirrorContent,
      mirrorModalVisible: false
    });
    // 更新隐藏表单字段
    const fieldName = mirrorConfigType === '.npmrc' ? 'CNB_MIRROR_NPMRC'
      : mirrorConfigType === '.yarnrc' ? 'CNB_MIRROR_YARNRC'
      : 'CNB_MIRROR_PNPMRC';
    this.props.form.setFieldsValue({
      [fieldName]: tempMirrorContent
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
      mirrorSource,
      mirrorConfigType,
      mirrorConfigContent,
      mirrorModalVisible,
      tempMirrorContent,
      configFilesInfo,
      hasProjectConfig
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
      || 'dist';

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
              <Tooltip title="选择您的项目使用的框架，前端框架将构建为静态站点，后端框架将作为 Node.js 服务运行">
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
              <OptGroup label="前端框架（静态站点）">
                {NODEJS_FRAMEWORKS.filter(f => f.type === 'static').map(renderFrameworkOption)}
              </OptGroup>
              <OptGroup label="后端框架（Node.js 服务）">
                {NODEJS_FRAMEWORKS.filter(f => f.type === 'server').map(renderFrameworkOption)}
              </OptGroup>
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

        {/* 3. Node.js 版本选择 */}
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

        {/* 4. Mirror 配置 */}
        <Form.Item
          {...formItemLayout}
          label={
            <span>
              Mirror 配置
              <Tooltip title="配置 npm/yarn/pnpm 的镜像源。如果项目中存在配置文件则使用项目配置，否则使用平台全局配置">
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
                  使用平台全局配置
                  {!hasProjectConfig && (
                    <Tooltip title="项目中未检测到配置文件，将使用平台提供的全局镜像配置">
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
                {configFilesInfo.hasPnpmrc && <span style={{ marginLeft: 8, padding: '2px 6px', background: '#f0f0f0', borderRadius: 4 }}>.pnpmrc</span>}
              </div>
            )}
            {!hasProjectConfig && mirrorSource === 'project' && (
              <div style={{ marginTop: 8, color: '#fa8c16', fontSize: 12 }}>
                <Icon type="warning" style={{ marginRight: 4 }} />
                项目中未检测到 .npmrc/.yarnrc/.pnpmrc 文件，建议切换到"使用平台全局配置"
              </div>
            )}
          </div>
        </Form.Item>

        {/* 全局配置 - 三个配置文件分别显示 */}
        {mirrorSource === 'global' && (
          <Form.Item
            {...formItemLayout}
            label={
              <span>
                全局配置文件
                <Tooltip title="平台将通过 ConfigMap 挂载这些配置文件到构建容器中">
                  <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MIRROR_CONFIG_TYPES.map(item => (
                <div key={item.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#fafafa',
                  borderRadius: 4,
                  border: '1px solid #e8e8e8'
                }}>
                  <span style={{ fontWeight: 500, width: 80 }}>{item.label}</span>
                  <Button
                    type="link"
                    size="small"
                    icon="edit"
                    onClick={() => {
                      this.setState({
                        mirrorConfigType: item.value,
                        mirrorModalVisible: true,
                        tempMirrorContent: this.state[`mirrorContent_${item.value}`] || ''
                      });
                    }}
                  >
                    编辑
                  </Button>
                  {this.state[`mirrorContent_${item.value}`] && (
                    <span style={{ color: '#52c41a', fontSize: 12, marginLeft: 8 }}>
                      <Icon type="check-circle" style={{ marginRight: 4 }} />
                      已配置
                    </span>
                  )}
                </div>
              ))}
            </div>
            {/* 隐藏字段用于表单提交 */}
            {getFieldDecorator('CNB_MIRROR_NPMRC', {
              initialValue: this.state['mirrorContent_.npmrc'] || ''
            })(<Input type="hidden" />)}
            {getFieldDecorator('CNB_MIRROR_YARNRC', {
              initialValue: this.state['mirrorContent_.yarnrc'] || ''
            })(<Input type="hidden" />)}
            {getFieldDecorator('CNB_MIRROR_PNPMRC', {
              initialValue: this.state['mirrorContent_.pnpmrc'] || ''
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

        {/* 5. 输出目录 - 仅前端框架显示 */}
        {isStaticFramework && (
          <Form.Item
            {...formItemLayout}
            label={
              <span>
                输出目录
                <Tooltip title="构建产物目录，如 dist、build、out">
                  <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('CNB_OUTPUT_DIR', {
              initialValue: outputDir
            })(<Input placeholder="dist" style={{ width: 300 }} />)}
          </Form.Item>
        )}

        {/* 6. 构建命令 - 前后端都显示 */}
        <Form.Item
          {...formItemLayout}
          label={
            <span>
              构建命令
              <Tooltip title={isStaticFramework
                ? "package.json 中的 scripts 名称，如 build、build:prod"
                : "可选，用于 TypeScript 等需要编译的项目，留空则跳过构建步骤"
              }>
                <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
              </Tooltip>
            </span>
          }
        >
          {getFieldDecorator('CNB_BUILD_SCRIPT', {
            initialValue: buildScript
          })(<Input placeholder={isStaticFramework ? "build" : "可选，如 build"} style={{ width: 300 }} />)}
        </Form.Item>

        {/* 7. 启动命令 - 仅后端框架显示 */}
        {!isStaticFramework && (
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
