/* eslint-disable react/sort-comp */
import {
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Typography
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import styles from './index.less';

const { Paragraph } = Typography;
const { Option } = Select;

@Form.create()
@connect()
export default class ACKBuyConfig extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      customResource: false,
      loading: false
    };
  }

  createCluster = () => {
    const { form, dispatch, eid, onOK } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        console.log(err);
        return;
      }
      this.setState({ loading: true });
      dispatch({
        type: 'cloud/createKubernetesCluster',
        payload: {
          enterprise_id: eid,
          provider_name: 'ack',
          ...fieldsValue
        },
        callback: data => {
          if (data && onOK) {
            onOK(data);
          }
        },
        handleError: res => {
          if (res && res.data && res.data.code === 7005) {
            onOK(res.data.data);
            return;
          }
          cloud.handleCloudAPIError(res);
          this.setState({ loading: false });
        }
      });
    });
  };
  changeWorkerType = v => {
    if (v === '') {
      this.setState({ customResource: true });
    }
  };

  render() {
    const { onCancel } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { customResource, loading } = this.state;
    return (
      <Modal
        visible
        title="购买阿里云 ACK 集群"
        onOk={this.createCluster}
        width={800}
        confirmLoading={loading}
        onCancel={onCancel}
      >
        <Form>
          <Row>
            <Col span={24} style={{ padding: '16px' }}>
              <Paragraph className={styles.describe}>
                <ul>
                  <li>
                    <span>
                      委托购买时将购买以下资源：标准托管集群(1个)、VPC(1个)
                    </span>
                  </li>
                  <li>
                    <span>
                      新购集群都将采用按需后付费模式，因此请确保你的阿里云账号能够进行按需购买资源
                    </span>
                  </li>
                  <li>
                    <span>
                      购买的Kubernetes将开启EIP,通过公网访问KubeApiserver,
                      集群对接完毕后可以手工关闭集群的外网访问EIP
                    </span>
                  </li>
                  <li>
                    <span>
                      默认采用推荐的资源类型配置，若不符合你的预期，你可直接前往阿里云控制台自定义购买托管集群，然后返回到集群列表选择后开始初始化
                    </span>
                  </li>
                  <li>
                    <span>
                      购买集群的成功性和耗时取决于阿里云的实际状态，正常情况下预计10分钟可以完成集群购买
                    </span>
                  </li>
                  {customResource && (
                    <li>
                      <span>
                        自定义资源规格时请参考{' '}
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href="https://ecs-buy.aliyun.com/instanceTypes"
                        >
                          阿里云ECS规格说明文档
                        </a>{' '}
                        获取资源规格ID
                      </span>
                    </li>
                  )}
                </ul>
              </Paragraph>
            </Col>
            <Col span={12} style={{ padding: '0 16px' }}>
              <Form.Item label="区域">
                {getFieldDecorator('region', {
                  initialValue: 'cn-hangzhou',
                  rules: [{ required: true, message: '集群创建区域必选' }]
                })(
                  <Select placeholder="区域">
                    {cloud.getAllAliyunRegions().map(item => {
                      return (
                        <Option key={item.RegionId} value={item.RegionId}>
                          {item.LocalName}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </Form.Item>
            </Col>
            <Col span={12} style={{ padding: '0 16px' }}>
              <Form.Item label="名称">
                {getFieldDecorator('name', {
                  initialValue: '',
                  rules: [
                    { required: true, message: '集群名称必填' },
                    {
                      pattern: /^[a-z0-9A-Z-]+$/,
                      message: '只支持字母、数字和中划线组合'
                    },
                    { max: 24, message: '集群名称不能超过24字符' }
                  ]
                })(<Input placeholder="集群名称,请确保其保持唯一" />)}
              </Form.Item>
            </Col>
            <Col span={12} style={{ padding: '0 16px' }}>
              {!customResource && (
                <Form.Item label="资源配置">
                  {getFieldDecorator('resourceType', {
                    initialValue: 'ecs.g5.xlarge',
                    rules: [{ required: true, message: '资源配置必须指定' }]
                  })(
                    <Select
                      onChange={this.changeWorkerType}
                      placeholder="集群名称"
                    >
                      <Option value="ecs.g5.large">
                        最小配置（单节点2Core/8GB RAM, 按需预计2元/小时）
                      </Option>
                      <Option value="ecs.g5.xlarge">
                        普通配置（单节点4Core/16GB RAM, 按需预计4元/小时）
                      </Option>
                      <Option value="ecs.g5.2xlarge">
                        生产配置（单节点8Core/32GB RAM, 按需预计8元/小时）
                      </Option>
                      <Option value="">自定义</Option>
                    </Select>
                  )}
                </Form.Item>
              )}
              {customResource && (
                <Form.Item label="资源配置">
                  {getFieldDecorator('resourceType', {
                    initialValue: '',
                    rules: [
                      { required: true, message: '资源配置必须指定' },
                      {
                        pattern: /^[a-z0-9A-Z.]+$/,
                        message: '请确定资源配置规格是否合法'
                      }
                    ]
                  })(<Input placeholder="阿里云ECS规格" />)}
                </Form.Item>
              )}
            </Col>
            <Col span={12} style={{ padding: '0 16px' }}>
              <Form.Item label="节点数量">
                {getFieldDecorator('workerNum', {
                  initialValue: 2,
                  rules: [{ required: true, message: '节点数量必须指定' }]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    min={2}
                    placeholder="节点数量"
                  />
                )}
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    );
  }
}
