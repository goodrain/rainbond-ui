/* eslint-disable react/jsx-no-bind */
import React, { Fragment, PureComponent } from 'react';
import {
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Tag,
  Tooltip
} from 'antd';
import { formatMessage } from '@/utils/intl';
import styles from '../publish.less';

const FormItem = Form.Item;
const {
  getNodeScalingDisabledTip,
  isNodeScalingDisabled
} = require('./appShareFormHelpers');

class AppShareAppInfo extends PureComponent {
  componentDidMount() {
    const { getref } = this.props;
    if (getref) {
      getref(this);
    }
  }

  handleCheckChange = (appname, val, e) => {
    const name = {};
    name[appname] = e.target.checked ? '**None**' : val;
    this.props.form.setFieldsValue(name);
  };

  isVMComponent = () => {
    const { app = {} } = this.props;
    return app.extend_method === 'vm' || app.service_type === 'vm' || !!app.vm;
  };

  renderConnectInfo = () => {
    const { app = {}, form, ID } = this.props;
    const { getFieldDecorator } = form;
    if (
      app.service_connect_info_map_list &&
      app.service_connect_info_map_list.length
    ) {
      return (
        <div
          style={{
            marginBottom: 24,
            display: 'none'
          }}
        >
          <h4
            style={{
              marginBottom: 8
            }}
          >
            {formatMessage({ id: 'appPublish.shop.pages.title.joinMsg' })}
          </h4>
          <Divider />
          <Row>
            {app.service_connect_info_map_list.map((item, index) => (
              <Col key={`connection_${index}`} span={8}>
                <FormItem label={item.attr_name} style={{ padding: 16 }}>
                  {getFieldDecorator(
                    `connect||${item.attr_name}||attr_value||${ID}`,
                    {
                      initialValue: item.attr_value,
                      rules: [{ required: false }]
                    }
                  )(<Input placeholder={item.attr_value} />)}
                  {getFieldDecorator(
                    `connect||${item.attr_name}||random||${ID}`,
                    {
                      valuePropName: 'checked',
                      initialValue: item.attr_value === '**None**'
                    }
                  )(
                    <Checkbox
                      onChange={this.handleCheckChange.bind(
                        this,
                        `connect||${item.attr_name}||attr_value||${ID}`,
                        item.attr_value
                      )}
                    >
                      {formatMessage({ id: 'appPublish.shop.pages.title.random' })}
                    </Checkbox>
                  )}
                </FormItem>
              </Col>
            ))}
          </Row>
        </div>
      );
    }
    return null;
  };

  renderEnv = () => {
    const { app = {}, form, ID } = this.props;
    const { getFieldDecorator } = form;
    if (app.service_env_map_list && app.service_env_map_list.length) {
      return (
        <div className={styles.componentSection}>
          <div className={styles.componentSectionHeader}>
            <div>
              <div className={styles.componentSectionTitle}>
                {formatMessage({
                  id: 'appPublish.shop.pages.title.environment_variable'
                })}
              </div>
              <div className={styles.componentSectionDesc}>
                发布时会保留这些环境变量，作为模板默认配置供后续安装复用。
              </div>
            </div>
          </div>
          <Row gutter={20}>
            {app.service_env_map_list.map(item => {
              const { attr_name, attr_value } = item;
              return (
                <Col xs={24} md={12} xl={8} key={`${ID}_${attr_name}`}>
                  <FormItem label={attr_name}>
                    {getFieldDecorator(`env||${attr_name}||${ID}`, {
                      initialValue: attr_value,
                      rules: [
                        {
                          required: false,
                          message: formatMessage({
                            id: 'placeholder.copy.not_null'
                          })
                        }
                      ]
                    })(<Input />)}
                  </FormItem>
                </Col>
              );
            })}
          </Row>
        </div>
      );
    }
    return null;
  };

  renderVMDiskInfo = () => {
    const { app = {} } = this.props;
    const vm = app.vm || {};
    const diskLayout = Array.isArray(vm.disk_layout) ? vm.disk_layout : [];
    if (!this.isVMComponent() && diskLayout.length === 0) {
      return null;
    }
    const rootDisk =
      diskLayout.find(disk => disk && disk.disk_role === 'root') ||
      diskLayout[0] ||
      {};
    const diskName =
      rootDisk.disk_name || rootDisk.volume_name || rootDisk.disk_key || 'system-disk';
    const diskImage = rootDisk.image || app.share_image || app.image || '-';
    const diskFormat = rootDisk.format || vm.boot_source_format || 'qcow2';
    const requestSize = rootDisk.request_size || '-';
    const sourceType = rootDisk.source_type || 'registry';

    return (
      <div className={styles.componentSection}>
        <div className={styles.componentSectionHeader}>
          <div>
            <div className={styles.componentSectionTitle}>虚拟机系统盘</div>
            <div className={styles.componentSectionDesc}>
              发布时会导出当前系统盘并转换为 qcow2 镜像，导入后按下列信息恢复 DataVolume。
            </div>
          </div>
        </div>
        <div className={styles.vmDiskPreview}>
          <div className={styles.vmDiskPreviewMain}>
            <div className={styles.vmDiskName}>{diskName}</div>
            <div className={styles.vmDiskImage}>{diskImage}</div>
          </div>
          <div className={styles.vmDiskTags}>
            <Tag color="blue">root</Tag>
            <Tag>{diskFormat}</Tag>
            <Tag>{requestSize}</Tag>
            <Tag>{sourceType}</Tag>
          </div>
        </div>
      </div>
    );
  };

