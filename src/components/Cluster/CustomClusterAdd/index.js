import { Col, Form, Input, Modal, notification } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
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
        title="对接Kubernetes集群"
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        width={800}
        confirmLoading={loading}
        onCancel={onCancel}
      >
        <Form labelAlign="left" onSubmit={this.handleSubmit}>
          <Col style={p16}>
            <Form.Item label="集群名称">
              {getFieldDecorator('name', {
                initialValue: '',
                rules: [
                  { required: true, message: '集群名称必填' },
                  {
                    pattern: /^[a-z0-9A-Z-]+$/,
                    message: '只支持字母、数字和中划线组合'
                  },
                  { max: 24, message: '最大长度24位' }
                ]
              })(<Input placeholder="集群名称,请确保其保持唯一" />)}
            </Form.Item>
          </Col>
          <Col style={p16}>
            <CodeMirrorForm
              titles="Kubeconfig配置文件, 需确保当前网络可以正常与 Kubernetes API 进行通信, 即server地址不能为[127.0.0.1 / 本地域名] 等形式, 应为当前控制台容器能访问到的内网 IP 或公网 IP。"
              setFieldsValue={setFieldsValue}
              formItemLayout={formItemLayout}
              Form={Form}
              getFieldDecorator={getFieldDecorator}
              beforeUpload={this.beforeUpload}
              mode="yaml"
              name="kubeconfig"
              label="KubeConfig"
              message="KubeConfig 文件是必需的。"
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
