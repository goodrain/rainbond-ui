import { Button, Form, Modal } from 'antd';
import React, { Fragment, PureComponent } from 'react';
import appProbeUtil from '../../../utils/appProbe-util';

const FormItem = Form.Item;

// 查看启动时健康监测
export default class ViewHealthCheck extends PureComponent {
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
        footer={[<Button onClick={onCancel}> <FormattedMessage id='componentOverview.body.ViewHealthCheck.close'/> </Button>]}
      >
        <Form>
          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.ViewHealthCheck.Monitoring_port'/>}>
            <span>{data.port}</span>
          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewHealthCheck.agreement'/>}>
            <span>{data.scheme}</span>
          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewHealthCheck.unhealth'/>}>
            <span>
              {data.mode == 'readiness'
                ? <FormattedMessage id='componentOverview.body.ViewHealthCheck.OfflineOffline'/>
                : data.mode == 'liveness'
                ? <FormattedMessage id='componentOverview.body.ViewHealthCheck.restart'/>
                : <FormattedMessage id='componentOverview.body.ViewHealthCheck.setting'/>}
            </span>
          </FormItem>
          {data.scheme === 'http' ? (
            <Fragment>
              <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewHealthCheck.http'/>}>
                <span>{appProbeUtil.getHeaders(data)}</span>
              </FormItem>
              <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewHealthCheck.path'/>}>
                <span>{appProbeUtil.getPath(data)}</span>
              </FormItem>
            </Fragment>
          ) : null}

          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.ViewHealthCheck.initialization'/>}>
            <span>
              {appProbeUtil.getInitWaitTime(data)}
              <span
                style={{
                  marginLeft: 8
                }}
              >
                <FormattedMessage id='componentOverview.body.ViewHealthCheck.second'/>
              </span>
            </span>
          </FormItem>
          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.ViewHealthCheck.testing_time'/>}>
            <span>
              {appProbeUtil.getIntervalTime(data)}
              <span
                style={{
                  marginLeft: 8
                }}
              >
                <FormattedMessage id='componentOverview.body.ViewHealthCheck.second'/>
              </span>
            </span>
          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewHealthCheck.overtime'/>}>
            <span>
              {appProbeUtil.getTimeoutTime(data)}
              <span
                style={{
                  marginLeft: 8
                }}
              >
                <FormattedMessage id='componentOverview.body.ViewHealthCheck.second'/>
              </span>
            </span>
          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ViewHealthCheck.success'/>}>
            <span>{appProbeUtil.getSuccessTimes(data)}</span>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
