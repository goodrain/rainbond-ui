/* eslint-disable no-underscore-dangle */
import { Col, Form, Input, Modal, notification } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import globalUtil from '../../../utils/global';
import CodeMirrorForm from '../../CodeMirrorForm';
import styles from '../../CreateTeam/index.less';

const FormItem = Form.Item;

@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
class EditClusterInfo extends PureComponent {
  handleSubmit = () => {
    const { form } = this.props;
    const { validateFields } = form;
    validateFields((err, values) => {
      if (!err) {
        this.createClusters(values);
      }
    });
  };

  beforeUpload = (file, isMessage) => {
    const fileArr = file.name.split('.');
    const { length } = fileArr;
    const isRightType =
      fileArr[length - 1] === 'yaml' || fileArr[length - 1] === 'yml';
    if (!isRightType) {
      if (isMessage) {
        notification.warning({
          message: '请上传以.yaml、.yml结尾的 Region Config 文件'
        });
      }
      return false;
    }
    return true;
  };

  checkConfigFile = (rules, value, callback) => {
    if (value) {
      if (
        !value.file.name.endsWith('.yaml') &&
        !value.file.name.endsWith('.yml')
      ) {
        callback('请上传以yaml、yml结尾的 Region Config 文件');
        return;
      }
      if (value.fileList.length > 0) {
        const fileList = value.fileList.splice(-1);
        this.readFileContents(fileList, 'token');
        callback();
        return;
      }
      callback('上传的 Region Config 文件非法');
      return;
    }
    callback();
  };

  createClusters = values => {
    const { onOk, dispatch, eid, rainbondInfo, enterprise } = this.props;
    dispatch({
      type: 'region/createEnterpriseCluster',
      payload: {
        ...values,
        region_type: ['custom'],
        enterprise_id: eid,
        provider: 'directly',
        providerClusterID: ''
      },
      callback: res => {
        if (res && res._condition === 200) {
          notification.success({ message: formatMessage({id:'notification.success.add'}) });
          globalUtil.putInstallClusterLog(enterprise, rainbondInfo, {
            eid,
            status: 'complete',
            install_step: 'directly',
            provider: 'directly'
          });

          if (onOk) {
            onOk();
          }
        }
      }
    });
  };
  render() {
    const { form, onCancel } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 }
      }
    };
    return (
      <Modal
        visible
        title="添加集群"
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        width={800}
        onCancel={onCancel}
      >
        <Form labelAlign="left" onSubmit={this.handleSubmit}>
          <Col style={{ display: 'flex' }}>
            <FormItem
              {...formItemLayout}
              label="集群ID"
              style={{
                width: '50%',
                padding: '0 16px'
              }}
            >
              {getFieldDecorator('region_name', {
                initialValue: '',
                rules: [
                  { required: true, message: '集群ID是必填项，不可修改' },
                  {
                    pattern: /^[a-z0-9A-Z-_]+$/,
                    message: '只支持字母、数字和-_组合'
                  }
                ]
              })(<Input placeholder="请填写集群ID，添加后不可修改" />)}
            </FormItem>

            <FormItem
              {...formItemLayout}
              label="集群名称"
              style={{
                width: '50%',
                padding: '0 16px'
              }}
            >
              {getFieldDecorator('region_alias', {
                initialValue: '',
                rules: [
                  { required: true, message: '请填写集群名称!' },
                  { max: 24, message: '最大长度24位' }
                ]
              })(<Input placeholder="请填写集群名称" />)}
            </FormItem>
          </Col>
          <Col style={{ display: 'flex' }}>
            <FormItem
              {...formItemLayout}
              label="备注"
              style={{
                width: '100%',
                padding: '0 16px'
              }}
            >
              {getFieldDecorator('desc', {
                initialValue: ''
              })(<Input placeholder="备注信息" />)}
            </FormItem>
          </Col>
          <CodeMirrorForm
            titles="Region-Config 文件内容可通过执行`grctl config`命令获得"
            setFieldsValue={setFieldsValue}
            formItemLayout={formItemLayout}
            Form={Form}
            getFieldDecorator={getFieldDecorator}
            beforeUpload={this.beforeUpload}
            mode="yaml"
            name="token"
            label="Region Config"
            message="Region Config是必须的"
            width="752px"
          />
        </Form>
      </Modal>
    );
  }
}
const editClusterInfo = Form.create()(EditClusterInfo);
export default editClusterInfo;
