import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Card,
  Table,
  Input,
  Button,
  Alert,
  Select,
  Tag,
  Tooltip,
  Icon,
  Modal,
  message,
  Row,
  Col,
  Empty
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import NoPermTip from '../../components/NoPermTip';
import globalUtil from '../../utils/global';

@connect(
  ({ user, appControl, kubeblocks, loading }) => ({
    currUser: user.currentUser,
    appDetail: appControl.appDetail,
    clusterDetail: kubeblocks.clusterDetail,
    updateLoading: loading.effects && loading.effects['kubeblocks/updateParameters']
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      draft: {},
      baseline: {},
      parameterList: [],
      parameterPagination: {
        page: 1,
        page_size: 6,
        total: 0,
        keyword: ''
      },
      listLoading: false,
      pendingChanges: [],
      previewVisible: false,
      invalidVisible: false,
      invalidList: [],
      addParameterVisible: false,
      newParameters: []
    };
  }

  // 类型辅助：兼容后端不提供 enum 类型，但可能返回 enum_values 的情况
  isIntegerType = (type) => ['integer', 'int32', 'int64'].includes(type);
  isFloatType = (type) => ['float', 'double', 'number'].includes(type);
  isNumericType = (type) => this.isIntegerType(type) || this.isFloatType(type);

  // 当最大/最小值或当前值超出 JS 安全整数范围时，视为“非安全整型”，避免使用 Number/InputNumber
  isUnsafeIntegerContext = (type, value, minv, maxv) => {
    if (!this.isIntegerType(type)) return false;
    const MAX_SAFE = Number.MAX_SAFE_INTEGER;
    const MIN_SAFE = Number.MIN_SAFE_INTEGER;
    const toMaybeNum = (v) => (typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : null));
    // 若能被安全地转成 number，且处于安全整数范围内，则认为安全
    const cand = [value, minv, maxv].map(toMaybeNum).filter(v => v !== null);
    if (cand.length === 0) return false; // 无法判断则按安全处理
    return cand.some(v => !Number.isSafeInteger(v) || v > MAX_SAFE || v < MIN_SAFE);
  };

  trimQuotes = (s) => {
    if (typeof s !== 'string') return String(s);
    // 去除包裹的双引号，例如 '"ON"' -> 'ON'
    return s.replace(/^\"+|\"+$/g, '').replace(/^"+|"+$/g, '');
  };

  labelToBoolean = (label) => {
    if (label == null) return null;
    const t = String(label).trim().toLowerCase();
    if (['on', 'true', '1', 'yes', 'enabled', 'enable'].includes(t)) return true;
    if (['off', 'false', '0', 'no', 'disabled', 'disable'].includes(t)) return false;
    return null;
  };

  booleanToPreferredLabel = (bool, labels) => {
    const target = bool ? ['on', 'true', '1', 'yes', 'enabled', 'enable'] : ['off', 'false', '0', 'no', 'disabled', 'disable'];
    const found = (labels || []).find(l => target.includes(String(l).trim().toLowerCase()));
    return found != null ? found : String(bool);
  };

  normalizeForCompare = (val, type, enum_values, meta) => {
    const labels = Array.isArray(enum_values) ? enum_values.map(this.trimQuotes) : [];
    const allBooleanMappable = labels.length > 0 && labels.every(l => this.labelToBoolean(l) !== null);

    // 布尔：类型为 boolean，或枚举值可映射为布尔
    if (type === 'boolean' || allBooleanMappable) {
      if (typeof val === 'boolean') return { kind: 'boolean', val };
      const maybe = this.labelToBoolean(this.trimQuotes(String(val)));
      if (maybe !== null) return { kind: 'boolean', val: maybe };
    }

    // 数值：类型属于数值类
    if (this.isNumericType(type)) {
      // 对于超大整型，避免转为 Number，直接按字符串比较
      if (this.isUnsafeIntegerContext(type, val, meta && meta.min_value, meta && meta.max_value)) {
        return { kind: 'string', val: String(val) };
      }
      if (typeof val === 'number' && Number.isFinite(val)) return { kind: 'number', val };
      if (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val))) {
        return { kind: 'number', val: Number(val) };
      }
    }

    // 其他：按字符串比较（去除包裹引号）
    return { kind: 'string', val: this.trimQuotes(String(val)) };
  };

  componentDidMount() {
    this.fetchParameters();
  }

  // 获取 service context(team, service_alias)，若缺失返回 null
  getServiceCtx = () => {
    const { appDetail } = this.props;
    if (!appDetail || !appDetail.service) return null;
    const { service_alias } = appDetail.service;
    if (!service_alias) return null;
    return {
      team_name: globalUtil.getCurrTeamName(),
      service_alias
    };
  };

  // 从接口返回的列表合并到 baseline，便于等价判断与回显
  mergeBaselineFromList = (list = []) => {
    if (!Array.isArray(list)) return;
    this.setState(prev => {
      const next = { ...(prev.baseline || {}) };
      list.forEach(r => {
        next[r.name] = {
          value: r.value,
          meta: {
            type: r.type,
            min_value: r.min_value,
            max_value: r.max_value,
            enum_values: r.enum_values,
            is_required: r.is_required,
            is_dynamic: r.is_dynamic
          }
        };
      });
      return { baseline: next };
    });
  };

  // 统一获取枚举的可读标签
  getEnumLabels = (enum_values) => (Array.isArray(enum_values) ? enum_values.map(this.trimQuotes) : []);

  fetchParameters = () => {
    const { dispatch } = this.props;
    const { parameterPagination } = this.state;
    const ctx = this.getServiceCtx();
    if (!ctx) return;
    this.setState({ listLoading: true });
    dispatch({
      type: 'kubeblocks/fetchParameters',
      payload: {
        ...ctx,
        page: parameterPagination.page,
        page_size: parameterPagination.page_size,
        keyword: parameterPagination.keyword
      },
      callback: (response) => {
        if (response && response.status_code === 200) {
          this.mergeBaselineFromList(response.list);
          this.setState(prev => ({
            parameterList: response.list || [],
            parameterPagination: {
              ...prev.parameterPagination,
              page: response.page || prev.parameterPagination.page || 1,
              page_size: prev.parameterPagination.page_size,
              total: (response.total !== undefined ? response.total : response.number) || 0
            },
            listLoading: false
          }));
        } else {
          this.setState({ listLoading: false });
        }
      }
    });
  };

  handleSearch = value => {
    this.setState(prev => ({
      parameterPagination: {
        ...prev.parameterPagination,
        page: 1,
        keyword: value || ''
      }
    }), this.fetchParameters);
  };

  handleRefresh = () => {
    // 清空本地草稿，避免刷新后仍保留未提交的修改
    this.clearDraft();
    this.fetchParameters();
  };

  handlePageChange = (page, pageSize) => {
    this.setState(prev => ({
      parameterPagination: {
        ...prev.parameterPagination,
        page,
        page_size: pageSize
      }
    }), this.fetchParameters);
  };

  setDraft = (name, oldValue, newValue, meta) => {
    this.setState(prev => {
      const nextDraft = { ...prev.draft };
      const baselineItem = (prev.baseline && prev.baseline[name]) || {};
      const baselineValue = baselineItem.value !== undefined ? baselineItem.value : oldValue;

      // 依据类型与枚举做等价性比较：与基准值一致则移除草稿
      const type = (meta && meta.type) || (baselineItem.meta && baselineItem.meta.type);
      const enums = (meta && meta.enum_values) || (baselineItem.meta && baselineItem.meta.enum_values);
      const a = this.normalizeForCompare(newValue, type, enums, meta || (baselineItem && baselineItem.meta));
      const b = this.normalizeForCompare(baselineValue, type, enums, meta || (baselineItem && baselineItem.meta));
      const isEqualToBaseline = a.kind === b.kind && String(a.val) === String(b.val);

      if (isEqualToBaseline) {
        delete nextDraft[name];
        return { draft: nextDraft };
      }

      nextDraft[name] = {
        oldValue: baselineValue,
        newValue,
        meta: meta ? {
          type: meta.type,
          min_value: meta.min_value,
          max_value: meta.max_value,
          enum_values: meta.enum_values,
          is_required: meta.is_required,
          is_dynamic: meta.is_dynamic
        } : (baselineItem.meta || undefined)
      };
      return { draft: nextDraft };
    });
  };

  clearDraft = () => {
    this.setState({ draft: {} });
  };

  // 对数值进行裁剪：返回 { val, changed }
  clampValue = (type, raw, minv, maxv) => {
    // 非数值类型不处理
    if (!this.isNumericType(type)) return { val: raw, changed: false };

    const hasMin = minv !== undefined && minv !== null && minv !== '';
    const hasMax = maxv !== undefined && maxv !== null && maxv !== '';
    if (!hasMin && !hasMax) return { val: raw, changed: false };

    const unsafe = this.isUnsafeIntegerContext(type, raw, minv, maxv);

    // 整数：在非安全场景使用 BigInt 比较
    if (this.isIntegerType(type) && unsafe) {
      try {
        const v = BigInt(String(raw));
        const minB = hasMin ? BigInt(String(minv)) : null;
        const maxB = hasMax ? BigInt(String(maxv)) : null;
        let nv = v;
        if (minB !== null && nv < minB) nv = minB;
        if (maxB !== null && nv > maxB) nv = maxB;
        const res = nv.toString();
        return { val: res, changed: res !== String(raw) };
      } catch (e) {
        // 非法整数字符串，保持原值
        return { val: raw, changed: false };
      }
    }

    // 常规数值（安全整数或浮点）
    const n = Number(raw);
    if (!Number.isFinite(n)) return { val: raw, changed: false };
    let nv = n;
    if (hasMin) nv = Math.max(nv, Number(minv));
    if (hasMax) nv = Math.min(nv, Number(maxv));
    return { val: nv, changed: nv !== n };
  };

  // 按类型渲染编辑器
  renderEditor = (record) => {
    const { type, value, min_value, max_value, enum_values, name, editable = true } = record;
    const disabled = !editable;
    const onValueChange = v => {
      if (record.is_required && (v === '' || v === undefined || v === null)) {
        message.error(formatMessage({ id: 'kubeblocks.parameter.error.required', defaultMessage: '{name} 为必填项' }, { name }));
        return;
      }
      const oldValue = value;
      this.setDraft(name, oldValue, v, record);
    };

    // 存在枚举值，优先使用下拉
    const hasEnum = Array.isArray(enum_values) && enum_values.length > 0;
    if (hasEnum) {
      const labels = this.getEnumLabels(enum_values);
      // 若所有 label 都能映射为布尔值，并且当前值是布尔，优先用布尔作为选项值，避免受控值不匹配
      const allBooleanMappable = labels.every(l => this.labelToBoolean(l) !== null);
      const useBooleanOptions = allBooleanMappable && typeof value === 'boolean';

      const options = labels.map(l => ({ label: l, value: useBooleanOptions ? this.labelToBoolean(l) : l }));
      const selectValue = useBooleanOptions
        ? value
        : (typeof value === 'boolean' ? this.booleanToPreferredLabel(value, labels) : value);

      const handleChange = (val) => {
        if (useBooleanOptions) {
          onValueChange(Boolean(val));
        } else if (typeof value === 'boolean') {
          // 原始值为布尔，但 options 为字符串：做映射后保存布尔
          const mapped = this.labelToBoolean(val);
          onValueChange(mapped !== null ? mapped : val);
        } else {
          onValueChange(val);
        }
      };

      return (
        <Select
          value={selectValue}
          style={{ width: '100%' }}
          onChange={handleChange}
          disabled={disabled}
          getPopupContainer={triggerNode => triggerNode.parentNode}
        >
          {options.map(opt => (
            <Select.Option key={String(opt.value)} value={opt.value}>{opt.label}</Select.Option>
          ))}
        </Select>
      );
    }

    // 数值类型：允许任意字符串输入
    // 仅当输入可被解析为对应类型的数值时，才尝试进行范围裁剪
    if (this.isNumericType(type)) {
      return (
        <Input
          value={String(value)}
          onChange={e => onValueChange(e.target.value)}
          onBlur={() => {
            const { val, changed } = this.clampValue(type, value, min_value, max_value);
            if (changed) onValueChange(val);
          }}
          disabled={disabled}
        />
      );
    }
    if (type === 'boolean') {
      return (
        <Select
          value={!!value}
          style={{ width: '100%' }}
          onChange={val => onValueChange(Boolean(val))}
          disabled={disabled}
          getPopupContainer={n => n.parentNode}
        >
          <Select.Option value={true}>true</Select.Option>
          <Select.Option value={false}>false</Select.Option>
        </Select>
      );
    }
    return (
      <Input
        value={value}
        onChange={e => onValueChange(e.target.value)}
        disabled={disabled}
      />
    );
  };

  getColumns = () => {
    return [
      {
        title: formatMessage({ id: 'kubeblocks.parameter.table.name', defaultMessage: '参数名' }),
        dataIndex: 'name',
        key: 'name',
        width: 260,
        render: (text, record) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {record.is_required ? <span style={{ color: '#f5222d', marginRight: 4 }}>*</span> : null}
            <span>{text}</span>
            {record.description && (
              <Tooltip title={record.description}>
                <Icon type="question-circle" style={{ marginLeft: 6, color: '#999' }} />
              </Tooltip>
            )}
          </div>
        )
      },
      {
        title: formatMessage({ id: 'kubeblocks.parameter.table.value', defaultMessage: '参数值' }),
        dataIndex: 'value',
        key: 'value',
        render: (_, record) => this.renderEditor(record)
      },
      {
        title: formatMessage({ id: 'kubeblocks.parameter.table.range', defaultMessage: '参数值范围' }),
        dataIndex: 'range',
        key: 'range',
        width: 220,
        render: (_, record) => {
          const hasEnum = Array.isArray(record.enum_values) && record.enum_values.length > 0;
          // 数值类型：仅在存在最小或最大边界时显示对应项
          if (this.isNumericType(record.type)) {
            const parts = [];
            if (typeof record.min_value === 'number') parts.push(`Min:${record.min_value}`);
            if (typeof record.max_value === 'number') parts.push(`Max:${record.max_value}`);
            if (parts.length > 0) return <span>{parts.join(' ')}</span>;
            // 无边界则尝试回退到枚举展示
            if (hasEnum) return <span>{this.getEnumLabels(record.enum_values).join(',')}</span>;
            return <span>-</span>;
          }
          // 非数值类型但存在枚举
          if (hasEnum) {
            return <span>{this.getEnumLabels(record.enum_values).join(',')}</span>;
          }
          return <span>-</span>;
        }
      },
      {
        title: formatMessage({ id: 'kubeblocks.parameter.table.restart' }),
        dataIndex: 'is_dynamic',
        key: 'need_restart',
        width: 150,
        align: 'center',
        render: v => (v ? 'NO' : 'YES')
      }
    ];
  };

  // 校验所有草稿变更
  validateAll = () => {
    const { draft, parameterList } = this.state;
    const byName = {};
    (parameterList || []).forEach(r => { byName[r.name] = r; });
    const invalids = [];
    Object.keys(draft).forEach(name => {
      const val = draft[name].newValue;
      const row = byName[name] || (draft[name] && draft[name].meta) || {};
      // 仅校验必填非空
      if (row.is_required && (val === '' || val === null || val === undefined)) {
        invalids.push({ name, reason: 'required' });
      }
    });
    return invalids;
  };

  // 保存 → 预览更改
  handleSaveClick = () => {
    const { draft, baseline } = this.state;
    if (!draft || Object.keys(draft).length === 0) return;
    const invalids = this.validateAll();
    if (invalids.length > 0) {
      const names = invalids.map(i => i.name).join(', ');
      message.error(`以下必填项为空：${names}`);
      return;
    }

    // 统一裁剪所有草稿的数值并去除与基准一致的项
    const nextDraft = {};
    Object.keys(draft).forEach(name => {
      const item = draft[name];
      const meta = item.meta || (baseline[name] && baseline[name].meta) || {};
      let newVal = item.newValue;
      if (this.isNumericType(meta.type)) {
        const { val } = this.clampValue(meta.type, item.newValue, meta.min_value, meta.max_value);
        newVal = val;
      }
      // 在保存时不过度去重，避免由于类型/等价判定导致的误删，最终在提交前再做一次裁剪
      nextDraft[name] = { ...item, newValue: newVal };
    });

    // 固化待提交的变更集，防止之后翻页或再次请求影响提交计算
    const pendingChanges = Object.keys(nextDraft).map(name => ({ name, value: nextDraft[name].newValue }));

    this.setState({ draft: nextDraft, pendingChanges, previewVisible: true });
  };

  handlePreviewCancel = () => {
    this.setState({ previewVisible: false });
  };

  handlePreviewConfirm = () => {
    const { dispatch } = this.props;
    const { draft, baseline } = this.state;

    const ctx = this.getServiceCtx();
    if (!ctx) {
      message.error('缺少服务上下文，无法提交参数变更');
      return;
    }

    // 使用进入预览时固化的 pendingChanges，避免之后的翻页/刷新影响提交集合
    const changes = (this.state.pendingChanges || []).map(({ name, value }) => {
      const meta = (draft[name] && draft[name].meta) || (baseline[name] && baseline[name].meta) || {};
      let val = value;
      if (this.isNumericType(meta.type)) {
        val = this.clampValue(meta.type, val, meta.min_value, meta.max_value).val;
      }
      return { name, value: val };
    });

    dispatch({
      type: 'kubeblocks/updateParameters',
      payload: {
        ...ctx,
        body: { changes }
      },
      callback: (response) => {
        if (response && response.status_code === 200) {
          // 后端实际返回的是双层 bean 嵌套：
          // response.bean.bean = { applied: [...], invalids: [...] }
          const bean = (response && response.bean && response.bean.bean) || {};
          const applied = Array.isArray(bean.applied) ? bean.applied : [];
          const invalids = Array.isArray(bean.invalids) ? bean.invalids : [];

          if (invalids.length > 0) {
            // 有失败的参数，显示失败弹窗
            this.setState({
              invalidVisible: true,
              invalidList: invalids,
              previewVisible: false
            });

            // 清理已应用的草稿，保留失败的
            this.setState(prev => {
              const nextDraft = { ...prev.draft };
              applied.forEach(paramName => {
                if (nextDraft[paramName]) {
                  delete nextDraft[paramName];
                }
              });
              return { draft: nextDraft };
            });

            message.warning(
              formatMessage(
                { id: 'kubeblocks.parameter.save.partial_success' },
                { applied: applied.length, failed: invalids.length }
              )
            );
          } else {
            // 全部成功
            message.success(formatMessage({ id: 'kubeblocks.parameter.save.success', defaultMessage: '已保存' }));
            this.setState({ draft: {}, previewVisible: false });
            this.fetchParameters(); // 刷新数据
          }
        } else {
          message.error('参数更新失败，请重试');
        }
      }
    });
  };

  // 新增参数
  handleNewParameterClick = () => {
    this.setState({
      addParameterVisible: true,
      newParameters: [{ name: '', value: '', error: null }]
    });
  };

  handleAddParameterCard = () => {
    this.setState(prev => ({
      newParameters: [...prev.newParameters, { name: '', value: '', error: null }]
    }));
  };

  handleRemoveParameterCard = (index) => {
    this.setState(prev => ({
      newParameters: prev.newParameters.filter((_, i) => i !== index)
    }));
  };

  handleParameterChange = (index, field, value) => {
    this.setState(prev => {
      const nextParams = [...prev.newParameters];
      nextParams[index] = { ...nextParams[index], [field]: value, error: null };
      return { newParameters: nextParams };
    });
  };

  handleAddParameterCancel = () => {
    this.setState({
      addParameterVisible: false,
      newParameters: []
    });
  };

  handleAddParameterConfirm = () => {
    const { dispatch } = this.props;
    const { newParameters } = this.state;

    // 过滤掉空行并验证
    const validParams = newParameters.filter(p => p.name.trim() !== '' && p.value !== '');

    if (validParams.length === 0) {
      message.warning(formatMessage({ id: 'kubeblocks.parameter.add.validation.empty', defaultMessage: '请至少添加一个参数' }));
      return;
    }

    // 检查是否有不完整的数据
    const hasIncomplete = newParameters.some(p => {
      const hasName = p.name.trim() !== '';
      const hasValue = p.value !== '';
      return (hasName && !hasValue) || (!hasName && hasValue);
    });

    if (hasIncomplete) {
      message.warning(formatMessage({ id: 'kubeblocks.parameter.add.validation.incomplete', defaultMessage: '请填写完整的参数名和参数值' }));
      return;
    }

    const ctx = this.getServiceCtx();
    if (!ctx) {
      message.error('缺少服务上下文，无法提交参数变更');
      return;
    }

    const changes = validParams.map(p => ({ name: p.name, value: p.value }));

    dispatch({
      type: 'kubeblocks/updateParameters',
      payload: {
        ...ctx,
        body: { changes }
      },
      callback: (response) => {
        if (response && response.status_code === 200) {
          const bean = (response && response.bean && response.bean.bean) || {};
          const applied = Array.isArray(bean.applied) ? bean.applied : [];
          const invalids = Array.isArray(bean.invalids) ? bean.invalids : [];

          if (invalids.length > 0) {
            // 部分失败：保持弹窗打开，移除成功的参数，为失败的参数添加错误信息
            this.setState(prev => {
              const nextParams = prev.newParameters.filter(p =>
                !applied.includes(p.name)
              );

              const withErrors = nextParams.map(p => {
                const failedItem = invalids.find(inv => inv.name === p.name);
                return failedItem
                  ? { ...p, error: failedItem.code }
                  : { ...p, error: null };
              });

              return { newParameters: withErrors };
            });

            message.warning(
              formatMessage(
                { id: 'kubeblocks.parameter.add.partial_success' },
                { applied: applied.length, failed: invalids.length }
              )
            );

            this.fetchParameters();

          } else {
            // 全部成功：关闭弹窗
            message.success(formatMessage({ id: 'kubeblocks.parameter.add.success', defaultMessage: '参数添加成功' }));
            this.setState({
              addParameterVisible: false,
              newParameters: []
            });
            this.fetchParameters();
          }
        } else {
          message.error('参数添加失败，请重试');
        }
      }
    });
  };

  render() {
    const { appDetail, componentPermissions = {}, updateLoading, clusterDetail } = this.props;
    const {
      draft,
      previewVisible,
      invalidVisible,
      invalidList,
      parameterList,
      parameterPagination,
      listLoading,
      addParameterVisible,
      newParameters
    } = this.state;
    const columns = this.getColumns();
    const hasChanges = Object.keys(draft).length > 0;
    const modifiedCount = Object.keys(draft).length;

    // 数据库是否支持参数配置
    const isParameterUnsupported = clusterDetail?.basic?.support_parameter !== true;
    // 数据库类型
    const databaseType = clusterDetail?.basic?.type || '';

    return (
      <div>
        <Alert
          type="info"
          showIcon
          message={<FormattedMessage id="kubeblocks.parameter.alert.static_restart" />}
          style={{ marginBottom: 12 }}
        />
        <Card
          title={<FormattedMessage id="kubeblocks.parameter.title" />}
          loading={listLoading}
          style={{ marginBottom: 16 }}
          extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input.Search
                placeholder={formatMessage({ id: 'kubeblocks.parameter.search.placeholder' })}
                defaultValue={parameterPagination?.keyword || ''}
                onSearch={this.handleSearch}
                allowClear
                style={{ width: 260, marginRight: 12 }}
              />
              {modifiedCount > 0 && (
                <Tag color="orange" style={{ marginRight: 8 }}>
                  {formatMessage({ id: 'kubeblocks.parameter.modified' }, { count: modifiedCount })}
                </Tag>
              )}
              <Button type="default" onClick={this.handleNewParameterClick} disabled={isParameterUnsupported}>
                <FormattedMessage id="kubeblocks.parameter.add" />
              </Button>
              <Button style={{ marginLeft: 12 }} onClick={this.handleRefresh}>
                <FormattedMessage id="kubeblocks.parameter.refresh" />
              </Button>
              <Button
                type="primary"
                disabled={!hasChanges}
                loading={updateLoading}
                onClick={this.handleSaveClick}
                style={{ marginLeft: 8 }}
              >
                <FormattedMessage id="kubeblocks.parameter.save" />
              </Button>
            </div>
          }
        >
          {/* 高亮样式 */}
          <style>{`
          .kb-param-modified td { background: #fffbe6 !important; }
          @media (prefers-color-scheme: dark) {
            .kb-param-modified td { background: rgba(250, 173, 20, 0.15) !important; }
          }
        `}</style>
          <Table
            rowKey="name"
            columns={columns}
            dataSource={(parameterList || []).map(r => {
              const d = draft && draft[r.name];
              if (!d) return r;
              // 使用草稿的新值覆盖展示，确保翻页返回后仍显示用户修改
              return { ...r, value: d.newValue };
            })}
            rowClassName={(record) => (draft && draft[record.name] ? 'kb-param-modified' : '')}
            locale={{
              emptyText: isParameterUnsupported ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={formatMessage({ id: 'kubeblocks.parameter.unsupported' })}
                />
              ) : (
                <Empty description={formatMessage({ id: 'kubeblocks.parameter.empty' })} />
              )
            }}
            pagination={{
              current: parameterPagination?.page || 1,
              pageSize: parameterPagination?.page_size || 6,
              total: parameterPagination?.total || 0,
              onChange: this.handlePageChange,
              onShowSizeChange: this.handlePageChange,
              pageSizeOptions: ['6', '12', '24', '48'],
              showSizeChanger: true,
              showTotal: total => `${formatMessage({ id: 'kubeblocks.parameter.total', defaultMessage: '共' })} ${total}`
            }}
          />
        </Card>

        {/* 预览更改弹窗 */}
        <Modal
          title={formatMessage({ id: 'kubeblocks.parameter.preview.title' })}
          visible={previewVisible}
          onCancel={this.handlePreviewCancel}
          onOk={this.handlePreviewConfirm}
        >
          <Table
            size="small"
            rowKey="name"
            pagination={false}
            columns={[
              { title: formatMessage({ id: 'kubeblocks.parameter.preview.name' }), dataIndex: 'name', key: 'name' },
              { title: formatMessage({ id: 'kubeblocks.parameter.preview.old' }), dataIndex: 'oldValue', key: 'old' },
              { title: formatMessage({ id: 'kubeblocks.parameter.preview.new' }), dataIndex: 'newValue', key: 'new' },
              { title: formatMessage({ id: 'kubeblocks.parameter.preview.restart' }), dataIndex: 'needRestart', key: 'restart', align: 'center' }
            ]}
            dataSource={Object.keys(draft).map(name => {
              const item = draft[name];
              const meta = item.meta || {};
              return {
                name,
                oldValue: item.oldValue,
                newValue: item.newValue,
                needRestart: meta.is_dynamic ? 'NO' : 'YES'
              };
            })}
          />
        </Modal>

        {/* 失败结果弹窗 */}
        <Modal
          title={formatMessage({ id: 'kubeblocks.parameter.invalid.title' })}
          visible={invalidVisible}
          onCancel={() => this.setState({ invalidVisible: false })}
          footer={[
            <Button key="ok" type="primary" onClick={() => this.setState({ invalidVisible: false })}>
              {formatMessage({ id: 'kubeblocks.parameter.invalid.ok' })}
            </Button>
          ]}
        >
          <div>
            <p style={{ marginBottom: 16 }}>
              {formatMessage({ id: 'kubeblocks.parameter.invalid.message' })}
            </p>
            <Table
              size="small"
              rowKey="name"
              pagination={false}
              columns={[
                {
                  title: formatMessage({ id: 'kubeblocks.parameter.invalid.name' }),
                  dataIndex: 'name',
                  key: 'name'
                },
                {
                  // 仅展示后端提供的 code
                  title: formatMessage({ id: 'kubeblocks.parameter.invalid.reason' }),
                  dataIndex: 'code',
                  key: 'code',
                  render: (code) => code || '-'
                }
              ]}
              dataSource={invalidList}
            />
          </div>
        </Modal>

        {/* 新增参数弹窗 */}
        <Modal
          title={formatMessage({ id: 'kubeblocks.parameter.add.modal.title' })}
          visible={addParameterVisible}
          onCancel={this.handleAddParameterCancel}
          onOk={this.handleAddParameterConfirm}
          width={600}
          confirmLoading={updateLoading}
          keyboard={false}
        >
          <div style={{ marginBottom: 16 }}>
            {newParameters.map((param, index) => (
              <Card
                key={index}
                size="small"
                style={{
                  marginBottom: 12,
                  borderColor: param.error ? '#f5222d' : undefined
                }}
                extra={
                  newParameters.length > 1 && (
                    <Icon
                      type="close"
                      style={{ cursor: 'pointer', color: '#999' }}
                      onClick={() => this.handleRemoveParameterCard(index)}
                    />
                  )
                }
              >
                <Row gutter={12}>
                  <Col span={12}>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#999' }}>
                      {formatMessage({ id: 'kubeblocks.parameter.add.modal.name', defaultMessage: '参数名' })}
                    </div>
                    <Input
                      placeholder={formatMessage({ id: 'kubeblocks.parameter.add.modal.name.placeholder', defaultMessage: '请输入参数名' })}
                      value={param.name}
                      onChange={e => this.handleParameterChange(index, 'name', e.target.value)}
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#999' }}>
                      {formatMessage({ id: 'kubeblocks.parameter.add.modal.value', defaultMessage: '参数值' })}
                    </div>
                    <Input
                      placeholder={formatMessage({ id: 'kubeblocks.parameter.add.modal.value.placeholder', defaultMessage: '请输入参数值' })}
                      value={param.value}
                      onChange={e => this.handleParameterChange(index, 'value', e.target.value)}
                    />
                  </Col>
                </Row>
                {param.error && (
                  <div style={{
                    marginTop: 8,
                    padding: '4px 8px',
                    backgroundColor: '#fff1f0',
                    border: '1px solid #ffccc7',
                    borderRadius: 2,
                    fontSize: 12,
                    color: '#cf1322'
                  }}>
                    <Icon type="exclamation-circle" style={{ marginRight: 4 }} />
                    {param.error}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Button
            type="dashed"
            onClick={this.handleAddParameterCard}
            block
            icon="plus"
          >
            {formatMessage({ id: 'kubeblocks.parameter.add.modal.add_more', defaultMessage: '添加更多参数' })}
          </Button>
        </Modal>
      </div>
    );
  }
}
