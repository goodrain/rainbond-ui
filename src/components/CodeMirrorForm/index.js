import { Upload } from 'antd';
import React, { PureComponent } from 'react';
import CodeMirror from 'react-codemirror';
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import styles from './index.less';

require('codemirror/lib/codemirror.css');
require('codemirror/theme/seti.css');
require('codemirror/addon/display/fullscreen.css');
require('../../styles/codemirror.less');
require('codemirror/addon/display/panel');
require('codemirror/mode/xml/xml');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/yaml/yaml');
require('codemirror/addon/display/fullscreen');
require('codemirror/addon/edit/matchbrackets');

// eslint-disable-next-line react/no-redundant-should-component-update
class CodeMirrorForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fullScreen: false
    };
    this.CodeMirrorRef = '';
  }
  componentWillReceiveProps(nextProps) {
    const { name, data, setFieldsValue } = this.props;
    const { CodeMirrorRef } = this;
    if (data !== nextProps.data && CodeMirrorRef) {
      setFieldsValue({
        [name]: nextProps.data
      });
      if (CodeMirrorRef) {
        const editor = CodeMirrorRef.getCodeMirror();
        editor.setValue(nextProps.data);
      }
    }
  }
  saveRef = ref => {
    this.CodeMirrorRef = ref;
    const { saveRef = false } = this.props;
    if (saveRef) {
      saveRef(ref);
    }
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
          [name]: fileString
        });
        if (CodeMirrorRef) {
          const editor = CodeMirrorRef.getCodeMirror();
          editor.setValue(fileString);
        }
      };
    }
  };
  checkValue = (_, value, callback) => {
    const { message } = this.props;
    if (value === '' || !value || (value && value.trim() === '')) {
      callback(message);
      return;
    }
    callback();
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
      width: proWidth,
      mode,
      action,
      beforeUpload,
      isHeader = true,
      isUpload = true,
      isAmplifications = true,
      disabled = false,
      titles,
      bg = '#333',
      help
    } = this.props;
    const { fullScreen } = this.state;
    let defaultFullScreenStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      cursor: 'pointer',
      top: '0',
      textAlign: 'left',
      background: bg,
      lineHeight: '1px',
      padding: '9px 0 6px 0'
    };

    if (fullScreen) {
      defaultFullScreenStyle = Object.assign(defaultFullScreenStyle, {
        position: 'fixed',
        right: '5px',
        width: '100%',
        zIndex: 99
      });
    } else {
      defaultFullScreenStyle = Object.assign(defaultFullScreenStyle, {
        position: 'absolute',
        width: proWidth || '100%',
        zIndex: 4
      });
    }

    const options = {
      mode: { name: mode || 'javascript', json: true },
      lineNumbers: true,
      theme: 'seti',
      fullScreen,
      lineWrapping: true,
      smartIndent: true,
      matchBrackets: true,
      scrollbarStyle: null,
      showCursorWhenSelecting: true,
      readOnly: disabled
    };

    const token = cookie.get('token');
    const amplifications = (
      <span
        style={{ margin: '0 20px' }}
        onClick={() => {
          this.setState({ fullScreen: !this.state.fullScreen });
        }}
      >
        {globalUtil.fetchSvg('amplifications')}
      </span>
    );
    return (
      <Form.Item
        {...formItemLayout}
        label={label}
        help={help && <span style={{ color: 'red' }}>{help}</span>}
        className={
          fullScreen
            ? `${styles.fullScreens} ${styles.childrenWidth}`
            : styles.childrenWidth
        }
      >
        {getFieldDecorator(name, {
          initialValue: data || '',
          rules: [{ required: true, validator: this.checkValue }]
        })(<CodeMirror options={options} ref={this.saveRef} />)}
        {amplifications}
        {isHeader && (
          <div style={defaultFullScreenStyle}>
            <div
              style={{ lineHeight: '20px', paddingLeft: '30px', color: '#fff' }}
            >
              {titles || ''}
            </div>
            <div>
              {isUpload && (
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
                  {globalUtil.fetchSvg('uploads')}
                </Upload>
              )}
              {isAmplifications && amplifications}
            </div>
          </div>
        )}
      </Form.Item>
    );
  }
}

export default CodeMirrorForm;
