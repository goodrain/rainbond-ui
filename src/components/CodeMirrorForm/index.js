import { Form, Upload } from 'antd';
import React, { PureComponent } from 'react';
import CodeMirror from 'react-codemirror';
import jsYaml from 'js-yaml';
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import styles from './index.less';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/seti.css';
import 'codemirror/addon/display/fullscreen.css';
import 'codemirror/addon/display/panel';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/addon/display/fullscreen';
import 'codemirror/addon/edit/matchbrackets';

// eslint-disable-next-line react/no-redundant-should-component-update
class CodeMirrorForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fullScreen: false
    };
    this.CodeMirrorRef = '';
    this.refreshTimer = null;
    this.refreshAnimationFrame = null;
  }

  getValueFromProps = (props = this.props) => {
    if (Object.prototype.hasOwnProperty.call(props, 'value')) {
      return props.value || '';
    }
    return props.data || '';
  };

  getEditor = () => {
    const { CodeMirrorRef } = this;
    return CodeMirrorRef && CodeMirrorRef.getCodeMirror ? CodeMirrorRef.getCodeMirror() : null;
  };

  hasDecorator = (props = this.props) => !!(props.getFieldDecorator && props.name);

  syncEditorValue = (props = this.props) => {
    const editor = this.getEditor();
    const nextValue = this.getValueFromProps(props);
    const { name, setFieldsValue } = props;

    if (setFieldsValue && name && this.hasDecorator(props)) {
      setFieldsValue({
        [name]: nextValue
      });
    }

    if (editor && editor.getValue() !== nextValue) {
      editor.setValue(nextValue);
    }
  };

  setEditorSize = () => {
    const { editorHeight } = this.props;
    const { fullScreen } = this.state;
    const editor = this.getEditor();

    if (!editor || !editor.setSize) {
      return;
    }

    if (fullScreen) {
      editor.setSize('100%', '100%');
      return;
    }

    editor.setSize('100%', editorHeight || null);
  };

  clearEditorRefreshTask = () => {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.refreshAnimationFrame && typeof window !== 'undefined' && window.cancelAnimationFrame) {
      window.cancelAnimationFrame(this.refreshAnimationFrame);
      this.refreshAnimationFrame = null;
    }
  };

  refreshEditor = () => {
    const editor = this.getEditor();

    if (editor && editor.refresh) {
      editor.refresh();
      this.setEditorSize();
    }
  };

  scheduleEditorRefresh = (delay = 0) => {
    this.clearEditorRefreshTask();

    this.refreshTimer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        this.refreshAnimationFrame = window.requestAnimationFrame(() => {
          this.refreshAnimationFrame = null;
          this.refreshEditor();
        });
      } else {
        this.refreshEditor();
      }
      this.refreshTimer = null;
    }, delay);
  };

  emitValue = (value) => {
    const { onChange, name, setFieldsValue } = this.props;

    if (setFieldsValue && name && !this.hasDecorator()) {
      setFieldsValue({
        [name]: value
      });
    }

    if (onChange) {
      onChange(value);
    }
  };

  componentWillReceiveProps(nextProps) {
    const currentValue = this.getValueFromProps(this.props);
    const nextValue = this.getValueFromProps(nextProps);

    if (currentValue !== nextValue) {
      this.syncEditorValue(nextProps);
    }
  }

  componentDidMount() {
    const { bool } = this.props;
    if (bool) {
      const { CodeMirrorRef } = this;
      const editor = CodeMirrorRef.getCodeMirror();
      editor.on("focus", this.focusEvent)
      editor.on("blur", this.blurEvent)
    }

    this.syncEditorValue();
    this.setEditorSize();
    this.scheduleEditorRefresh();
  }

  componentDidUpdate(prevProps, prevState) {
    const prevValue = this.getValueFromProps(prevProps);
    const currentValue = this.getValueFromProps();
    const becameVisible = !prevProps.visible && this.props.visible;

    if (
      prevProps.editorHeight !== this.props.editorHeight ||
      prevState.fullScreen !== this.state.fullScreen
    ) {
      this.setEditorSize();
      this.scheduleEditorRefresh(becameVisible ? 200 : 0);
      return;
    }

    if (prevValue !== currentValue) {
      this.scheduleEditorRefresh(becameVisible ? 200 : 0);
      return;
    }

    if (becameVisible) {
      this.scheduleEditorRefresh(200);
    }
  }

  componentWillUnmount() {
    this.clearEditorRefreshTask();
  }

  saveRef = ref => {
    this.CodeMirrorRef = ref;
    const { saveRef = false } = this.props;
    if (saveRef) {
      saveRef(ref);
    }
  };
  focusEvent = () => {
    const { data, TooltipValue, bool } = this.props
    const { CodeMirrorRef } = this;
    const editor = CodeMirrorRef.getCodeMirror();
    const str = editor.getValue()
    if (bool) {
      if (str == TooltipValue) {
        editor.setValue('')
      } else {
        editor.setValue(str)
      }
    }
  }
  blurEvent = () => {
    const { data, TooltipValue, bool } = this.props;
    const { CodeMirrorRef } = this;
    const editor = CodeMirrorRef.getCodeMirror();
    const str = editor.getValue()
    if (bool) {
      if (str.length == 0) {
        editor.setValue(TooltipValue)
      } else {
        editor.setValue(str)
      }
    }
  }
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
    for (let i = 0; i < fileList.length; i++) {
      const reader = new FileReader(); // 新建一个FileReader
      reader.readAsText(fileList[i].originFileObj, 'UTF-8'); // 读取文件
      // eslint-disable-next-line no-loop-func
      reader.onload = evt => {
        // 读取完文件之后会回来这里
        fileString += evt.target.result; // 读取文件内容
        this.emitValue(fileString);
        const editor = this.getEditor();
        if (editor) {
          editor.setValue(fileString);
        }
      };
    }
  };
  validateYaml = (value) => {
    try {
      if (value) {
        // 去除首尾空白字符
        const trimmedValue = value.trim();

        // 检查是否包含冒号（key-value 格式的基本特征）
        if (!trimmedValue.includes(':')) {
          return {
            isValid: false,
            error: 'YAML 格式必须包含 key: value 格式的内容'
          };
        }

        // 解析 YAML
        const parsed = jsYaml.load(trimmedValue);

        // 验证解析结果必须是对象或数组
        if (parsed === null || parsed === undefined) {
          return {
            isValid: false,
            error: 'YAML 内容不能为空'
          };
        }

        if (typeof parsed !== 'object') {
          return {
            isValid: false,
            error: 'YAML 格式必须是对象或数组结构'
          };
        }

        return { isValid: true };
      }
      return { isValid: true };
    } catch (e) {
      return { isValid: false, error: e.message };
    }
  };
  checkValue = (_, value, callback) => {
    const { message, mode } = this.props;
    if (value === '' || !value || (value && value.trim() === '')) {
      callback(message);
      return;
    }
    // 如果是 yaml 模式，进行 YAML 格式校验
    if (mode === 'yaml') {
      const validation = this.validateYaml(value);
      if (!validation.isValid) {
        callback(`YAML 格式错误: ${validation.error}`);
        return;
      }
    }
    callback();
  };

  handleEditorChange = (value) => {
    this.emitValue(value);
  };

  render() {
    const {
      Form: LegacyForm,
      getFieldDecorator,
      formItemLayout,
      data,
      value,
      label,
      name,
      message,
      style,
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
      help,
      isAuto = false,
    } = this.props;
    const { fullScreen } = this.state;
    const FormComponent = LegacyForm || Form;
    const FormItem = FormComponent.Item || Form.Item;
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
    const amplifications = isAmplifications ? (
      <span
        style={{ margin: '0 20px' }}
        onClick={() => {
          this.setState({ fullScreen: !this.state.fullScreen });
        }}
      >
        {globalUtil.fetchSvg('amplifications')}
      </span>
    ) : null;

    const editorClassName = !fullScreen && isAuto ? styles.isAuto : '';
    const controlledValue = Object.prototype.hasOwnProperty.call(this.props, 'value') ? value : data;
    const editorNode = this.hasDecorator()
      ? getFieldDecorator(name, {
        initialValue: data || '',
        rules: [{ required: true, validator: this.checkValue }]
      })(<CodeMirror className={editorClassName} options={options} ref={this.saveRef} />)
      : (
        <CodeMirror
          className={editorClassName}
          options={options}
          ref={this.saveRef}
          value={controlledValue || ''}
          onChange={this.handleEditorChange}
        />
      );

    return (
      <FormItem
        {...formItemLayout}
        label={label}
        style={style}
        help={help && <span style={{ color: 'red' }}>{help}</span>}
        className={
          fullScreen
            ? `${styles.fullScreens} ${styles.childrenWidth}`
            : styles.childrenWidth
        }
      >
        {editorNode}
        {!isHeader && amplifications}
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
      </FormItem>
    );
  }
}

export default CodeMirrorForm;
