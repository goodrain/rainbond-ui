import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage } from '@/utils/intl';
import CodeMirrorForm from '@/components/CodeMirrorForm';
import {
  Tabs,
  Table,
  Button,
  Modal,
  Input,
  Tag,
  Popconfirm,
  Card,
  Select,
  Icon,
  Spin,
  Empty,
  Alert
} from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import jsYaml from 'js-yaml';
import styles from './index.less';

const theme = require('../../../config/theme');

const { TabPane } = Tabs;
const { Option } = Select;

const t = (id, defaultMessage, values) => formatMessage({ id, defaultMessage }, values);

const COMMON_RESOURCE_KINDS = [
  'Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob',
  'Service', 'Ingress', 'ConfigMap', 'Secret',
  'ServiceAccount', 'Role', 'ClusterRole', 'RoleBinding', 'ClusterRoleBinding',
  'HorizontalPodAutoscaler', 'PodDisruptionBudget', 'NetworkPolicy',
  'CustomResourceDefinition',
];

const getStorageSectionMeta = () => ({
  storageclass: {
    icon: 'database',
    title: t('platformResources.section.storageclass.title', '存储类'),
    description: t('platformResources.section.storageclass.description', '集中维护集群可用的 StorageClass，统一梳理默认能力、绑定模式和回收策略。'),
  },
  pv: {
    icon: 'hdd',
    title: t('platformResources.section.pv.title', '存储卷'),
    description: t('platformResources.section.pv.description', '查看 PersistentVolume 的容量、状态和绑定关系，快速定位存储生命周期问题。'),
  },
  storageconfig: {
    icon: 'setting',
    title: t('platformResources.section.config.title', '存储配置'),
    description: t('platformResources.section.config.description', '控制应用市场安装应用时使用的默认存储类，保持平台安装体验一致。'),
  },
});

const getStatusMap = () => ({
  running: { color: theme['rbd-success-status'], text: t('platformResources.status.running', '运行中') },
  available: { color: theme['rbd-success-status'], text: t('platformResources.status.available', '可用') },
  bound: { color: theme['primary-color'], text: t('platformResources.status.bound', '已绑定') },
  released: { color: theme['rbd-warning-status'], text: t('platformResources.status.released', '已释放') },
  failed: { color: theme['rbd-error-status'], text: t('platformResources.status.failed', '失败') },
  warning: { color: theme['rbd-warning-status'], text: t('platformResources.status.warning', '警告') },
});

const STORAGE_RESOURCE_TYPES = {
  storageclass: {
    group: 'storage.k8s.io',
    version: 'v1',
    resource: 'storageclasses',
    label: 'storageclass',
  },
  pv: {
    group: '',
    version: 'v1',
    resource: 'persistentvolumes',
    label: 'pv',
  },
};

function sortResourceTypes(list) {
  const priority = {};
  COMMON_RESOURCE_KINDS.forEach((kind, index) => {
    priority[kind] = index;
  });
  return [...list].sort((a, b) => {
    const aPriority = priority[a.kind] !== undefined ? priority[a.kind] : COMMON_RESOURCE_KINDS.length;
    const bPriority = priority[b.kind] !== undefined ? priority[b.kind] : COMMON_RESOURCE_KINDS.length;
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    return (a.kind || '').localeCompare(b.kind || '');
  });
}

function formatCreationTime(ts) {
  if (!ts) return '-';
  try {
    const date = new Date(ts);
    return date.toLocaleString('zh-CN', { hour12: false });
  } catch (e) {
    return ts;
  }
}

function getTypeKey(type) {
  return `${type.group || 'core'}/${type.version}/${type.resource}`;
}

function getTypeApiVersion(type) {
  if (!type) {
    return '-';
  }
  return type.group ? `${type.group}/${type.version}` : type.version;
}

function hasVerb(type, verb) {
  return Array.isArray(type && type.verbs) && type.verbs.includes(verb);
}

function serializeYaml(bean) {
  try {
    return jsYaml.dump(bean, { noRefs: true, lineWidth: 120 });
  } catch (e) {
    return JSON.stringify(bean, null, 2);
  }
}

const StatusDot = ({ status }) => {
  const statusMap = getStatusMap();
  const current = statusMap[(status || '').toLowerCase()] || { color: theme['rbd-label-color'], text: status || '-' };
  return (
    <span className={styles.statusDot}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: current.color,
          marginRight: 6,
        }}
      />
      <span style={{ color: current.color }}>{current.text}</span>
    </span>
  );
};

@connect(({ platformResources }) => ({
  storageClasses: platformResources.storageClasses,
  persistentVolumes: platformResources.persistentVolumes,
  platformResources: platformResources.platformResources,
  resourceInstances: platformResources.resourceInstances,
  storageConfig: platformResources.storageConfig,
}))
class PlatformResources extends PureComponent {
  state = {
    createModalVisible: false,
    yamlContent: '',
    configEditing: false,
    selectedStorageClass: null,
    mainTab: 'storage',
    storageSubTab: 'storageclass',
    pvCreateVisible: false,
    pvCreateYaml: '',
    storageResourceModal: {
      visible: false,
      mode: 'view',
      name: '',
      title: '',
      content: '',
      saving: false,
      resourceParams: null,
    },
    selectedType: null,
    instancesLoading: false,
    typeSearchText: '',
    instanceSearchText: '',
    instanceModal: {
      visible: false,
      mode: 'view',
      name: '',
      content: '',
      saving: false,
    },
  };

