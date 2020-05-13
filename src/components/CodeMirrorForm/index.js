import React, { PureComponent } from 'react';
import CodeMirror from 'react-codemirror';
import { Upload } from 'antd';
import cookie from '../../utils/cookie';
import apiconfig from '../../../config/api.config';
import AmplificationImg from '../../../public/images/amplification.png';
import UploadImg from '../../../public/images/upload.png';

require('codemirror/lib/codemirror.css');
require('codemirror/theme/seti.css');
require('codemirror/addon/display/fullscreen.css');
require('../../styles/codemirror.less');

require('codemirror/addon/display/panel');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/yaml/yaml');
require('codemirror/addon/display/fullscreen');
require('codemirror/addon/edit/matchbrackets');

class CodeMirrorForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fullScreen: false,
    };
    this.CodeMirrorRef = '';
  }

  saveRef = ref => {
    this.CodeMirrorRef = ref;
  };

  handleChangeUpload = info => {
    const { beforeUpload } = this.props;
    if (beforeUpload) {
      if (beforeUpload(info.file, false)) {
        this.handleFile(info);
      }
      return null;
    }

    return this.handleFile(info);
  };
  handleFile = info => {
    let fileList = [...info.fileList];
    if (fileList.length > 0) {
      fileList = fileList.slice(-1);
      this.readFileContents(fileList, 'file_content');
    }
  };

  readFileContents = fileList => {
    let fileString = '';
    const { CodeMirrorRef } = this;
    const { name, setFieldsValue } = this.props;
    for (let i = 0; i < fileList.length; i++) {
      const reader = new FileReader(); // 新建一个FileReader
      reader.readAsText(fileList[i].originFileObj, 'UTF-8'); // 读取文件
      // eslint-disable-next-line no-loop-func
      reader.onload = evt => {
        // 读取完文件之后会回来这里
        fileString += evt.target.result; // 读取文件内容
        setFieldsValue({
          [name]: fileString,
        });
        if (CodeMirrorRef) {
          const editor = CodeMirrorRef.getCodeMirror();
          editor.setValue(fileString);
        }
      };
    }
  };

  render() {
    const {
      Form,
      getFieldDecorator,
      formItemLayout,
      data,
      label,
      name,
      message,
      width,
      mode,
      action,
      beforeUpload,
    } = this.props;
    const { fullScreen } = this.state;
    const defaultFullScreenStyle = fullScreen
      ? {
          position: 'fixed',
          top: 0,
          right: '5px',
          width: '100%',
          cursor: 'pointer',
          textAlign: 'right',
          zIndex: 99,
          background: '#333',
        }
      : {
          position: 'absolute',
          top: 0,
          width,
          textAlign: 'right',
          cursor: 'pointer',
          zIndex: 4,
          background: '#333',
        };
    const options = {
      mode: mode || 'javascript',
      lineNumbers: true,
      theme: 'seti',
      fullScreen,
      matchBrackets: true,
    };

    const token = cookie.get('token');

    return (
      <Form.Item {...formItemLayout} label={label}>
        {getFieldDecorator(name, {
          initialValue: data || '',
          rules: [{ required: true, message }],
        })(<CodeMirror options={options} ref={this.saveRef} />)}
        <div style={defaultFullScreenStyle}>
          <Upload
            action={
              action ||
              `${apiconfig.baseUrl}/console/enterprise/team/certificate`
            }
            showUploadList={false}
            withCredentials
            headers={{ Authorization: `GRJWT ${token}` }}
            beforeUpload={beforeUpload || false}
            onChange={this.handleChangeUpload}
          >
            <img src={UploadImg} alt="" />
          </Upload>
          <img
            style={{ margin: '0 20px' }}
            onClick={() => {
              this.setState({ fullScreen: !this.state.fullScreen });
            }}
            src={AmplificationImg}
            alt="放大"
          />
        </div>
      </Form.Item>
    );
  }
}

export default CodeMirrorForm;