  renderExtend = () => {
    const { app = {}, ID = 'extend', form } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const pd16 = { padding: 16 };
    if (this.isVMComponent()) {
      return null;
    }
    if (app.extend_method_map) {
      const steps = getFieldValue(`extend||step_node||${ID}`);
      const nodeScalingDisabled = isNodeScalingDisabled(app);
      const nodeScalingRules = nodeScalingDisabled
        ? []
        : [
            {
              required: true,
              message: formatMessage({
                id: 'placeholder.appShare.formatError'
              })
            }
          ];
      const renderNodeScalingInput = (field, input) => {
        const tip = getNodeScalingDisabledTip(app, field);
        if (!tip) {
          return input;
        }
        return (
          <Tooltip title={tip}>
            <span style={{ display: 'block' }}>{input}</span>
          </Tooltip>
        );
      };
      return (
        <div className={styles.componentSection}>
          <div className={styles.componentSectionHeader}>
            <div>
              <div className={styles.componentSectionTitle}>
                {formatMessage({ id: 'appPublish.shop.pages.title.flexible' })}
              </div>
              <div className={styles.componentSectionDesc}>
                伸缩规则会作为组件模板的一部分保留下来，建议在发布前完成检查。
              </div>
            </div>
          </div>
          <Row gutter={20}>
            <Col xs={24} md={12} xl={8}>
              <FormItem
                label={formatMessage({
                  id: 'appPublish.shop.pages.form.label.min_node'
                })}
                style={pd16}
              >
                {getFieldDecorator(`extend||min_node||${ID}`, {
                  initialValue: app.extend_method_map.min_node,
                  rules: nodeScalingRules
                })(
                  renderNodeScalingInput(
                    'min_node',
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder={formatMessage({
                        id: 'placeholder.appShare.min_node'
                      })}
                      disabled={nodeScalingDisabled}
                      min={1}
                      step={steps || app.extend_method_map.step_node}
                    />
                  )
                )}
              </FormItem>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <FormItem
                label={formatMessage({
                  id: 'appPublish.shop.pages.form.label.max_node'
                })}
                style={pd16}
              >
                {getFieldDecorator(`extend||max_node||${ID}`, {
                  initialValue: app.extend_method_map.max_node,
                  rules: nodeScalingRules
                })(
                  renderNodeScalingInput(
                    'max_node',
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder={formatMessage({
                        id: 'placeholder.appShare.max_node'
                      })}
                      disabled={nodeScalingDisabled}
                      min={1}
                      step={steps || app.extend_method_map.step_node}
                    />
                  )
                )}
              </FormItem>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <FormItem
                label={formatMessage({
                  id: 'appPublish.shop.pages.form.label.step_node'
                })}
                style={pd16}
              >
                {getFieldDecorator(`extend||step_node||${ID}`, {
                  initialValue: app.extend_method_map.step_node,
                  rules: nodeScalingRules
                })(
                  renderNodeScalingInput(
                    'step_node',
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder={formatMessage({
                        id: 'placeholder.appShare.step_node'
                      })}
                      disabled={nodeScalingDisabled}
                      min={app.extend_method_map.min_node}
                      max={app.extend_method_map.max_node}
                    />
                  )
                )}
              </FormItem>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <FormItem
                label={formatMessage({
                  id: 'appPublish.shop.pages.form.label.init_memory'
                })}
                style={pd16}
              >
                {getFieldDecorator(`extend||init_memory||${ID}`, {
                  initialValue: app.extend_method_map.init_memory || 0,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({
                        id: 'placeholder.appShare.formatError'
                      })
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder={formatMessage({
                      id: 'placeholder.appShare.init_memory'
                    })}
                    min={0}
                    max={app.extend_method_map.max_memory}
                    step={app.extend_method_map.step_memory}
                  />
                )}
                <div className={styles.formHint}>
                  {formatMessage({ id: 'appPublish.shop.pages.form.quota0.desc' })}
                </div>
              </FormItem>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <FormItem
                label={formatMessage({
                  id: 'appPublish.shop.pages.form.label.container_cpu'
                })}
                style={pd16}
              >
                {getFieldDecorator(`extend||container_cpu||${ID}`, {
                  initialValue: app.extend_method_map.container_cpu || 0,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({
                        id: 'placeholder.appShare.container_cpu'
                      })
                    },
                    {
                      pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                      message: formatMessage({ id: 'placeholder.plugin.min_cpuMsg' })
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder={formatMessage({
                      id: 'placeholder.appShare.container_cpu'
                    })}
                  />
                )}
                <div className={styles.formHint}>
                  {formatMessage({
                    id: 'appPublish.shop.pages.form.quota1000.desc'
                  })}
                </div>
              </FormItem>
            </Col>
          </Row>
        </div>
      );
    }
    return null;
  };

  render() {
    return (
      <Fragment>
        {this.renderVMDiskInfo()}
        {this.renderConnectInfo()}
        {this.renderEnv()}
        {this.renderExtend()}
      </Fragment>
    );
  }
}

export default Form.create()(AppShareAppInfo);
