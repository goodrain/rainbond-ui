import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
    Row,
    Col,
    Card,
    Table,
    Button,
    Drawer,
    Form,
    Input,
    Radio,
    Upload,
    Icon,
    message
} from 'antd';

import globalUtil from '../../utils/global';
import apiconfig from '../../config/config';
import cookie from "../../utils/cookie";
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { TextArea } = Input;

@connect(
    ({ loading }) => ({
        editLicenseLoading: loading.effects['gateWay/editLicense'],
        addLicenseLoading: loading.effects['gateWay/addLicense']
    }),
)
class LicenseDrawer extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {

        }
    }
    handleSubmit = (e) => {
        e.preventDefault();
        const { onOk } = this.props
        this.props.form.validateFields((err, values) => {
            if (!err) {
                onOk && onOk(values);
            }
        });
    }
    //验证上传文件方式
    checkFile_public = (rules, value, callback) => {
        if (value) {
            if (value.fileList.length > 0 && (value.file.name.endsWith(".pem") || value.file.name.endsWith(".cer") || value.file.name.endsWith(".crt") || value.file.name.endsWith(".key"))) {
                const fileList =  value.fileList.splice(-1);
                this.readFileContents(fileList, 'certificate');
                callback();
                return;
            } else {
                // callback('请上传文件');
                return;
            }
        }
        callback()
    }
    //验证上传文件方式
    checkFile_private = (rules, value, callback) => {
        if (value) {
            if (value.fileList.length > 0 && (value.file.name.endsWith(".pem") || value.file.name.endsWith(".cer") || value.file.name.endsWith(".crt") || value.file.name.endsWith(".key"))) {
                const fileList =  value.fileList.splice(-1);
                this.readFileContents(fileList, 'private_key');
                callback();
                return;
            } else {
                // callback('请上传文件');
                return;
            }
        }
        callback()
    }
    readFileContents = (fileList, name) => {
        const _th = this;
        let fileString = "";
        for (var i = 0; i < fileList.length; i++) {
            var reader = new FileReader(); //新建一个FileReader
            reader.readAsText(fileList[i].originFileObj, "UTF-8"); //读取文件
            reader.onload = function ss(evt) { //读取完文件之后会回来这里
                fileString += evt.target.result;// 读取文件内容
                _th.props.form.setFieldsValue({ [name]: fileString })
            }
        }
    }
    beforeUpload = (file) => {
        // console.log(file)
        const fileArr = file.name.split(".");
        const length = fileArr.length;
        let isRightType = fileArr[length - 1] == "pem" || fileArr[length - 1] == "crt" || fileArr[length - 1] == "cer" || fileArr[length - 1] == "key";
        if (!isRightType) {
            message.error('请上传以.pem, .crt, .cer, .key结尾的文件', 5);
            return false;
        }else{
            return true;
        }

    }
    render() {
        const { onClose, editData, addLicenseLoading, editLicenseLoading } = this.props;
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 4 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 18 }
            }
        };
        let token = cookie.get('token');

        return (
            <div>
                <Drawer
                    title={editData ? '编辑证书' : '添加证书'}
                    placement="right"
                    width={500}
                    closable={true}
                    onClose={onClose}
                    visible={this.props.visible}
                    maskClosable={true}
                    style={{
                        height: 'calc(100% - 55px)',
                        overflow: 'auto',
                        paddingBottom: 53,
                    }}
                >
                    <Form>
                        <FormItem
                            {...formItemLayout}
                            label="证书名称"
                            style={{ textAlign: "right" }}
                        >
                            {getFieldDecorator('alias', {
                                rules: [{ required: true, message: '请输入证书名称!' }]
                            })(
                                <Input placeholder="请输入证书名称" />
                            )}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label="证书类型"
                        >
                            {getFieldDecorator("certificate_type", {
                                initialValue: "服务端证书",
                                rules: [{ required: true }]
                            })(
                                <RadioGroup >
                                    <Radio value="服务端证书">服务端证书</Radio>
                                    {/* <Radio value="客户端证书">客户端证书</Radio> */}
                                </RadioGroup>
                            )}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            style={{ textAlign: "right" }}
                            label="公钥证书"
                        >
                            {getFieldDecorator('certificate', {
                                rules: [{ required: true, message: '请输入证书名称!' }]
                            })(
                                <TextArea rows={8} style={{ backgroundColor: "#02213f", color: "#fff" }} />
                            )}
                        </FormItem>
                        <Row>
                            <Col
                                style={{ marginTop: "-6%" }}
                                span={4} offset={4}>
                                <FormItem
                                >
                                    {getFieldDecorator('public_key_btn', {
                                        rules: [{ validator: this.checkFile_public }],
                                    })(
                                        <Upload
                                            action={`${apiconfig.baseUrl}/console/enterprise/team/certificate`}
                                            showUploadList={false}
                                            withCredentials={true}
                                            headers={{ Authorization: `GRJWT ${token}` }}
                                            beforeUpload={this.beforeUpload}
                                        >
                                            <Button size="small">
                                                上传
                                    </Button>
                                        </Upload>
                                    )}
                                </FormItem>
                            </Col>
                        </Row>
                        <FormItem
                            {...formItemLayout}
                            style={{ textAlign: "right" }}
                            label="私钥"
                        >
                            {getFieldDecorator('private_key', {
                                rules: [{ required: true, message: '请输入私钥!' }]
                            })(
                                <TextArea rows={8} style={{ backgroundColor: "#02213f", color: "#fff" }} />
                            )}
                        </FormItem>
                        <Row>
                            <Col
                                style={{ marginTop: "-6%" }}
                                span={4} offset={4}>
                                <FormItem
                                >
                                    {getFieldDecorator('private_key_btn', {
                                        rules: [{ validator: this.checkFile_private }],
                                    })(
                                        <Upload
                                            action={`${apiconfig.baseUrl}/console/enterprise/team/certificate`}
                                            showUploadList={false}
                                            withCredentials={true}
                                            headers={{ Authorization: `GRJWT ${token}` }}
                                            beforeUpload={this.beforeUpload}
                                        >
                                            <Button size="small">
                                                上传
                                            </Button>
                                        </Upload>
                                    )}
                                </FormItem>
                            </Col>
                        </Row>
                    </Form>
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            width: '100%',
                            borderTop: '1px solid #e8e8e8',
                            padding: '10px 16px',
                            textAlign: 'right',
                            left: 0,
                            background: '#fff',
                            borderRadius: '0 0 4px 4px',
                        }}
                    >
                        <Button
                            style={{
                                marginRight: 8,
                            }}
                            onClick={onClose}
                        >
                            取消
                        </Button>
                        <Button onClick={this.handleSubmit} type="primary" loading={editLicenseLoading || addLicenseLoading}>确认</Button>
                    </div>
                </Drawer>
            </div>
        )
    }
}
const DrawerForm = Form.create()(LicenseDrawer);
export default DrawerForm;