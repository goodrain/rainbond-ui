import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Input, Modal, notification, Col, Row, Upload, Button } from 'antd';
import styles from '../../CreateTeam/index.less';
import apiconfig from "../../../../config/api.config";


const { TextArea } = Input;
const FormItem = Form.Item;

@connect()
class EditClusterInfo extends PureComponent {
  handleSubmit = () => {
    const { form } = this.props;
    const { validateFields } = form;
    validateFields((err, values) => {
      if (!err) {
        this.createClusters(values)
      }
    });
  };
  checkConfigFile = (rules, value, callback) => {
    if (value) {
        if (value.fileList.length > 0 && (value.file.name.endsWith(".yaml") || value.file.name.endsWith(".yml"))) {
            const fileList =  value.fileList.splice(-1);
            this.readFileContents(fileList, 'token');
            callback();
            return;
        }
    }
    callback("上传的 Region Config 文件非法")
  }
  readFileContents = (fileList, name) => {
    const reader = new FileReader();
    reader.onload = (evt)=> {
        this.props.form.setFieldsValue({ [name]: evt.target.result })
    }
    reader.readAsText(fileList[0].originFileObj, "UTF-8");
  }
  createClusters = values => {
    const { onOk } = this.props;
    const { dispatch, eid } = this.props;
    dispatch({
      type: "region/createEnterpriseCluster",
      payload: {
        ...values,
        region_type: "custom",
        enterprise_id: eid
      },
      callback: res => {
        if (res && res._condition === 200) {
          notification.success({ message: "添加成功" });
          if (onOk) {
            onOk()
          }
        }
      }
    });
  };
  render() {
    const { form, onCancel } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
      },
      wrapperCol: {
        xs: { span: 24 },
      },
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
          <Col style={{display: "flex"}}>
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
                    { pattern: /^[a-z0-9A-Z-_]+$/, message: '只支持字母、数字和-_组合' }
                ],
              })(
                <Input
                  placeholder="请填写集群ID，添加后不可修改"
                />
              )}
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
                rules: [{ required: true, message: '请填写集群名称!' }],
              })(
                <Input
                  placeholder="请填写集群名称"
                />
              )}
            </FormItem>
          </Col>
          <Col style={{display: "flex"}}>
            <FormItem
              {...formItemLayout}
              label="备注"
              style={{
                width: '100%',
                padding: '0 16px'
              }}
            >
              {getFieldDecorator('desc', {
                initialValue: '',
              })(
                <Input
                  placeholder="备注信息"
                />
              )}
            </FormItem>
          </Col>
          <Col>
            <FormItem
              {...formItemLayout}
              label="Region Config"
              style={{
                width: '100%',
                padding: '0 16px',
                margin: 0
              }}
            >
              {getFieldDecorator("token", {
            rules: [{ required: true, message: "Region Config是必须的" }]
          })(
            <TextArea
              rows={8}
              style={{ backgroundColor: "#02213f", color: "#fff" }}
            />
          )}
            </FormItem>
            <Row>
              <Col style={{marginTop: "0", padding: '0 16px'}}>
                <FormItem>
                  {getFieldDecorator("token_btn", {
                      rules: [{ validator: this.checkConfigFile }],
                  })(
                    <Upload
                      action={`${apiconfig.baseUrl}/console/enterprise/team/certificate`}
                      showUploadList={false}
                      withCredentials
                      headers={{
                    Authorization: `GRJWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxOTcsImVtYWlsIjoiMTUzMTA3NzIyMEAxNjMuY29tIiwiZXhwIjoxNTQzOTc3NzkzLCJ1c2VybmFtZSI6IndhbmdjIn0.RTCZIJI8Fsl2rs8a7grhuo_F9DWM77nomMg8dyq8lU8`
                  }}
                    >
                      <Button type="link" size="small">上传 Region-Config 文件</Button>
                      
                    </Upload>
              )}
                  <span style={{fontSize: "12px"}}>Region-Config 文件内容可通过执行`grctl config`命令获得</span>
                </FormItem>
              </Col>
            </Row>
          </Col>
        </Form>
      </Modal>
    );
  }
}
const editClusterInfo = Form.create()(EditClusterInfo);
export default editClusterInfo;
