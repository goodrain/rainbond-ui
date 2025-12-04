import { Button, Form, Modal } from 'antd';
import React, { Fragment, PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
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
        footer={[<Button onClick={onCancel}> <FormattedMessage id='componentOverview.body.ViewRunHealthCheck.close'/> </Button>]}
      >
        <Form>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewRunHealthCheck.port'/>}>
            <span>{appProbeUtil.getPort(data)}</span>
          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewRunHealthCheck.probe'/>}>
            <span>{appProbeUtil.getProtocol(data)}</span>
          </FormItem>
          {data.scheme === 'http' ? (
            <Fragment>
              <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.ViewRunHealthCheck.http'/>}>
                <span>{appProbeUtil.getHeaders(data)}</span>
              </FormItem>
              <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewRunHealthCheck.path'/>}>
                <span>{appProbeUtil.getPath(data)}</span>
              </FormItem>
            </Fragment>
          ) : null}
          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.ViewRunHealthCheck.initialization'/>}>
            <span>
              {appProbeUtil.getInitWaitTime(data)}
              <span
                style={{
                  marginLeft: 8
                }}
              >
                <FormattedMessage id='componentOverview.body.ViewRunHealthCheck.second'/>
              </span>
            </span>
          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewRunHealthCheck.time'/>}>
            <span>
              {appProbeUtil.getIntervalTime(data)}
              <span
                style={{
                  marginLeft: 8
                }}
              >
                <FormattedMessage id='componentOverview.body.ViewRunHealthCheck.second'/>
              </span>
            </span>
          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewRunHealthCheck.overtime'/>}>
            <span>
              {appProbeUtil.getTimeoutTime(data)}
              <span
                style={{
                  marginLeft: 8
                }}
              >
                <FormattedMessage id='componentOverview.body.ViewRunHealthCheck.second'/>
              </span>
            </span>
          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewRunHealthCheck.frequency'/>}>
            <span>{appProbeUtil.getFailTimes(data)}</span>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
