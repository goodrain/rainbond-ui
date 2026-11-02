import React, { PureComponent } from 'react';
import { Button, Popconfirm, message } from 'antd';
import {
  deleteAgentMemory,
  getAgentMemoryStatus,
  listAgentMemories
} from '../../services/agent';
import styles from './index.less';

const KIND_LABELS = {
  preference: '偏好',
  convention: '约定',
  fact: '事实',
  habit: '习惯'
};

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

/**
 * 我的习惯（自动记忆）。
 *
 * 记忆由对话自动学习：从你说话的措辞、格式、称呼里提炼稳定偏好，不需要手写。
 * 这里只做两件事：让你看见它学到了什么，以及删掉学错的。
 */
export default class MemorySettings extends PureComponent {
  state = {
    items: [],
    loading: false,
    ready: true,
    storage: '',
    enabled: true,
    learnEnabled: true
  };

  componentDidMount() {
    this.load();
  }

  load = () => {
    this.setState({ loading: true });
    Promise.all([listAgentMemories(), getAgentMemoryStatus()])
      .then(([listPayload, status]) => {
        this.setState({
          items: (listPayload && listPayload.items) || [],
          ready: !status || status.ready !== false,
          storage: (status && status.storage) || '',
          enabled: !status || status.enabled !== false,
          learnEnabled: !status || status.learnEnabled !== false
        });
      })
      .catch(error => {
        message.error((error && error.message) || '加载记忆失败');
      })
      .finally(() => this.setState({ loading: false }));
  };

  handleRemove = memoryId => {
    deleteAgentMemory(memoryId)
      .then(() => this.load())
      .catch(error => {
        message.error((error && error.message) || '删除失败');
      });
  };

  renderNotice() {
    const { ready, storage, enabled, learnEnabled } = this.state;
    if (!ready) {
      return (
        <div className={styles.autoApprovalError}>
          记忆存储不可用（{storage || '未知存储'}）。请管理员确认数据库迁移
          028/029 是否已执行。
        </div>
      );
    }
    if (!enabled) {
      return (
        <div className={styles.autoApprovalHint}>记忆功能当前已关闭。</div>
      );
    }
    if (!learnEnabled) {
      return (
        <div className={styles.autoApprovalHint}>
          自动学习已关闭，只保留已有记忆。可以在删除后不再积累。
        </div>
      );
    }
    return null;
  }

  render() {
    const { items, loading } = this.state;
    return (
      <div className={styles.autoApprovalList} style={{ width: 340 }}>
        <div className={styles.autoApprovalHint}>
          这些习惯从你的对话里自动学到，只影响表达方式（长度、语气、称呼、格式），
          不会改变工具选择和审批行为。学错了可以直接删掉。
        </div>

        {this.renderNotice()}

        {loading ? (
          <div className={styles.autoApprovalEmpty}>加载中…</div>
        ) : null}
        {!loading && !items.length ? (
          <div className={styles.autoApprovalEmpty}>还没有学到习惯</div>
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
                title="删掉这条记忆？"
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
