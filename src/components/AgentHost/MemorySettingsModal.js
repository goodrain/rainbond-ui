import React, { PureComponent } from 'react';
import { Alert, Button, Empty, Icon, Modal, Spin, Tag } from 'antd';
import {
  deleteAgentMemory,
  getAgentMemoryStatus,
  getRecentMemoryInjections,
  listAgentMemories
} from '../../services/agent';
import styles from './index.less';

/**
 * 我的记忆（弹窗）。
 *
 * 入口在聊天面板头部的灯泡按钮；记忆由对话自动沉淀，这里只做三件事：
 * 看见它学到了什么、把学错的删掉。
 *
 * 刻意不做筛选框：记忆有硬配额（习惯 120 + 案例 80），一屏滚动足够；
 * 也刻意不用 Popconfirm / Dropdown —— 弹窗自身 z-index 高于 antd 浮层默认值，
 * 走 portal 的浮层会被压在弹窗下面，表现为"点了没反应"。删除用行内二次确认。
 */

const KIND_META = {
  preference: { label: '你的偏好', color: '#1B5DFB' },
  convention: { label: '团队约定', color: '#13C2C2' },
  fact: { label: '已知事实', color: '#52C41A' },
  habit: { label: '沟通习惯', color: '#722ED1' },
  case: { label: '排障经验', color: '#FA8C16' },
  episode: { label: '上次进度', color: '#8C8C8C' },
  procedure: { label: '操作口诀', color: '#EB2F96' }
};

const SCOPE_LABELS = {
  user: '个人',
  app: '应用',
  component: '组件'
};

/** 只给用户看"关于我"和"经验"；工作记录属于内部状态，不在这里展示。 */
const VISIBLE_KINDS = new Set([
  'preference',
  'habit',
  'convention',
  'fact',
  'case'
]);

/**
 * 把模型写的第三人称记录改成第二人称短句：
 * "用户偏好先给结论，尽量简洁" -> "先给结论，尽量简洁"。
 * 只做前缀剥离，改不动就原样显示，避免把事实改错。
 */
function humanizeMemory(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const stripped = raw
    .replace(
      /^用户\s*(偏好|喜欢|不喜欢|希望|要求|习惯|倾向于|通常|总是|经常|讨厌)[：:\s]*/,
      ''
    )
    .replace(/^用户[：:\s]*/, '')
    .replace(/^(偏好|习惯|希望|要求)[：:\s]*/, '');
  return stripped || raw;
}


/** 后端单页上限 100，记忆本身有硬配额，一次取够即可。 */
const MAX_ITEMS = 100;

