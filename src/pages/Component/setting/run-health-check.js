import { Button, Form, Modal } from 'antd';
import React, { Fragment, PureComponent } from 'react';
import appProbeUtil from '../../../utils/appProbe-util';

const FormItem = Form.Item;

// 查看运行时健康监测
export default class ViewRunHealthCheck extends PureComponent {
  render() {
    const { title, onCancel } = this.props;
    const data = this.props.data || {};
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 8
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 16
        }
      }
    };
    return (
      <Modal
        title={title}
        visible
        onCancel={onCancel}
        footer={[<Button onClick={onCancel}> 关闭 </Button>]}
      >
        <Form>
          <FormItem {...formItemLayout} label="监测端口">
            <span>{appProbeUtil.getPort(data)}</span>
          </FormItem>
          <FormItem {...formItemLayout} label="探针使用协议">
            <span>{appProbeUtil.getProtocol(data)}</span>
          </FormItem>
          {data.scheme === 'http' ? (
            <Fragment>
              <FormItem {...formItemLayout} label="http请求头">
                <span>{appProbeUtil.getHeaders(data)}</span>
              </FormItem>
              <FormItem {...formItemLayout} label="路径">
                <span>{appProbeUtil.getPath(data)}</span>
              </FormItem>
            </Fragment>
          ) : null}
          <FormItem {...formItemLayout} label="初始化等候时间">
            <span>
              {appProbeUtil.getInitWaitTime(data)}
              <span
                style={{
                  marginLeft: 8
                }}
              >
                秒
              </span>
            </span>
          </FormItem>
          <FormItem {...formItemLayout} label="检测监测时间">
            <span>
              {appProbeUtil.getIntervalTime(data)}
              <span
                style={{
                  marginLeft: 8
                }}
              >
                秒
              </span>
            </span>
          </FormItem>
          <FormItem {...formItemLayout} label="检测超时时间">
            <span>
              {appProbeUtil.getTimeoutTime(data)}
              <span
                style={{
                  marginLeft: 8
                }}
              >
                秒
              </span>
            </span>
          </FormItem>
          <FormItem {...formItemLayout} label="连续错误次数">
            <span>{appProbeUtil.getFailTimes(data)}</span>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
