/* eslint-disable react/jsx-no-bind */
import React, { Fragment, PureComponent } from 'react';
import { Checkbox, Col, Divider, Form, Input, InputNumber, Row } from 'antd';
import { formatMessage } from '@/utils/intl';
import styles from '../publish.less';

const FormItem = Form.Item;

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

  renderExtend = () => {
    const { app = {}, ID = 'extend', form } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const pd16 = { padding: 16 };
    if (app.extend_method_map) {
      const steps = getFieldValue(`${ID}||step_node`);
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
                {getFieldDecorator(`${ID}||min_node`, {
                  initialValue: app.extend_method_map.min_node,
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
                      id: 'placeholder.appShare.min_node'
                    })}
                    min={1}
                    step={steps || app.extend_method_map.step_node}
                  />
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
                {getFieldDecorator(`${ID}||max_node`, {
                  initialValue: app.extend_method_map.max_node,
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
                      id: 'placeholder.appShare.max_node'
                    })}
                    min={1}
                    step={steps || app.extend_method_map.step_node}
                  />
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
                {getFieldDecorator(`${ID}||step_node`, {
                  initialValue: app.extend_method_map.step_node,
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
                      id: 'placeholder.appShare.step_node'
                    })}
                    min={app.extend_method_map.min_node}
                    max={app.extend_method_map.max_node}
                  />
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
                {getFieldDecorator(`${ID}||init_memory`, {
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
                {getFieldDecorator(`${ID}||container_cpu`, {
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
        {this.renderConnectInfo()}
        {this.renderEnv()}
        {this.renderExtend()}
      </Fragment>
    );
  }
}

export default Form.create()(AppShareAppInfo);
