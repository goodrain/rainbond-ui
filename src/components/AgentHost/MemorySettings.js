import React, { PureComponent } from 'react';
import { Button, Input, Popconfirm, Select, message } from 'antd';
import {
  createAgentMemory,
  deleteAgentMemory,
  listAgentMemories
} from '../../services/agent';
import styles from './index.less';

const KIND_OPTIONS = [
  { label: '偏好', value: 'preference' },
  { label: '约定', value: 'convention' },
  { label: '事实', value: 'fact' }
];

const KIND_LABELS = {
  preference: '偏好',
  convention: '约定',
  fact: '事实'
};

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

/**
 * 用户级记忆管理（P0）。
 *
 * 放在聊天面板里而不是插件配置页：配置页只有企业管理员能进，而偏好是
 * 每个登录用户自己的东西。这里只管理"表达方式"类记忆，涉及审批/流程的
 * 内容在后端就被拒收。
 */
export default class MemorySettings extends PureComponent {
  state = {
    items: [],
    loading: false,
    submitting: false,
    content: '',
    kind: 'preference'
  };

  componentDidMount() {
    this.load();
  }

  load = () => {
    this.setState({ loading: true });
    listAgentMemories()
      .then(payload => {
        const items = (payload && payload.items) || [];
        this.setState({ items });
      })
      .catch(error => {
        message.error((error && error.message) || '加载记忆失败');
      })
      .finally(() => this.setState({ loading: false }));
  };

  handleAdd = () => {
    const content = (this.state.content || '').trim();
    if (!content) {
      message.warning('请先输入要记住的内容');
      return;
    }
    this.setState({ submitting: true });
    createAgentMemory({ content, kind: this.state.kind })
      .then(payload => {
        message.success(payload && payload.deduped ? '这条记忆已存在' : '已记住');
        this.setState({ content: '' });
        this.load();
      })
      .catch(error => {
        message.error((error && error.message) || '没有写入记忆');
      })
      .finally(() => this.setState({ submitting: false }));
  };

  handleRemove = memoryId => {
    deleteAgentMemory(memoryId)
      .then(() => {
        this.load();
      })
      .catch(error => {
        message.error((error && error.message) || '删除失败');
      });
  };

  render() {
    const { items, loading, submitting, content, kind } = this.state;
    return (
      <div className={styles.autoApprovalList} style={{ width: 360 }}>
        <div className={styles.autoApprovalHint}>
          只影响表达方式（长度、称呼、术语），不改变工具选择和审批行为。
        </div>

        <Input.TextArea
          rows={2}
          maxLength={500}
          value={content}
          placeholder="例如：回答先给结论，细节折叠起来"
          onChange={event => this.setState({ content: event.target.value })}
        />
        <div className={styles.autoApprovalActions} style={{ marginTop: 8 }}>
          <Select
            size="small"
            value={kind}
            style={{ width: 88 }}
            onChange={value => this.setState({ kind: value })}
          >
            {KIND_OPTIONS.map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
          <Button size="small" type="primary" loading={submitting} onClick={this.handleAdd}>
            记住
          </Button>
        </div>

        {loading ? (
          <div className={styles.autoApprovalEmpty}>加载中…</div>
        ) : null}
        {!loading && !items.length ? (
          <div className={styles.autoApprovalEmpty}>还没有记忆</div>
        ) : null}
        {!loading &&
          items.map(item => (
            <div key={item.id} className={styles.autoApprovalItem}>
              <span title={item.content}>
                <span style={{ color: '#8c8c8c', marginRight: 6 }}>
                  [{KIND_LABELS[item.kind] || item.kind}]
                </span>
                {item.content}
                <span style={{ color: '#bfbfbf', marginLeft: 6 }}>
                  {formatTime(item.updatedAt)}
                </span>
              </span>
              <Popconfirm
                title="删除这条记忆？"
                okText="删除"
                cancelText="取消"
                onConfirm={() => this.handleRemove(item.id)}
              >
                <a>删除</a>
              </Popconfirm>
            </div>
          ))}
        {!loading && items.length ? (
          <div className={styles.autoApprovalActions}>
            <Button size="small" icon="reload" onClick={this.load}>
              刷新
            </Button>
          </div>
        ) : null}
      </div>
    );
  }
}