  componentDidMount() {
    this.fetchStorageClasses();
    this.fetchPersistentVolumes();
    this.fetchStorageConfig();
    this.fetchPlatformResources();
  }

  componentDidUpdate(prevProps, prevState) {
    const resourcesChanged = prevProps.platformResources !== this.props.platformResources;
    const switchedToOther = prevState.mainTab !== this.state.mainTab && this.state.mainTab === 'other';

    if (resourcesChanged || switchedToOther) {
      this.ensureSelectedResourceType();
    }
  }

  getParams() {
    const { match } = this.props;
    return (match && match.params) || {};
  }

  fetchStorageClasses = () => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    dispatch({ type: 'platformResources/fetchStorageClasses', payload: { eid, region: regionName } });
  };

  fetchPersistentVolumes = () => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    dispatch({ type: 'platformResources/fetchPersistentVolumes', payload: { eid, region: regionName } });
  };

  fetchStorageConfig = () => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    dispatch({ type: 'platformResources/fetchStorageConfig', payload: { eid, region: regionName } });
  };

  fetchPlatformResources = () => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    dispatch({ type: 'platformResources/fetchPlatformResources', payload: { eid, region: regionName } });
  };

  getFirstSelectableResourceType = (resources = this.props.platformResources) => {
    const list = Array.isArray(resources) ? sortResourceTypes(resources) : [];
    return list.find(type => hasVerb(type, 'list')) || null;
  };

  getCurrentSelectedType = () => {
    const { selectedType } = this.state;
    return selectedType || this.getFirstSelectableResourceType();
  };

  ensureSelectedResourceType = () => {
    const { mainTab, selectedType } = this.state;
    const { dispatch, platformResources } = this.props;

    if (mainTab !== 'other') {
      return;
    }

    const currentResources = Array.isArray(platformResources) ? platformResources : [];
    const firstSelectableType = this.getFirstSelectableResourceType(currentResources);

    if (!firstSelectableType) {
      if (selectedType) {
        this.setState({ selectedType: null, instanceSearchText: '' });
        dispatch({ type: 'platformResources/save', payload: { resourceInstances: [] } });
      }
      return;
    }

    const currentValid = selectedType && currentResources.some(type => (
      hasVerb(type, 'list') && getTypeKey(type) === getTypeKey(selectedType)
    ));

    if (!currentValid) {
      this.setState({ selectedType: firstSelectableType, instanceSearchText: '' });
      this.fetchInstancesForType(firstSelectableType);
    }
  };

  fetchInstancesForType = (type) => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    this.setState({ instancesLoading: true });
    dispatch({
      type: 'platformResources/fetchResourceInstances',
      payload: {
        eid,
        region: regionName,
        group: type.group,
        version: type.version,
        resource: type.resource,
      },
      callback: () => this.setState({ instancesLoading: false }),
    });
  };

  handleMainTabChange = (key) => {
    this.setState({ mainTab: key });
    if (key === 'other') {
      this.fetchPlatformResources();
    }
  };

  handleStorageSubTabChange = (key) => {
    this.setState({ storageSubTab: key });
    if (key === 'storageclass') {
      this.fetchStorageClasses();
    }
    if (key === 'pv') {
      this.fetchPersistentVolumes();
    }
    if (key === 'storageconfig') {
      this.fetchStorageClasses();
      this.fetchStorageConfig();
    }
  };

  handleDeleteStorageClass = (name) => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    dispatch({
      type: 'platformResources/deleteStorageClass',
      payload: { eid, region: regionName, name },
      callback: () => this.fetchStorageClasses(),
    });
  };

  handleCreateConfirm = () => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    const { yamlContent } = this.state;
    dispatch({
      type: 'platformResources/createStorageClass',
      payload: { eid, region: regionName, yaml: yamlContent },
      callback: () => {
        this.setState({ createModalVisible: false, yamlContent: '' });
        this.fetchStorageClasses();
      },
    });
  };

  handleSaveStorageConfig = () => {
    const { dispatch, storageConfig } = this.props;
    const { eid, regionName } = this.getParams();
    const { selectedStorageClass } = this.state;
    const storageClassName = selectedStorageClass || (storageConfig && storageConfig.default_storage_class);
    dispatch({
      type: 'platformResources/saveStorageConfig',
      payload: { eid, region: regionName, defaultStorageClass: storageClassName },
      callback: () => {
        this.setState({ configEditing: false, selectedStorageClass: null });
        this.fetchStorageConfig();
      },
    });
  };

  getStorageResourceParams = (key) => STORAGE_RESOURCE_TYPES[key];

  closeStorageResourceModal = () => {
    this.setState({
      storageResourceModal: {
        visible: false,
        mode: 'view',
        name: '',
        title: '',
        content: '',
        saving: false,
        resourceParams: null,
      },
    });
  };

  handleOpenStorageResourceYaml = (record, key, mode = 'view') => {
    const resourceParams = this.getStorageResourceParams(key);
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    if (!resourceParams) {
      return;
    }
    dispatch({
      type: 'platformResources/fetchResourceInstance',
      payload: {
        eid,
        region: regionName,
        group: resourceParams.group,
        version: resourceParams.version,
        resource: resourceParams.resource,
        name: record.name,
      },
      callback: (bean) => {
        if (bean) {
          this.setState({
            storageResourceModal: {
              visible: true,
              mode,
              name: record.name,
              title: resourceParams.label,
              content: serializeYaml(bean),
              saving: false,
              resourceParams,
            },
          });
        }
      },
    });
  };

  handleSaveStorageResourceYaml = () => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    const { storageResourceModal } = this.state;
    const { resourceParams } = storageResourceModal;
    if (!resourceParams) {
      return;
    }
    this.setState({
      storageResourceModal: {
        ...storageResourceModal,
        saving: true,
      },
    });
    dispatch({
      type: 'platformResources/updateResourceInstance',
      payload: {
        eid,
        region: regionName,
        group: resourceParams.group,
        version: resourceParams.version,
        resource: resourceParams.resource,
        name: storageResourceModal.name,
        yaml: storageResourceModal.content,
      },
      callback: (res, err) => {
        if (!err) {
          this.closeStorageResourceModal();
          if (resourceParams.resource === STORAGE_RESOURCE_TYPES.storageclass.resource) {
            this.fetchStorageClasses();
            this.fetchStorageConfig();
          }
          if (resourceParams.resource === STORAGE_RESOURCE_TYPES.pv.resource) {
            this.fetchPersistentVolumes();
          }
        } else {
          this.setState({
            storageResourceModal: {
              ...storageResourceModal,
              saving: false,
            },
          });
        }
      },
    });
  };

  handleDeletePV = (name) => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    dispatch({
      type: 'platformResources/deletePersistentVolume',
      payload: { eid, region: regionName, name },
      callback: () => this.fetchPersistentVolumes(),
    });
  };

  handleCreatePVConfirm = () => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    const { pvCreateYaml } = this.state;
    dispatch({
      type: 'platformResources/createPersistentVolume',
      payload: { eid, region: regionName, yaml: pvCreateYaml },
      callback: (res, err) => {
        if (!err) {
          this.setState({ pvCreateVisible: false, pvCreateYaml: '' });
          this.fetchPersistentVolumes();
        }
      },
    });
  };

  handleSelectType = (type) => {
    const { selectedType } = this.state;
    const isSameType = selectedType && getTypeKey(selectedType) === getTypeKey(type);
    if (isSameType) {
      return;
    }

    this.setState({ selectedType: type, instanceSearchText: '' });
    this.fetchInstancesForType(type);
  };

  handleViewInstanceYaml = (record) => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    const selectedType = this.getCurrentSelectedType();
    if (!selectedType) {
      return;
    }
    dispatch({
      type: 'platformResources/fetchResourceInstance',
      payload: {
        eid,
        region: regionName,
        group: selectedType.group,
        version: selectedType.version,
        resource: selectedType.resource,
        name: record.metadata.name,
      },
      callback: (bean) => {
        if (bean) {
          this.setState({
            instanceModal: {
              visible: true,
              mode: 'view',
              name: record.metadata.name,
              content: serializeYaml(bean),
              saving: false,
            },
          });
        }
      },
    });
  };

  handleEditInstanceYaml = (record) => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    const selectedType = this.getCurrentSelectedType();
    if (!selectedType) {
      return;
    }
    dispatch({
      type: 'platformResources/fetchResourceInstance',
      payload: {
        eid,
        region: regionName,
        group: selectedType.group,
        version: selectedType.version,
        resource: selectedType.resource,
        name: record.metadata.name,
      },
      callback: (bean) => {
        if (bean) {
          this.setState({
            instanceModal: {
              visible: true,
              mode: 'edit',
              name: record.metadata.name,
              content: serializeYaml(bean),
              saving: false,
            },
          });
        }
      },
    });
  };

  handleSaveInstanceYaml = () => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    const { instanceModal } = this.state;
    const selectedType = this.getCurrentSelectedType();
    if (!selectedType) {
      return;
    }
    this.setState({ instanceModal: { ...instanceModal, saving: true } });
    dispatch({
      type: 'platformResources/updateResourceInstance',
      payload: {
        eid,
        region: regionName,
        group: selectedType.group,
        version: selectedType.version,
        resource: selectedType.resource,
        name: instanceModal.name,
        yaml: instanceModal.content,
      },
      callback: (res, err) => {
        if (!err) {
          this.setState({
            instanceModal: {
              visible: false,
              mode: 'view',
              name: '',
              content: '',
              saving: false,
            },
          });
          this.fetchInstancesForType(selectedType);
        } else {
          this.setState({ instanceModal: { ...instanceModal, saving: false } });
        }
      },
    });
  };

  handleOpenCreateInstance = () => {
    const selectedType = this.getCurrentSelectedType();
    if (!selectedType) {
      return;
    }
    const apiVersion = getTypeApiVersion(selectedType);
    this.setState({
      instanceModal: {
        visible: true,
        mode: 'create',
        name: '',
        saving: false,
        content: `apiVersion: ${apiVersion}\nkind: ${selectedType.kind}\nmetadata:\n  name: ""\n`,
      },
    });
  };

  handleCreateInstanceConfirm = () => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    const { instanceModal } = this.state;
    const selectedType = this.getCurrentSelectedType();
    if (!selectedType) {
      return;
    }
    this.setState({ instanceModal: { ...instanceModal, saving: true } });
    dispatch({
      type: 'platformResources/createResourceInstance',
      payload: {
        eid,
        region: regionName,
        group: selectedType.group,
        version: selectedType.version,
        resource: selectedType.resource,
        yaml: instanceModal.content,
      },
      callback: (res, err) => {
        if (!err) {
          this.setState({
            instanceModal: {
              visible: false,
              mode: 'view',
              name: '',
              content: '',
              saving: false,
            },
          });
          this.fetchInstancesForType(selectedType);
        } else {
          this.setState({ instanceModal: { ...instanceModal, saving: false } });
        }
      },
    });
  };

  handleDeleteInstance = (record) => {
    const { dispatch } = this.props;
    const { eid, regionName } = this.getParams();
    const selectedType = this.getCurrentSelectedType();
    if (!selectedType) {
      return;
    }
    dispatch({
      type: 'platformResources/deletePlatformResource',
      payload: {
        eid,
        region: regionName,
        group: selectedType.group,
        version: selectedType.version,
        resource: selectedType.resource,
        name: record.metadata.name,
      },
      callback: () => this.fetchInstancesForType(selectedType),
    });
  };

  renderSectionIntro = (meta, action) => {
    return (
      <div className={styles.sectionIntro}>
        <div className={styles.sectionIntroMain}>
          <div>
            <p className={styles.sectionDescription}>{meta.description}</p>
          </div>
        </div>
        {action && <div className={styles.sectionIntroAction}>{action}</div>}
      </div>
    );
  };

  renderPageHeader() {
    const { storageClasses, persistentVolumes, platformResources, storageConfig } = this.props;
    const { mainTab } = this.state;

    const stats = [
      {
        label: t('platformResources.section.storageclass.title', '存储类'),
        value: storageClasses.length,
        hint: 'StorageClass',
      },
      {
        label: t('platformResources.section.pv.title', '存储卷'),
        value: persistentVolumes.length,
        hint: 'PersistentVolume',
      },
      {
        label: t('platformResources.common.resourceCatalog', '资源目录'),
        value: platformResources.length,
        hint: t('platformResources.common.browsableKinds', '可浏览的全局 Kind'),
      },
      {
        label: t('platformResources.common.defaultStorageClass', '默认 StorageClass'),
        value: storageConfig && storageConfig.default_storage_class ? storageConfig.default_storage_class : t('platformResources.common.unconfigured', '未配置'),
        hint: 'StorageClass',
      },
    ];

    return (
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderTopCompact}>
          <div className={`${styles.pageStats} ${styles.pageStatsFull}`}>
            {stats.map(item => (
              <div key={item.label} className={styles.statCard}>
                <div className={styles.statLabel}>{item.label}</div>
                <div className={styles.statValue}>{item.value}</div>
                <div className={styles.statHint}>{item.hint}</div>
              </div>
            ))}
          </div>
        </div>
        <Tabs
          activeKey={mainTab}
          onChange={this.handleMainTabChange}
          type="card"
          className={styles.tabBarStyle}
        >
          <TabPane key="storage" tab={t('platformResources.tab.storage', '全局存储')} />
          <TabPane key="other" tab={t('platformResources.tab.other', '其他资源')} />
        </Tabs>
      </div>
    );
  }

  renderStorageClassTab() {
    const { storageClasses } = this.props;
    const sectionMeta = getStorageSectionMeta();
    const columns = [
      {
        title: t('platformResources.common.name', '名称'),
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <span>
            <a
              className={styles.linkPrimary}
              onClick={e => {
                e.preventDefault();
                this.handleOpenStorageResourceYaml(record, 'storageclass', 'view');
              }}
            >
              {text}
            </a>
            {record.is_default && <Tag className={styles.smallTag} style={{ marginLeft: 8 }}>{t('platformResources.common.default', '默认')}</Tag>}
          </span>
        ),
      },
      {
        title: 'Provisioner',
        dataIndex: 'provisioner',
        key: 'provisioner',
        render: value => <span className={styles.codeText}>{value || '-'}</span>,
      },
      {
        title: t('platformResources.common.reclaimPolicy', '回收策略'),
        dataIndex: 'reclaim_policy',
        key: 'reclaim_policy',
        render: value => <Tag>{value || '-'}</Tag>,
      },
      {
        title: t('platformResources.common.bindingMode', '绑定模式'),
        dataIndex: 'volume_binding_mode',
        key: 'volume_binding_mode',
        render: value => value || '-',
      },
      {
        title: 'PV Count',
        dataIndex: 'pv_count',
        key: 'pv_count',
        align: 'center',
        width: 120,
      },
      {
        title: t('platformResources.common.operation', '操作'),
        key: 'action',
        width: 136,
        render: (_, record) => (
          <span>
            <a
              className={styles.linkSecondary}
              style={{ marginRight: 12 }}
              onClick={e => {
                e.preventDefault();
                this.handleOpenStorageResourceYaml(record, 'storageclass', 'edit');
              }}
            >
              {t('platformResources.common.edit', '编辑')}
            </a>
            <Popconfirm title={t('resourceCenter.common.confirmDelete', '确认删除 "{name}"？', { name: record.name })} onConfirm={() => this.handleDeleteStorageClass(record.name)}>
              <a className={styles.linkDanger}>{t('platformResources.common.delete', '删除')}</a>
            </Popconfirm>
          </span>
        ),
      },
    ];

    return (
      <div className={styles.tabPanel}>
        {this.renderSectionIntro(
          sectionMeta.storageclass,
          <Button type="primary" icon="plus" onClick={() => this.setState({ createModalVisible: true })}>
            {t('platformResources.common.createStorageClass', '创建存储类')}
          </Button>
        )}
        <div className={styles.tableShell}>
          <Table
            dataSource={storageClasses}
            columns={columns}
            rowKey="name"
            size="middle"
            pagination={storageClasses.length > 10 ? { pageSize: 10, size: 'small' } : false}
            locale={{ emptyText: <div className={styles.emptyTableText}>{t('platformResources.common.noStorageClass', '暂无存储类')}</div> }}
          />
        </div>
      </div>
    );
  }

  renderPVTab() {
    const { persistentVolumes } = this.props;
    const { pvCreateVisible, pvCreateYaml } = this.state;
    const sectionMeta = getStorageSectionMeta();

    const columns = [
      {
        title: t('platformResources.common.name', '名称'),
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <a
            className={styles.linkPrimary}
            onClick={e => {
              e.preventDefault();
              this.handleOpenStorageResourceYaml(record, 'pv', 'view');
            }}
          >
            {text}
          </a>
        ),
      },
      {
        title: t('platformResources.common.capacity', '容量'),
        dataIndex: 'capacity',
        key: 'capacity',
        render: value => <Tag color="geekblue">{value || '-'}</Tag>,
      },
      {
        title: t('platformResources.common.accessModes', '访问模式'),
        dataIndex: 'access_modes',
        key: 'access_modes',
        render: modes => {
          const list = Array.isArray(modes) ? modes : [modes].filter(Boolean);
          return list.map(mode => (
            <Tag key={mode} className={styles.smallTag}>
              {mode}
            </Tag>
          ));
        },
      },
      {
        title: t('platformResources.common.storageClass', '存储类'),
        dataIndex: 'storage_class',
        key: 'storage_class',
        render: value => (value ? <span className={styles.codeText}>{value}</span> : <span className={styles.mutedText}>-</span>),
      },
      {
        title: t('platformResources.common.status', '状态'),
        dataIndex: 'status',
        key: 'status',
        render: value => <StatusDot status={value} />,
      },
      {
        title: t('platformResources.common.reclaimPolicy', '回收策略'),
        dataIndex: 'reclaim_policy',
        key: 'reclaim_policy',
        render: value => value || '-',
      },
      {
        title: t('platformResources.common.claim', '绑定到'),
        dataIndex: 'claim',
        key: 'claim',
        render: value => value || <span className={styles.mutedText}>-</span>,
      },
      {
        title: t('platformResources.common.operation', '操作'),
        key: 'action',
        width: 136,
        render: (_, record) => (
          <span>
            <a
              className={styles.linkSecondary}
              style={{ marginRight: 12 }}
              onClick={e => {
                e.preventDefault();
                this.handleOpenStorageResourceYaml(record, 'pv', 'edit');
              }}
            >
              {t('platformResources.common.edit', '编辑')}
            </a>
            <Popconfirm title={t('resourceCenter.common.confirmDelete', '确认删除 "{name}"？', { name: record.name })} onConfirm={() => this.handleDeletePV(record.name)}>
              <a className={styles.linkDanger}>{t('platformResources.common.delete', '删除')}</a>
            </Popconfirm>
          </span>
        ),
      },
    ];

    return (
      <div className={styles.tabPanel}>
        {this.renderSectionIntro(
          sectionMeta.pv,
          <Button
            type="primary"
            icon="plus"
            onClick={() => this.setState({ pvCreateVisible: true, pvCreateYaml: '' })}
          >
            {t('platformResources.common.createPv', '创建存储卷')}
          </Button>
        )}
        <div className={styles.tableShell}>
          <Table
            dataSource={persistentVolumes}
            columns={columns}
            rowKey="name"
            size="middle"
            pagination={persistentVolumes.length > 10 ? { pageSize: 10, size: 'small' } : false}
            locale={{ emptyText: <div className={styles.emptyTableText}>{t('platformResources.common.noPv', '暂无存储卷')}</div> }}
          />
        </div>

        <Modal
          title={<span><Icon type="plus" className={styles.modalTitleIcon} />{t('platformResources.modal.createPv', 'YAML 创建存储卷')}</span>}
          visible={pvCreateVisible}
          onOk={this.handleCreatePVConfirm}
          onCancel={() => this.setState({ pvCreateVisible: false, pvCreateYaml: '' })}
          width={680}
          okText={t('platformResources.common.create', '创建')}
          cancelText={t('platformResources.common.cancel', '取消')}
        >
          <p className={styles.modalLead}>{t('platformResources.modal.lead.pv', '粘贴 PersistentVolume 的 YAML 定义内容。')}</p>
          <CodeMirrorForm
            mode="yaml"
            value={pvCreateYaml}
            onChange={value => this.setState({ pvCreateYaml: value })}
            isHeader={false}
            isUpload={false}
            isAmplifications={false}
            editorHeight={320}
            style={{ marginBottom: 0 }}
          />
        </Modal>
      </div>
    );
  }

  renderStorageConfigTab() {
    const { storageClasses, storageConfig } = this.props;
    const { configEditing, selectedStorageClass } = this.state;
    const currentStorageClass = storageConfig && storageConfig.default_storage_class;
    const currentStorageInfo = storageClasses.find(sc => sc.name === currentStorageClass);
    const sectionMeta = getStorageSectionMeta();

    return (
      <div className={styles.tabPanel}>
        {this.renderSectionIntro(sectionMeta.storageconfig)}
        <div className={styles.configLayout}>
          <Card
            bordered={false}
            className={styles.configCard}
            title={<span><Icon type="database" className={styles.primaryIcon} />{t('platformResources.common.platformDefaultStorage', '应用市场默认存储配置')}</span>}
            extra={
              configEditing ? (
                <span>
                  <Button type="primary" size="small" onClick={this.handleSaveStorageConfig} style={{ marginRight: 8 }}>
                    {t('platformResources.common.save', '保存')}
                  </Button>
                  <Button size="small" onClick={() => this.setState({ configEditing: false, selectedStorageClass: null })}>
                    {t('platformResources.common.cancel', '取消')}
                  </Button>
                </span>
              ) : (
                <Button
                  size="small"
                  icon="edit"
                  onClick={() => this.setState({ configEditing: true, selectedStorageClass: currentStorageClass })}
                >
                  {t('platformResources.common.modify', '修改')}
                </Button>
              )
            }
          >
            <p className={styles.configLead}>
              {t('platformResources.common.configLead', '配置从应用市场安装应用时默认使用的 StorageClass，安装后仍可在应用层级按需单独调整。')}
            </p>
            <div style={{ marginBottom: 20 }}>
              <div className={styles.infoItemLabel}>{t('platformResources.common.defaultStorageClass', '默认 StorageClass')}</div>
              {configEditing ? (
                <Select
                  style={{ width: '100%' }}
                  value={selectedStorageClass}
                  onChange={value => this.setState({ selectedStorageClass: value })}
                  placeholder={t('platformResources.section.storageclass.title', '存储类')}
                >
                  {storageClasses.map(sc => (
                    <Option key={sc.name} value={sc.name}>
                      <Icon type="database" className={styles.primaryMiniIcon} />
                      {sc.name}
                      {sc.is_default && <Tag className={styles.smallTag} style={{ marginLeft: 8 }}>{t('platformResources.common.default', '默认')}</Tag>}
                      <span className={styles.mutedInline} style={{ marginLeft: 8 }}>({sc.provisioner})</span>
                    </Option>
                  ))}
                </Select>
              ) : (
                <div className={styles.valueBox}>
                  <Icon type="database" className={styles.primaryIconOnly} />
                  <span className={styles.valueStrong}>
                    {currentStorageClass || <span className={styles.mutedText}>{t('platformResources.common.unconfigured', '未配置')}</span>}
                  </span>
                  {currentStorageInfo && <span className={styles.mutedInline}>({currentStorageInfo.provisioner})</span>}
                </div>
              )}
            </div>

            {currentStorageInfo && (
              <div className={styles.infoGrid}>
                {[
                  ['StorageClass', currentStorageInfo.name],
                  ['Provisioner', currentStorageInfo.provisioner],
                  [t('platformResources.common.reclaimPolicy', '回收策略'), currentStorageInfo.reclaim_policy || '-'],
                  [t('platformResources.common.clusterDefault', '集群默认'), currentStorageInfo.is_default ? t('platformResources.common.yes', '是') : t('platformResources.common.no', '否')],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className={styles.infoItemLabel}>{label}</div>
                    <div className={styles.infoItemValue}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className={styles.noticeBanner}>
            <Alert
              message={t('platformResources.common.noticeTitle', '注意事项')}
              description={t('platformResources.common.noticeDesc', '此配置仅影响从应用市场新安装的应用，已安装应用不会被回写修改。如需调整现有应用的存储，请前往应用级配置页面处理。')}
              type="warning"
              showIcon
            />
          </div>
        </div>
      </div>
    );
  }

  renderOtherResourcesTab() {
    const { platformResources, resourceInstances } = this.props;
    const {
      selectedType,
      instancesLoading,
      typeSearchText,
      instanceSearchText,
      instanceModal,
    } = this.state;

    const filteredTypes = sortResourceTypes(
      typeSearchText
        ? platformResources.filter(resource => (
          (resource.kind || '').toLowerCase().includes(typeSearchText.toLowerCase()) ||
          (resource.resource || '').toLowerCase().includes(typeSearchText.toLowerCase()) ||
          (resource.group || '').toLowerCase().includes(typeSearchText.toLowerCase())
        ))
        : platformResources
    );

    const currentType = selectedType || this.getFirstSelectableResourceType(platformResources);
    const canCreate = hasVerb(currentType, 'create');
    const canUpdate = hasVerb(currentType, 'update') || hasVerb(currentType, 'patch');
    const canDelete = hasVerb(currentType, 'delete');
    const items = Array.isArray(resourceInstances) ? resourceInstances : [];
    const filteredInstances = instanceSearchText
      ? items.filter(resource => ((resource.metadata && resource.metadata.name) || '').toLowerCase().includes(instanceSearchText.toLowerCase()))
      : items;

    const instanceColumns = [
      {
        title: t('platformResources.common.name', '名称'),
        key: 'name',
        render: (_, record) => (
          <a
            className={styles.linkPrimary}
            onClick={e => {
              e.preventDefault();
              this.handleViewInstanceYaml(record);
            }}
          >
            {(record.metadata && record.metadata.name) || '-'}
          </a>
        ),
      },
      {
        title: t('platformResources.common.createTime', '创建时间'),
        key: 'createdAt',
        width: 190,
        render: (_, record) => formatCreationTime(record.metadata && record.metadata.creationTimestamp),
      },
      {
        title: t('platformResources.common.operation', '操作'),
        key: 'action',
        width: 128,
        render: (_, record) => (
          <span>
            {canUpdate && (
              <a
                className={styles.linkSecondary}
                style={{ marginRight: 12 }}
                onClick={e => {
                  e.preventDefault();
                  this.handleEditInstanceYaml(record);
                }}
              >
                {t('platformResources.common.edit', '编辑')}
              </a>
            )}
            {canDelete && (
              <Popconfirm
                title={t('resourceCenter.common.confirmDelete', '确认删除 "{name}"？', { name: record.metadata && record.metadata.name })}
                onConfirm={() => this.handleDeleteInstance(record)}
              >
                <a className={styles.linkDanger}>{t('platformResources.common.delete', '删除')}</a>
              </Popconfirm>
            )}
          </span>
        ),
      },
    ];

    const modalTitle = instanceModal.mode === 'create'
      ? t('platformResources.modal.createResource', '创建 {kind}', { kind: currentType ? currentType.kind : '' })
      : instanceModal.mode === 'edit'
        ? t('platformResources.modal.editResource', '编辑 - {name}', { name: instanceModal.name })
        : t('platformResources.modal.viewResource', '查看 YAML - {name}', { name: instanceModal.name });

    const modalFooter = instanceModal.mode === 'view'
      ? [
        <Button key="close" onClick={() => this.setState({ instanceModal: { ...instanceModal, visible: false } })}>
          {t('platformResources.common.close', '关闭')}
        </Button>,
      ]
      : [
        <Button
          key="cancel"
          onClick={() => this.setState({ instanceModal: { ...instanceModal, visible: false, saving: false } })}
        >
          {t('platformResources.common.cancel', '取消')}
        </Button>,
        <Button
          key="ok"
          type="primary"
          loading={instanceModal.saving}
          onClick={instanceModal.mode === 'create' ? this.handleCreateInstanceConfirm : this.handleSaveInstanceYaml}
        >
          {instanceModal.mode === 'create' ? t('platformResources.common.create', '创建') : t('platformResources.common.save', '保存')}
        </Button>,
      ];

    return (
      <div className={styles.resourceWorkbench}>
        <div className={styles.resourceNavigator}>
          <div className={styles.navigatorHeader}>
            <div className={styles.navigatorTitleRow}>
              <div>
                <h2 className={styles.navigatorTitle}>{t('platformResources.common.resourceCatalog', '资源目录')}</h2>
              </div>
              <span className={styles.countBadge}>{platformResources.length}</span>
            </div>
            <Input.Search
              placeholder={t('platformResources.common.searchType', '搜索 Kind、group 或 resource')}
              value={typeSearchText}
              allowClear
              onChange={e => this.setState({ typeSearchText: e.target.value })}
              className={styles.navigatorSearch}
            />
          </div>

          <div className={styles.navigatorBody}>
            {filteredTypes.map(type => {
              const isActive = currentType && getTypeKey(currentType) === getTypeKey(type);
              const canList = hasVerb(type, 'list');
              return (
                <button
                  key={getTypeKey(type)}
                  type="button"
                  disabled={!canList}
                  onClick={() => this.handleSelectType(type)}
                  className={[
                    styles.navigatorItem,
                    isActive ? styles.navigatorItemActive : '',
                    !canList ? styles.navigatorItemDisabled : '',
                  ].join(' ')}
                >
                  <div className={styles.itemTitleRow}>
                    <div className={styles.itemTitleMain}>
                      <span className={styles.itemTitle}>{type.kind || '-'}</span>
                      {!canList && <span className={styles.itemDisabledText}>{t('platformResources.common.notBrowsable', '不可浏览')}</span>}
                    </div>
                  </div>
                  <div className={styles.itemMeta}>
                    {getTypeApiVersion(type)} · {type.resource}
                  </div>
                </button>
              );
            })}

            {filteredTypes.length === 0 && (
              <div className={styles.navigatorEmpty}>
                <Empty description={t('platformResources.common.noMatchedTypes', '没有匹配的资源类型')} />
              </div>
            )}
          </div>
        </div>

        <div className={styles.resourceWorkspace}>
          {currentType && (
            <React.Fragment>
              <div className={styles.resourceHero}>
                <div className={styles.resourceHeroTop}>
                  <div>
                    <div className={styles.resourceHeroEyebrow}>{t('platformResources.common.resourceWorkspace', '资源工作区')}</div>
                    <div className={styles.resourceHeroTitleRow}>
                      <h2 className={styles.resourceHeroTitle}>{currentType.kind}</h2>
                    </div>
                    <div className={styles.metaChips}>
                      <span className={styles.metaChip}>{getTypeApiVersion(currentType)}</span>
                      <span className={styles.metaChip}>{currentType.resource}</span>
                      <span className={styles.metaChip}>{currentType.group || 'core api'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.workspaceToolbar}>
                  <div className={styles.toolbarSummary}>
                    <span>
                      {instanceSearchText
                        ? t('platformResources.common.instancesCount', '{current}/{total} 个实例', { current: filteredInstances.length, total: items.length })
                        : t('platformResources.common.instancesCountOnly', '{total} 个实例', { total: items.length })}
                    </span>
                  </div>
                  <div className={styles.workspaceToolbarActions}>
                    <Input.Search
                      placeholder={t('platformResources.common.searchInstance', '搜索实例名称...')}
                      value={instanceSearchText}
                      allowClear
                      onChange={e => this.setState({ instanceSearchText: e.target.value })}
                      className={styles.workspaceSearch}
                    />
                    {canCreate && (
                      <Button type="primary" icon="plus" onClick={this.handleOpenCreateInstance}>
                        {t('platformResources.common.create', '创建')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.tableShell}>
                <Spin spinning={instancesLoading}>
                  <Table
                    dataSource={filteredInstances}
                    columns={instanceColumns}
                    rowKey={(record, index) => (record.metadata && (record.metadata.uid || record.metadata.name)) || `${currentType.resource}-${index}`}
                    size="middle"
                    pagination={filteredInstances.length > 20 ? { pageSize: 20, size: 'small' } : false}
                    locale={{
                      emptyText: (
                        <div className={styles.emptyTableText}>
                          {instancesLoading
                            ? t('resourceCenter.common.loading', '加载中...')
                            : t('platformResources.common.noInstances', '暂无 {kind} 实例', { kind: currentType.kind })}
                        </div>
                      ),
                    }}
                  />
                </Spin>
              </div>

              <Modal
                title={<span><Icon type="code" className={styles.modalTitleIcon} />{modalTitle}</span>}
                visible={instanceModal.visible}
                onCancel={() => this.setState({ instanceModal: { ...instanceModal, visible: false, saving: false } })}
                footer={modalFooter}
                width={760}
                destroyOnClose
              >
                <CodeMirrorForm
                  mode="yaml"
                  readOnly={instanceModal.mode === 'view'}
                  disabled={instanceModal.mode === 'view'}
                  value={instanceModal.content}
                  onChange={instanceModal.mode !== 'view'
                    ? value => this.setState({ instanceModal: { ...instanceModal, content: value } })
                    : undefined}
                  isHeader={false}
                  isUpload={false}
                  isAmplifications={false}
                  editorHeight={460}
                  style={{ marginBottom: 0 }}
                />
              </Modal>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }

  renderStorageWorkspace() {
    const { storageSubTab } = this.state;

    return (
      <Card bordered={false} className={styles.workspaceCard}>
        <Tabs
          activeKey={storageSubTab}
          onChange={this.handleStorageSubTabChange}
          className={styles.innerTabs}
        >
          <TabPane key="storageclass" tab={t('platformResources.section.storageclass.title', '存储类')}>
            {this.renderStorageClassTab()}
          </TabPane>
          <TabPane key="pv" tab={t('platformResources.section.pv.title', '存储卷')}>
            {this.renderPVTab()}
          </TabPane>
          <TabPane key="storageconfig" tab={t('platformResources.section.config.title', '存储配置')}>
            {this.renderStorageConfigTab()}
          </TabPane>
        </Tabs>
      </Card>
    );
  }

  render() {
    const { createModalVisible, yamlContent, mainTab, storageResourceModal } = this.state;

    const storageResourceModalTitle = storageResourceModal.mode === 'edit'
      ? t('platformResources.modal.editYaml', '编辑 YAML - {title} - {name}', { title: storageResourceModal.title, name: storageResourceModal.name })
      : t('platformResources.modal.viewYaml', '查看 YAML - {title} - {name}', { title: storageResourceModal.title, name: storageResourceModal.name });

    const storageResourceModalFooter = storageResourceModal.mode === 'view'
      ? [
        <Button key="close" onClick={this.closeStorageResourceModal}>
          {t('platformResources.common.close', '关闭')}
        </Button>,
      ]
      : [
        <Button key="cancel" onClick={this.closeStorageResourceModal}>
          {t('platformResources.common.cancel', '取消')}
        </Button>,
        <Button
          key="ok"
          type="primary"
          loading={storageResourceModal.saving}
          onClick={this.handleSaveStorageResourceYaml}
        >
          {t('platformResources.common.save', '保存')}
        </Button>,
      ];

    return (
      <PageHeaderLayout
        title={t('platformResources.page.title', '存储管理')}
        content={t('platformResources.header.content', '围绕集群级存储与 Kubernetes 全局资源，提供更清晰的资源目录、集中筛选和 YAML 级操作工作区。')}
        titleSvg={pageheaderSvg.getPageHeaderSvg('StorageMgtL', 18)}
        wrapperClassName={styles.pageHeaderLayout}
      >
        <div className={styles.platformResourcesPage}>
          <div className={styles.pageShell}>
            {this.renderPageHeader()}

            <div className={styles.pageContent}>
              {mainTab === 'storage' && this.renderStorageWorkspace()}

              {mainTab === 'other' && (
                <Card bordered={false} className={styles.workspaceCard}>
                  {this.renderOtherResourcesTab()}
                </Card>
              )}
            </div>

            <Modal
              title={<span><Icon type="code" className={styles.modalTitleIcon} />{t('platformResources.modal.createStorageClass', 'YAML 创建存储类')}</span>}
              visible={createModalVisible}
              onOk={this.handleCreateConfirm}
              onCancel={() => this.setState({ createModalVisible: false, yamlContent: '' })}
              width={680}
              okText={t('platformResources.common.create', '创建')}
              cancelText={t('platformResources.common.cancel', '取消')}
            >
              <p className={styles.modalLead}>{t('platformResources.modal.lead.storageClass', '粘贴 StorageClass 的 YAML 定义内容。')}</p>
              <CodeMirrorForm
                mode="yaml"
                value={yamlContent}
                onChange={value => this.setState({ yamlContent: value })}
                isHeader={false}
                isUpload={false}
                isAmplifications={false}
                editorHeight={320}
                style={{ marginBottom: 0 }}
              />
            </Modal>

            <Modal
              title={<span><Icon type="code" className={styles.modalTitleIcon} />{storageResourceModalTitle}</span>}
              visible={storageResourceModal.visible}
              onCancel={this.closeStorageResourceModal}
              footer={storageResourceModalFooter}
              width={760}
              destroyOnClose
            >
              <CodeMirrorForm
                mode="yaml"
                readOnly={storageResourceModal.mode === 'view'}
                disabled={storageResourceModal.mode === 'view'}
                value={storageResourceModal.content}
                onChange={storageResourceModal.mode !== 'view'
                  ? value => this.setState({
                    storageResourceModal: {
                      ...storageResourceModal,
                      content: value,
                    },
                  })
                  : undefined}
                isHeader={false}
                isUpload={false}
                isAmplifications={false}
                editorHeight={460}
                style={{ marginBottom: 0 }}
              />
            </Modal>
          </div>
        </div>
      </PageHeaderLayout>
    );
  }
}

export default PlatformResources;