function pad(value) {
  return value < 10 ? `0${value}` : String(value);
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function kindMeta(kind) {
  return KIND_META[kind] || { label: kind || '记忆', color: '#8C8C8C' };
}

export default class MemorySettingsModal extends PureComponent {
  state = {
    items: [],
    loading: false,
    loaded: false,
    error: '',
    ready: true,
    storage: '',
    enabled: true,
    learnEnabled: true,
    pendingDeleteId: '',
    deletingId: '',
    notice: '',
    lastInjection: null
  };

  componentDidMount() {
    if (this.props.visible) this.load();
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) this.load();
  }

  componentWillUnmount() {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
  }

  load = () => {
    this.setState({ loading: true, error: '' });
    Promise.all([
      listAgentMemories({ limit: MAX_ITEMS }),
      getAgentMemoryStatus(),
      // 审计行是增强信息：接口不存在或失败时不影响主列表。
      getRecentMemoryInjections(1).catch(() => ({ items: [] }))
    ])
      .then(([listPayload, status, injections]) => {
        const item =
          (injections && injections.items && injections.items[0]) || null;
        this.setState({
          items: (listPayload && listPayload.items) || [],
          loaded: true,
          ready: !status || status.ready !== false,
          storage: (status && status.storage) || '',
          enabled: !status || status.enabled !== false,
          learnEnabled: !status || status.learnEnabled !== false,
          lastInjection: item
        });
      })
      .catch(error => {
        this.setState({
          error: (error && error.message) || '加载记忆失败'
        });
      })
      .finally(() => this.setState({ loading: false }));
  };

  visibleItems() {
    return this.state.items.filter(item => VISIBLE_KINDS.has(item.kind));
  }

  /** 行内提示：不用 antd message（它的 z-index 低于弹窗，会被遮罩挡住）。 */
  flash = text => {
    this.setState({ notice: text });
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => this.setState({ notice: '' }), 3000);
  };

  handleRemove = memoryId => {
    this.setState({ deletingId: memoryId });
    deleteAgentMemory(memoryId)
      .then(() => {
        this.setState(state => ({
          items: state.items.filter(item => item.id !== memoryId),
          pendingDeleteId: '',
          deletingId: ''
        }));
        this.flash('已删除，之后不会再带上它');
      })
      .catch(error => {
        this.setState({ deletingId: '' });
        this.flash((error && error.message) || '删除失败');
      });
  };

  renderAlert() {
    const { ready, storage, enabled, learnEnabled, loaded } = this.state;
    if (!loaded) return null;
    if (!ready) {
      return (
        <Alert
          className={styles.memoryAlert}
          type="error"
          showIcon
          message={`记忆存储不可用（${storage || '未知存储'}）`}
          description="请管理员确认迁移 034/035 是否已执行，或数据库账号是否可写。"
        />
      );
    }
    if (!enabled) {
      return (
        <Alert
          className={styles.memoryAlert}
          type="warning"
          showIcon
          message="记忆功能当前已关闭"
          description="已有记忆不会被注入，也不会继续学习。"
        />
      );
    }
    if (!learnEnabled) {
      return (
        <Alert
          className={styles.memoryAlert}
          type="info"
          showIcon
          message="自动学习已关闭，只保留已有记忆"
        />
      );
    }
    if (storage === 'memory') {
      return (
        <Alert
          className={styles.memoryAlert}
          type="info"
          showIcon
          message="当前使用进程内存，重启后会丢失"
          description="生产环境应使用 MySQL 存储。"
        />
      );
    }
    return null;
  }

  renderActions(item) {
    const { pendingDeleteId, deletingId } = this.state;

    if (pendingDeleteId === item.id) {
      return (
        <div className={styles.memoryItemActions}>
          <span className={styles.memoryActionMuted}>删掉这条？</span>
          <a
            className={styles.memoryActionDanger}
            onClick={() => this.handleRemove(item.id)}
          >
            {deletingId === item.id ? '删除中…' : '确认删除'}
          </a>
          <a
            className={styles.memoryActionMuted}
            onClick={() => this.setState({ pendingDeleteId: '' })}
          >
            取消
          </a>
        </div>
      );
    }

    return (
      <div className={styles.memoryItemActions}>
        <a
          className={styles.memoryActionDanger}
          onClick={() => this.setState({ pendingDeleteId: item.id })}
        >
          删除
        </a>
      </div>
    );
  }

  renderItem(item) {
    const meta = kindMeta(item.kind);
    const scope = item.scope || 'user';
    const text = humanizeMemory(item.summary || item.content || '');
    return (
      <div key={item.id} className={styles.memoryItem}>
        <span
          className={styles.memoryKindBar}
          style={{ backgroundColor: meta.color }}
        />
        <div className={styles.memoryItemMain}>
          <div className={styles.memoryItemTitle}>
            <Tag
              className={styles.memoryKindTag}
              style={{
                color: meta.color,
                borderColor: `${meta.color}33`,
                backgroundColor: `${meta.color}0F`
              }}
            >
              {meta.label}
            </Tag>
            {scope !== 'user' ? (
              <Tag className={styles.memoryScopeTag}>
                {SCOPE_LABELS[scope] || scope}
              </Tag>
            ) : null}
            {item.pinned ? (
              <span title="置顶：每轮都会带上">
                <Icon type="star" theme="filled" className={styles.memoryPin} />
              </span>
            ) : null}
            <span className={styles.memoryTime}>
              {formatDateTime(item.updatedAt)}
            </span>
            {item.hitCount >= 3 ? (
              <span className={styles.memoryHit}>用过 {item.hitCount} 次</span>
            ) : null}
          </div>
          <div className={styles.memoryItemText} title={item.content}>
            {text}
          </div>
        </div>
        {this.renderActions(item)}
      </div>
    );
  }

  render() {
    const { visible, onClose } = this.props;
    const { loading, loaded, error } = this.state;
    const items = this.visibleItems();

    return (
      <Modal
        visible={visible}
        onCancel={onClose}
        footer={null}
        width={760}
        centered
        // 聊天面板 z-index 是 1080/1200，弹窗必须压在它上面。
        zIndex={1300}
        destroyOnClose={false}
        wrapClassName={styles.memoryModal}
        title={
          <span className={styles.memoryModalTitle}>
            <Icon type="bulb" theme="filled" /> 我的记忆
          </span>
        }
      >
        <div className={styles.memoryModalBody}>
          <div className={styles.memoryModalHint}>
            这里是助手从聊天里记住的东西：你的说话偏好、团队约定，以及踩过的坑。
            它只会影响表达方式；工具怎么调、审批怎么走，仍然由规则决定。记错了可以直接删掉。
          </div>

          {this.renderAlert()}

          {error ? (
            <Alert
              className={styles.memoryAlert}
              type="error"
              showIcon
              message={error}
            />
          ) : null}

          <div className={styles.memoryList}>
            {loading && !loaded ? (
              <div className={styles.memoryLoading}>
                <Spin />
              </div>
            ) : null}
            {!loading && !items.length ? (
              <Empty
                className={styles.memoryEmpty}
                description="还没有记住什么。正常聊天就行，助手会自动记下稳定的偏好。"
              />
            ) : null}
            {items.map(item => this.renderItem(item))}
          </div>

          <div className={styles.memoryFooter}>
            <span className={styles.memoryCount}>
              共 {items.length} 条
              {this.state.notice ? (
                <span className={styles.memoryNotice}>{this.state.notice}</span>
              ) : null}
            </span>
            <div className={styles.memoryFooterActions}>
              <Button
                size="small"
                icon="reload"
                loading={loading}
                onClick={this.load}
              >
                刷新
              </Button>
              <Button
                size="small"
                className={styles.memoryClose}
                onClick={onClose}
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
