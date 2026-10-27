import React, { PureComponent } from 'react';
import {
  Alert,
  Button,
  Dropdown,
  Empty,
  Icon,
  Input,
  Menu,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Spin,
  Tag,
  Tooltip,
  message
} from 'antd';
import {
  deleteAgentMemory,
  getAgentMemoryStatus,
  listAgentMemories,
  submitAgentMemoryFeedback
} from '../../services/agent';
import styles from './index.less';

/**
 * 我的记忆（弹窗）。
 *
 * 入口在聊天面板头部的灯泡按钮；记忆本身由对话自动沉淀，这里只做三件事：
 * 看见它学到了什么、按类型/作用域筛出来、把学错的删掉。
 *
 * 刻意不提供“手写一条”：偏好是从对话里流露出来的，让人专门去写既反人性，
 * 也会拿到失真的内容（见 docs/plans/2026-10-23-agent-user-memory-design.md §12）。
 */

const KIND_META = {
  preference: { label: '偏好', color: '#1B5DFB' },
  convention: { label: '约定', color: '#13C2C2' },
  fact: { label: '事实', color: '#52C41A' },
  habit: { label: '习惯', color: '#722ED1' },
  case: { label: '案例', color: '#FA8C16' },
  episode: { label: '工作记录', color: '#8C8C8C' },
  procedure: { label: '操作口诀', color: '#EB2F96' }
};

const KIND_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'preference', label: '偏好' },
  { value: 'habit', label: '习惯' },
  { value: 'case', label: '案例' },
  { value: 'episode', label: '工作记录' }
];

const SCOPE_OPTIONS = [
  { value: 'user', label: '个人' },
  { value: 'app', label: '应用' },
  { value: 'component', label: '组件' }
];

