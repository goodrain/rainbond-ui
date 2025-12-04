import { Col, Form, Input, Modal, notification } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import cloud from '../../../utils/cloud';
import CodeMirrorForm from '../../CodeMirrorForm';
import styles from '../../CreateTeam/index.less';

@connect()
class EditClusterInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false
    };
  }
  handleSubmit = () => {
    const { form, dispatch, eid, onOK } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.setState({ loading: true });
      dispatch({
        type: 'cloud/createKubernetesCluster',
        payload: {
          enterprise_id: eid,
          provider_name: 'custom',
          ...fieldsValue
        },
        callback: data => {
          if (data && onOK) {
            onOK(data);
          }
        },
        handleError: res => {
          if (res && res.data && res.data.code === 7005) {
            this.setState({
              loading: false
            });
            return;
          }
          cloud.handleCloudAPIError(res);
          this.setState({ loading: false });
        }
      });
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
          message: formatMessage({id:'notification.warn.yaml_file'})
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

  render() {
    const { form, onCancel } = this.props;
    const { loading } = this.state;
    const { getFieldDecorator, setFieldsValue } = form;
    const p16 = { padding: '0 16px' };
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
        title={<FormattedMessage id='enterpriseColony.CustomClusterAdd.title'/>}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        width={800}
        confirmLoading={loading}
        onCancel={onCancel}
      >
        <Form labelAlign="left" onSubmit={this.handleSubmit}>
          <Col style={p16}>
            <Form.Item  label={<FormattedMessage id='enterpriseColony.addCluster.host.name_Cluster'/>}>
              {getFieldDecorator('name', {
                initialValue: '',
                rules: [
                  { required: true, message: formatMessage({id:'enterpriseColony.addCluster.host.required'}) },
                  {
                    pattern: /^[a-z0-9A-Z-]+$/,
                    message: formatMessage({id:'enterpriseColony.addCluster.host.supported'})
                  },
                  { max: 24, message:  formatMessage({id:'enterpriseColony.addCluster.host.max'})}
                ]
              })(<Input  placeholder={formatMessage({id:'enterpriseColony.addCluster.host.only'})}/>)}
            </Form.Item>
          </Col>
          <Col style={p16}>
            <CodeMirrorForm
              titles={<FormattedMessage id='enterpriseColony.CustomClusterAdd.titles'/>}
              setFieldsValue={setFieldsValue}
              formItemLayout={formItemLayout}
              Form={Form}
              getFieldDecorator={getFieldDecorator}
              beforeUpload={this.beforeUpload}
              mode="yaml"
              name="kubeconfig"
              label="KubeConfig"
              message={<FormattedMessage id='enterpriseColony.CustomClusterAdd.msg'/>}
              width="720px"
            />
          </Col>
        </Form>
      </Modal>
    );
  }
}
const editClusterInfo = Form.create()(EditClusterInfo);
export default editClusterInfo;