/** 单次拉取上限：记忆有硬配额（习惯 120 + 案例 80），一次取全量即可做本地筛选。 */
const MAX_ITEMS = 100; // 后端 MAX_PAGE_SIZE=100

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
    kind: 'all',
    scope: 'all',
    keyword: ''
  };

  componentDidMount() {
    if (this.props.visible) this.load();
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) this.load();
  }

  load = () => {
    this.setState({ loading: true, error: '' });
    Promise.all([
      listAgentMemories({ limit: MAX_ITEMS }),
      getAgentMemoryStatus()
    ])
      .then(([listPayload, status]) => {
        this.setState({
          items: (listPayload && listPayload.items) || [],
          loaded: true,
          ready: !status || status.ready !== false,
          storage: (status && status.storage) || '',
          enabled: !status || status.enabled !== false,
          learnEnabled: !status || status.learnEnabled !== false
        });
      })
      .catch(error => {
        this.setState({
          error: (error && error.message) || '加载记忆失败'
        });
      })
      .finally(() => this.setState({ loading: false }));
  };

  handleRemove = memoryId => {
    deleteAgentMemory(memoryId)
      .then(() => {
        this.setState(state => ({
          items: state.items.filter(item => item.id !== memoryId)
        }));
        message.success('已删除，本轮之后不会再带上它');
      })
      .catch(error => {
        message.error((error && error.message) || '删除失败');
      });
  };

  handleFeedback = (memoryId, signal) => {
    submitAgentMemoryFeedback(memoryId, signal)
      .then(() => {
        if (signal === 'wrong') {
          this.setState(state => ({
            items: state.items.filter(item => item.id !== memoryId)
          }));
          message.success('已删除，这条记忆不会再出现');
          return;
        }
        message.success(signal === 'useful' ? '已标记为有用' : '已标记为噪声');
      })
      .catch(error => {
        message.error((error && error.message) || '反馈失败');
      });
  };

  filteredItems() {
    const { items, kind, scope, keyword } = this.state;
    const text = keyword.trim().toLowerCase();
    return items.filter(item => {
      if (kind !== 'all' && item.kind !== kind) return false;
      if (scope !== 'all' && (item.scope || 'user') !== scope) return false;
      if (!text) return true;
      const haystack = `${item.summary || ''} ${item.content ||
        ''}`.toLowerCase();
      return haystack.indexOf(text) >= 0;
    });
  }

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
          description="请管理员确认迁移 034 是否已执行，或数据库账号是否可写。"
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

  renderToolbar() {
    const { kind, scope, keyword, loading } = this.state;
    return (
      <div className={styles.memoryToolbar}>
        <Radio.Group
          size="small"
          value={kind}
          onChange={event => this.setState({ kind: event.target.value })}
          optionType="button"
          buttonStyle="solid"
        >
          {KIND_FILTERS.map(option => (
            <Radio.Button key={option.value} value={option.value}>
              {option.label}
            </Radio.Button>
          ))}
        </Radio.Group>
        <Select
          size="small"
          className={styles.memoryScopeSelect}
          value={scope}
          onChange={value => this.setState({ scope: value || 'all' })}
          allowClear
          placeholder="全部作用域"
        >
          {SCOPE_OPTIONS.map(option => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
        <Input.Search
          size="small"
          className={styles.memorySearch}
          placeholder="搜索记忆内容"
          allowClear
          value={keyword}
          onChange={event => this.setState({ keyword: event.target.value })}
        />
        <Button
          size="small"
          icon="reload"
          loading={loading}
          onClick={this.load}
          className={styles.memoryRefresh}
        >
          刷新
        </Button>
      </div>
    );
  }

  renderItem(item) {
    const meta = kindMeta(item.kind);
    const scope = item.scope || 'user';
    const scopeLabel = (
      SCOPE_OPTIONS.find(option => option.value === scope) || {}
    ).label;
    const text = item.summary || item.content || '';
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
              <Tag className={styles.memoryScopeTag}>{scopeLabel}</Tag>
            ) : null}
            {item.pinned ? (
              <Tooltip title="置顶：每轮都会带上">
                <Icon type="star" theme="filled" className={styles.memoryPin} />
              </Tooltip>
            ) : null}
            <span className={styles.memoryTime}>
              {formatDateTime(item.updatedAt)}
            </span>
            {item.hitCount ? (
              <span className={styles.memoryHit}>
                被用到 {item.hitCount} 次
              </span>
            ) : null}
          </div>
          <div className={styles.memoryItemText} title={item.content}>
            {text}
          </div>
        </div>
        <div className={styles.memoryItemActions}>
          <Dropdown
            placement="bottomRight"
            trigger={['click']}
            overlay={
              <Menu
                onClick={({ key }) => this.handleFeedback(item.id, key)}
                selectedKeys={[]}
              >
                <Menu.Item key="useful">有用</Menu.Item>
                <Menu.Item key="noise">噪声</Menu.Item>
                <Menu.Item key="wrong">记错了</Menu.Item>
              </Menu>
            }
          >
            <a className={styles.memoryFeedback}>反馈</a>
          </Dropdown>
          <Popconfirm
            placement="left"
            title="删掉这条记忆？"
            okText="删除"
            cancelText="取消"
            okType="danger"
            onConfirm={() => this.handleRemove(item.id)}
          >
            <a className={styles.memoryDelete}>删除</a>
          </Popconfirm>
        </div>
      </div>
    );
  }

  render() {
    const { visible, onClose } = this.props;
    const { loading, loaded, error, keyword } = this.state;
    const items = this.filteredItems();

    return (
      <Modal
        visible={visible}
        onCancel={onClose}
        footer={null}
        width={760}
        centered
        // Chat panel 的 z-index 是 1080/1200，弹窗必须压在它上面。
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
            这些记忆从你的对话里自动沉淀，用来还原你的表达习惯与排查经验；
            它们只影响措辞和线索，不会改变工具选择、检查顺序或审批行为。
            记错了可以直接删掉。
          </div>

          {this.renderAlert()}

          {this.renderToolbar()}

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
                description={
                  keyword ? '没有匹配的记忆' : '还没有学到记忆，正常对话即可'
                }
              />
            ) : null}
            {items.map(item => this.renderItem(item))}
          </div>

          <div className={styles.memoryFooter}>
            <span className={styles.memoryCount}>
              共 {items.length} 条
              {items.length !== this.state.items.length
                ? `（已筛选，总计 ${this.state.items.length} 条）`
                : ''}
            </span>
            <div>
              <Button
                size="small"
                onClick={onClose}
                className={styles.memoryClose}
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
