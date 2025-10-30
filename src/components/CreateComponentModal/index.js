import React, { useState, useEffect, useRef } from 'react';
import { Modal, Icon, Spin, Form, Button } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import { pinyin } from 'pinyin-pro';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/newRole';
import PluginUtils from '../../utils/pulginUtils';
import { importAppPagePlugin } from '../../utils/importPlugins';
import RbdPluginsCom from '../RBDPluginsCom';
import AppMarketContent from '../AppMarketContent';
import ImageNameForm from '../ImageNameForm';
import ImageComposeForm from '../ImageComposeForm';
import ImageCmdDemoForm from '../ImageCmdDemoForm';
import AddOrEditImageRegistry from '../AddOrEditImageRegistry';
import OauthForm from '../OauthForm';
import CodeCustomForm from '../CodeCustomForm';
import CodeDemoForm from '../CodeDemoForm';
import CodeJwarForm from '../CodeJwarForm';
import CodeYamlForm from '../CodeYamlForm';
import HelmCmdForm from '../HelmCmdForm';
import OuterCustomForm from '../OuterCustomForm';
import DatabaseCreateForm from '../DatabaseCreateForm';
import ImgRepostory from '../ImgRepostory';
import ThirdList from '../ThirdList';
import RBDPluginsCom from '../RBDPluginsCom';
import styles from './index.less';

// Form wrapper for market install
const MarketInstallFormWrapper = Form.create()(
  ({ form, children, contentRef }) => {
    return React.cloneElement(children, { form, ref: contentRef });
  }
);

// Form wrapper for local market install
const LocalInstallFormWrapper = Form.create()(
  ({ form, children, contentRef }) => {
    return React.cloneElement(children, { form, ref: contentRef });
  }
);

const CreateComponentModal = ({ visible, onCancel, dispatch, currentEnterprise, rainbondInfo, currentUser, groups, pluginsList }) => {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'market', 'image', 'code', 'yaml', 'form', 'imageRepo', 'marketStore', 'localMarket', 'marketInstall', 'localMarketInstall'
  const [selectedStore, setSelectedStore] = useState(null);
  const [marketStores, setMarketStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [imageHubList, setImageHubList] = useState([]);
  const [loadingImageHubs, setLoadingImageHubs] = useState(false);
  const [currentFormType, setCurrentFormType] = useState(''); // 'docker', 'docker-compose' 等
  const [localImageList, setLocalImageList] = useState([]);
  const [archInfo, setArchInfo] = useState([]);
  const [showAddImageRegistry, setShowAddImageRegistry] = useState(false);
  const [clusters, setClusters] = useState([]);
  const [imageHubLoading, setImageHubLoading] = useState(false);
  const [showAddOauth, setShowAddOauth] = useState(false);
  const [oauthTable, setOauthTable] = useState([]);
  const [helmChildRef, setHelmChildRef] = useState(null);
  const [selectedImageHub, setSelectedImageHub] = useState(null);
  const [enterpriseInfo, setEnterpriseInfo] = useState(null);
  const [loadingEnterpriseInfo, setLoadingEnterpriseInfo] = useState(false);
  const [selectedOauthService, setSelectedOauthService] = useState(null);

  // 数据库相关状态
  const [databaseTypes, setDatabaseTypes] = useState([]);
  const [loadingDatabaseInfo, setLoadingDatabaseInfo] = useState(false);
  const [currentDatabaseType, setCurrentDatabaseType] = useState(null);
  const [showDatabaseForm, setShowDatabaseForm] = useState(false);

  // 插件相关状态
  const [availablePlugins, setAvailablePlugins] = useState([]);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [pluginModalVisible, setPluginModalVisible] = useState(false);
  const [pluginApp, setPluginApp] = useState({});
  const [pluginLoading, setPluginLoading] = useState(true);
  const [pluginError, setPluginError] = useState(false);
  const [pluginErrInfo, setPluginErrInfo] = useState('');
  const [importingPlugin, setImportingPlugin] = useState(null);

  // 应用市场相关状态
  const [marketApps, setMarketApps] = useState([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketSearchValue, setMarketSearchValue] = useState('');
  const [marketPage, setMarketPage] = useState(1);
  const [marketTotal, setMarketTotal] = useState(0);
  const [marketHasMore, setMarketHasMore] = useState(true);
  const [marketLoadingMore, setMarketLoadingMore] = useState(false);
  const [selectedMarketApp, setSelectedMarketApp] = useState(null);
  const [marketInstallType, setMarketInstallType] = useState('new');
  const [selectedMarketVersion, setSelectedMarketVersion] = useState('');
  const [currentMarketVersionInfo, setCurrentMarketVersionInfo] = useState({});
  const [marketSubmitLoading, setMarketSubmitLoading] = useState(false);

  // 本地组件库相关状态
  const [localMarketApps, setLocalMarketApps] = useState([]);
  const [localMarketLoading, setLocalMarketLoading] = useState(false);
  const [localMarketSearchValue, setLocalMarketSearchValue] = useState('');
  const [localMarketPage, setLocalMarketPage] = useState(1);
  const [localMarketTotal, setLocalMarketTotal] = useState(0);
  const [localMarketHasMore, setLocalMarketHasMore] = useState(true);
  const [localMarketLoadingMore, setLocalMarketLoadingMore] = useState(false);
  const [localMarketActiveTab, setLocalMarketActiveTab] = useState('all');
  const [selectedLocalApp, setSelectedLocalApp] = useState(null);
  const [localInstallType, setLocalInstallType] = useState('new');
  const [selectedLocalVersion, setSelectedLocalVersion] = useState('');
  const [currentLocalVersionInfo, setCurrentLocalVersionInfo] = useState({});
  const [localSubmitLoading, setLocalSubmitLoading] = useState(false);

  const marketListRef = useRef(null);
  const localMarketListRef = useRef(null);

  // 各个表单的 ref
  const dockerFormRef = useRef(null);
  const dockerComposeFormRef = useRef(null);
  const demoFormRef = useRef(null);
  const codeCustomFormRef = useRef(null);
  const codeDemoFormRef = useRef(null);
  const codeJwarFormRef = useRef(null);
  const yamlFormRef = useRef(null);
  const helmFormRef = useRef(null);
  const thirdPartyFormRef = useRef(null);
  const thirdListFormRef = useRef(null);
  const databaseFormRef = useRef(null);
  const marketInstallFormRef = useRef(null);
  const localInstallFormRef = useRef(null);
  const imageRepoFormRef = useRef(null);

  // 获取商店应用列表
  const fetchMarketApps = (storeName, page = 1, searchKey = '') => {
    setMarketLoading(page === 1);
    dispatch({
      type: 'market/fetchMarkets',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        name: storeName,
        query: searchKey,
        page,
        pageSize: 10
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const list = res.list || [];
          setMarketApps(prevApps => {
            return page === 1 ? list : [...prevApps, ...list];
          });
          setMarketTotal(res.total || 0);
          setMarketHasMore(list.length >= 10);
        } else {
          if (page === 1) {
            setMarketApps([]);
          }
        }
        setMarketLoading(false);
        setMarketLoadingMore(false);
      },
      handleError: err => {
        if (page === 1) {
          setMarketApps([]);
        }
        setMarketLoading(false);
        setMarketLoadingMore(false);
      }
    });
  };

  // 获取本地组件库应用列表
  const fetchLocalMarketApps = (page = 1, searchKey = '', tab = 'all') => {
    setLocalMarketLoading(page === 1); // 只有第一页才显示加载状态
    const teamName = globalUtil.getCurrTeamName();
    dispatch({
      type: 'market/fetchAppModels',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        app_name: searchKey,
        page,
        page_size: 10,
        tenant_name: teamName,
        scope: tab === 'all' ? '' : tab
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const list = res.list || [];
          // 使用函数式更新,确保能获取到最新的 localMarketApps 值
          setLocalMarketApps(prevApps => {
            return page === 1 ? list : [...prevApps, ...list];
          });
          setLocalMarketTotal(res.total || 0);
          setLocalMarketHasMore(list.length >= 10);
        } else {
          if (page === 1) {
            setLocalMarketApps([]);
          }
        }
        setLocalMarketLoading(false);
        setLocalMarketLoadingMore(false);
      },
      handleError: err => {
        if (page === 1) {
          setLocalMarketApps([]);
        }
        setLocalMarketLoading(false);
        setLocalMarketLoadingMore(false);
      }
    });
  };

  // 获取应用列表
  const fetchGroupsList = () => {
    const teamName = globalUtil.getCurrTeamName();
    dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: teamName
      }
    });
  };

  // 处理商店应用安装按钮点击
  const handleMarketAppInstall = (app) => {
    setSelectedMarketApp(app);
    // 初始化版本信息为第一个版本
    if (app.versions_info && app.versions_info.length > 0) {
      setCurrentMarketVersionInfo(app.versions_info[0]);
    } else if (app.versions && app.versions.length > 0) {
      setCurrentMarketVersionInfo(app.versions[0]);
    }
    setCurrentView('marketInstall');
    // 获取应用列表供"安装到已有应用"使用
    fetchGroupsList();
  };

  // 处理本地应用安装按钮点击
  const handleLocalAppInstall = (app) => {
    setSelectedLocalApp(app);
    // 初始化版本信息为第一个版本
    if (app.versions_info && app.versions_info.length > 0) {
      setCurrentLocalVersionInfo(app.versions_info[0]);
    } else if (app.versions && app.versions.length > 0) {
      setCurrentLocalVersionInfo(app.versions[0]);
    }
    setCurrentView('localMarketInstall');
    // 获取应用列表供"安装到已有应用"使用
    fetchGroupsList();
  };

  // 处理商店应用版本变更
  const handleMarketVersionChange = (version) => {
    setSelectedMarketVersion(version);
    const app = selectedMarketApp;
    if (app && app.versions_info) {
      const versionInfo = app.versions_info.find(v => v.version === version);
      if (versionInfo) {
        setCurrentMarketVersionInfo(versionInfo);
      }
    }
  };

  // 处理本地应用版本变更
  const handleLocalVersionChange = (version) => {
    setSelectedLocalVersion(version);
    const app = selectedLocalApp;
    if (app && app.versions) {
      const versionInfo = app.versions.find(v => v.app_version === version);
      if (versionInfo) {
        setCurrentLocalVersionInfo(versionInfo);
      }
    }
  };

  // 处理商店应用搜索
  const handleMarketSearch = (value) => {
    setMarketSearchValue(value);
    setMarketPage(1);
    fetchMarketApps(selectedStore?.name, 1, value);
  };

  // 处理本地应用搜索
  const handleLocalMarketSearch = (value) => {
    setLocalMarketSearchValue(value);
    setLocalMarketPage(1);
    fetchLocalMarketApps(1, value, localMarketActiveTab);
  };

  // 处理本地组件库标签切换
  const handleLocalMarketTabChange = (tab) => {
    setLocalMarketActiveTab(tab);
    setLocalMarketPage(1);
    setLocalMarketApps([]);
    fetchLocalMarketApps(1, localMarketSearchValue, tab);
  };

  // 生成英文名
  const generateEnglishName = (name) => {
    if (name) {
      const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
      const cleanedPinyinName = pinyinName.toLowerCase();
      return cleanedPinyinName;
    }
    return '';
  };

  // 处理商店应用安装提交
  const handleMarketAppSubmit = (vals) => {
    setMarketSubmitLoading(true);
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const group_id = globalUtil.getAppID();

    const installApp = (finalGroupId, isNewApp = false) => {
      dispatch({
        type: 'createApp/installApp',
        payload: {
          team_name: teamName,
          ...vals,
          group_id: finalGroupId,
          app_id: selectedMarketApp.app_id,
          is_deploy: true,
          group_key: selectedMarketApp.group_key || selectedMarketApp.ID,
          app_version: vals.group_version,
          marketName: selectedStore.name,
          install_from_cloud: true
        },
        callback: () => {
          dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: teamName
            },
            callback: () => {
              if (isNewApp) {
                // 新应用安装完成后跳转到应用详情页
                dispatch(
                  routerRedux.push(
                    `/team/${teamName}/region/${regionName}/apps/${finalGroupId}/overview`
                  )
                );
              }
            }
          });
          setMarketSubmitLoading(false);
          onCancel();
        },
        handleError: () => {
          setMarketSubmitLoading(false);
        }
      });
    };

    if (group_id) {
      // 已有 group_id,直接安装
      installApp(group_id);
    } else if (vals.install_type === 'new' && vals.group_name) {
      // 创建新应用,先创建应用获取 group_id,再安装
      const k8s_app = generateEnglishName(vals.group_name);
      dispatch({
        type: 'application/addGroup',
        payload: {
          region_name: regionName,
          team_name: teamName,
          group_name: vals.group_name,
          k8s_app: k8s_app,
          note: '',
        },
        callback: (res) => {
          roleUtil.refreshPermissionsInfo();
          if (res && res.group_id) {
            installApp(res.group_id, true);
          } else {
            setMarketSubmitLoading(false);
          }
        },
        handleError: () => {
          setMarketSubmitLoading(false);
        }
      });
    } else if (vals.install_type === 'existing' && vals.group_id) {
      // 安装到已有应用
      installApp(vals.group_id, true);
    } else {
      setMarketSubmitLoading(false);
    }
  };

  // 处理本地应用安装提交
  const handleLocalAppSubmit = (vals) => {
    setLocalSubmitLoading(true);
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const group_id = globalUtil.getAppID();

    const installApp = (finalGroupId, isNewApp = false) => {
      dispatch({
        type: 'createApp/installApp',
        payload: {
          team_name: teamName,
          ...vals,
          group_id: finalGroupId,
          app_id: selectedLocalApp.app_id,
          is_deploy: true,
          group_key: selectedLocalApp.group_key || selectedLocalApp.ID,
          app_version: vals.group_version,
          install_from_cloud: false
        },
        callback: () => {
          dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: teamName
            },
            callback: () => {
              if (isNewApp) {
                // 新应用安装完成后跳转到应用详情页
                dispatch(
                  routerRedux.push(
                    `/team/${teamName}/region/${regionName}/apps/${finalGroupId}/overview`
                  )
                );
              }
            }
          });
          setLocalSubmitLoading(false);
          onCancel();
        },
        handleError: () => {
          setLocalSubmitLoading(false);
        }
      });
    };

    if (group_id) {
      // 已有 group_id,直接安装
      installApp(group_id);
    } else if (vals.install_type === 'new' && vals.group_name) {
      // 创建新应用,先创建应用获取 group_id,再安装
      const k8s_app = generateEnglishName(vals.group_name);
      dispatch({
        type: 'application/addGroup',
        payload: {
          region_name: regionName,
          team_name: teamName,
          group_name: vals.group_name,
          k8s_app: k8s_app,
          note: '',
        },
        callback: (res) => {
          roleUtil.refreshPermissionsInfo();
          if (res && res.group_id) {
            installApp(res.group_id, true);
          } else {
            setLocalSubmitLoading(false);
          }
        },
        handleError: () => {
          setLocalSubmitLoading(false);
        }
      });
    } else if (vals.install_type === 'existing' && vals.group_id) {
      // 安装到已有应用
      installApp(vals.group_id, true);
    } else {
      setLocalSubmitLoading(false);
    }
  };

  const menuItems = [
    {
      icon: 'shop',
      title: '从应用市场安装',
      key: 'market',
      hasSubMenu: true
    },
    {
      icon: 'block',
      title: '从镜像构建',
      key: 'image',
      hasSubMenu: true
    },
    {
      icon: 'code',
      title: '从源码构建',
      key: 'code',
      hasSubMenu: true
    },
    {
      icon: 'file-text',
      title: 'Yaml Helm K8s',
      key: 'yaml',
      hasSubMenu: true
    },
    // 每个插件独立展示在第一层菜单
    ...availablePlugins.map(plugin => ({
      icon: 'api',
      title: plugin.display_name || plugin.alias || plugin.name || '未知插件',
      key: `plugin-${plugin.name}`,
      plugin: plugin,
      showPluginModal: true
    }))
  ];
  if (showDatabaseForm) {
    menuItems.push({
      icon: 'database',
      title: '数据库',
      key: 'database',
      hasSubMenu: true
    });
  }

  // 动态生成市场子项:商店列表 + 本地组件库 + 离线导入
  const marketSubItems = [
    ...marketStores.map(store => ({
      icon: 'shop',
      title: store.alias || store.name,
      key: `store-${store.name}`,
      storeName: store.name,
      showMarketModal: true  // 标记需要打开应用列表弹窗
    })),
    {
      icon: 'appstore',
      title: '本地组件库',
      key: 'local-market',
      showLocalMarketModal: true  // 标记需要打开本地组件库弹窗
    },
    {
      icon: 'shop',
      title: '离线导入',
      key: 'offline-import',
      path: 'shared/import'
    }
  ];

  // 动态生成镜像子项:容器 + Docker Compose + 镜像仓库列表 + 示例
  const group_id = globalUtil.getAppID();
  const imageSubItems = [
    {
      icon: 'block',
      title: '容器',
      key: 'custom',
      showForm: true,
      formType: 'docker'
    },
    // 只在非应用视图下显示 Docker Compose
    ...(!group_id ? [{
      icon: 'block',
      title: 'Docker Compose',
      key: 'docker-compose',
      showForm: true,
      formType: 'docker-compose'
    }] : []),
    ...imageHubList.map(hub => ({
      icon: 'block',
      title: `${hub.hub_type} (${hub.secret_id})`,
      key: `image-hub-${hub.secret_id}`,
      showImgRepostory: true,
      secretId: hub.secret_id
    })),
    {
      icon: 'block',
      title: '示例',
      key: 'demo',
      showForm: true,
      formType: 'demo'
    }
  ];

  // 使用 oauthUtil 过滤出可用的 Git 仓库
  const codeRepositoryList = enterpriseInfo ? require('../../utils/oauth').default.getEnableGitOauthServer(enterpriseInfo) : [];

  const codeSubItems = [
    {
      icon: 'code',
      title: '源码',
      key: 'source-code',
      showForm: true,
      formType: 'code-custom'
    },
    ...codeRepositoryList.map(repo => ({
      icon: 'code',
      title: `${repo.name}`,
      key: `code-repo-${repo.service_id}`,
      showThirdList: true,
      oauthService: repo
    })),
    {
      icon: 'code',
      title: '软件包',
      key: 'package',
      showForm: true,
      formType: 'code-jwar'
    },
    {
      icon: 'code',
      title: '示例',
      key: 'code-demo',
      showForm: true,
      formType: 'code-demo'
    }
  ];

  const yamlSubItems = [
    {
      icon: 'file-text',
      title: 'Yaml',
      key: 'yaml',
      showForm: true,
      formType: 'yaml'
    },
    {
      icon: 'file-text',
      title: 'Helm',
      key: 'helm',
      showForm: true,
      formType: 'helm'
    },
    {
      icon: 'file-text',
      title: '第三方组件',
      key: 'third-party',
      showForm: true,
      formType: 'third-party'
    }
  ];

  // 数据库类型名称格式化方法
  const formatDatabaseTypeName = (type) => {
    const typeMap = {
      'mysql': 'MySQL',
      'postgresql': 'PostgreSQL',
      'rabbitmq': 'RabbitMQ',
      'redis': 'Redis'
    };
    return typeMap[type?.toLowerCase()] || type || '数据库';
  };

  // 动态生成数据库子项：根据获取到的数据库类型
  const databaseSubItems = databaseTypes.map(dbType => ({
    icon: 'database',
    title: formatDatabaseTypeName(dbType.type) || formatDatabaseTypeName(dbType.label) || '数据库',
    key: `database-${dbType.type}`,
    showForm: true,
    formType: 'database',  // 统一使用 'database' 作为表单类型
    databaseType: dbType.type
  }));

  

  // 插件现在直接在第一层菜单展示，不需要子菜单

  const fetchMarketStores = () => {
    setLoadingStores(true);
    dispatch({
      type: 'market/fetchMarketsTab',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id
      },
      callback: res => {
        const list = (res && res.list) || [];
        const activeStores = list.filter(item => item.status === 1);
        setMarketStores(activeStores);
        setLoadingStores(false);
        getStoreList();
      },
      handleError: err => {
        setMarketStores([]);
        setLoadingStores(false);
      }
    });
  };

  const getStoreList = () => {
    dispatch({
      type: 'enterprise/fetchEnterpriseStoreList',
      payload: {
        enterprise_id: currentEnterprise?.enterprise_id
      },
      callback: data => {
      }
    });
  };

  const fetchImageHubs = () => {
    setLoadingImageHubs(true);
    dispatch({
      type: 'global/fetchPlatformImageHub',
      callback: data => {
        if (data) {
          setImageHubList(data.list || []);
        }
        setLoadingImageHubs(false);
      },
      handleError: err => {
        setImageHubList([]);
        setLoadingImageHubs(false);
      }
    });
  };

  const fetchClusters = () => {
    if (currentUser?.enterprise_id) {
      dispatch({
        type: 'region/fetchEnterpriseClusters',
        payload: {
          enterprise_id: currentUser.enterprise_id
        },
        callback: res => {
          if (res && res.list) {
            const clusterList = res.list.map((item, index) => ({
              ...item,
              key: `cluster${index}`
            }));
            setClusters(clusterList);
          } else {
            setClusters([]);
          }
        }
      });
    }
  };

  const fetchLocalImageList = () => {
    const isSaas = rainbondInfo?.is_saas || false;
    if (!isSaas) {
      const teamName = globalUtil.getCurrTeamName();

      // 如果无法获取 team_name,不执行 API 调用
      if (!teamName) {
        return;
      }

      dispatch({
        type: 'createApp/getImageRepositories',
        payload: {
          team_name: teamName
        },
        callback: data => {
          if (data) {
            setLocalImageList(data.list || []);
          }
        },
        handleError: err => {
          setLocalImageList([]);
        }
      });
    }
  };

  const fetchArchInfo = () => {
    const regionName = globalUtil.getCurrRegionName();
    const teamName = globalUtil.getCurrTeamName();

    // 如果无法获取 region 或 team 信息,不执行 API 调用
    if (!regionName || !teamName) {
      return;
    }

    dispatch({
      type: 'index/fetchArchOverview',
      payload: {
        region_name: regionName,
        team_name: teamName
      },
      callback: res => {
        if (res && res.bean) {
          setArchInfo(res.list || []);
        }
      },
      handleError: err => {
        // 设置默认值,避免阻塞用户操作
        setArchInfo([]);
      }
    });
  };
  const fetchEnterpriseInfo = () => {
    const enterprise_id = currentEnterprise && currentEnterprise.enterprise_id;

    if (!enterprise_id) {
      return;
    }

    setLoadingEnterpriseInfo(true);
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id
      },
      callback: res => {
        if (res && res.bean) {
          setEnterpriseInfo(res.bean);
        }
        setLoadingEnterpriseInfo(false);
      },
      handleError: err => {
        setEnterpriseInfo(null);
        setLoadingEnterpriseInfo(false);
      }
    });
  };
  // 获取可用的插件列表
  const fetchAvailablePlugins = () => {
    const teamName = globalUtil.getCurrTeamName();

    const bool = PluginUtils.isInstallPlugin(pluginsList, "rainbond-databases");
    setShowDatabaseForm(bool);
    // 根据团队视图过滤插件
    const filteredPlugins = PluginUtils.segregatePluginsByHierarchy(pluginsList, 'TeamModal');
    
    // 过滤出有弹窗字段的插件（这里假设插件有特定的属性标识弹窗功能）
    const modalPlugins = filteredPlugins.filter(plugin => {
      // 可以根据插件的特定属性来判断是否有弹窗字段
      // 例如：plugin.has_modal_fields || plugin.plugin_type === 'modal' 等
      return plugin.enable_status === 'true' && (
        plugin.plugin_type === 'JSInject' ||
        plugin.has_modal_fields ||
        plugin.show_in_create_modal ||
        plugin.name?.includes('create') ||
        plugin.name?.includes('modal')
      );
    });

    setAvailablePlugins(modalPlugins);
  };

  // 获取数据库类型列表
  const fetchDatabaseTypes = () => {
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();

    if (!teamName || !regionName) {
      return;
    }
    setLoadingDatabaseInfo(true);
    dispatch({
      type: 'kubeblocks/fetchKubeBlocksDatabaseTypes',
      payload: {
        team_name: teamName,
        region_name: regionName
      },
      callback: res => {
        if (res && Array.isArray(res.list)) {
          setDatabaseTypes(res.list);
          setLoadingDatabaseInfo(false);
        }
      }
    });
  };

  // 监听滚动事件进行自动加载 - 商店应用
  useEffect(() => {
    if (currentView !== 'marketStore') {
      return;
    }

    let cleanup = null;
    let attempts = 0;
    const maxAttempts = 10;

    // 使用轮询方式等待 ref 准备好
    const tryBindScroll = () => {
      attempts++;
      const marketContainer = marketListRef.current;

      if (!marketContainer) {
        if (attempts < maxAttempts) {
          setTimeout(tryBindScroll, 200);
        }
        return;
      }

      // ref 已准备好,绑定滚动事件
      const handleMarketScroll = () => {
        const container = marketListRef.current;
        if (!container) return;

        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;

        // 当滚动到底部附近(距离底部小于100px)时,加载下一页
        if (distanceToBottom < 100) {
          setMarketLoadingMore(prev => {
            if (!prev) {
              return true;
            }
            return prev;
          });
        }
      };

      marketContainer.addEventListener('scroll', handleMarketScroll);

      // 保存清理函数
      cleanup = () => {
        marketContainer.removeEventListener('scroll', handleMarketScroll);
      };
    };

    // 开始尝试绑定
    tryBindScroll();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [currentView, marketLoading]);

  // 当 marketLoadingMore 变为 true 时,触发数据加载
  useEffect(() => {
    if (marketLoadingMore && marketHasMore && currentView === 'marketStore') {
      const nextPage = marketPage + 1;
      setMarketPage(nextPage);
      fetchMarketApps(selectedStore?.name, nextPage, marketSearchValue);
    }
  }, [marketLoadingMore]);

  // 监听滚动事件进行自动加载 - 本地组件库
  useEffect(() => {
    if (currentView !== 'localMarket') {
      return;
    }

    let cleanup = null;
    let attempts = 0;
    const maxAttempts = 10;

    // 使用轮询方式等待 ref 准备好
    const tryBindScroll = () => {
      attempts++;
      const localContainer = localMarketListRef.current;

      if (!localContainer) {
        if (attempts < maxAttempts) {
          setTimeout(tryBindScroll, 200);
        }
        return;
      }

      // ref 已准备好,绑定滚动事件
      const handleLocalMarketScroll = () => {
        const container = localMarketListRef.current;
        if (!container) return;

        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;

        // 当滚动到底部附近(距离底部小于100px)时,加载下一页
        if (distanceToBottom < 100) {
          setLocalMarketLoadingMore(prev => {
            if (!prev) {
              return true;
            }
            return prev;
          });
        }
      };

      localContainer.addEventListener('scroll', handleLocalMarketScroll);

      // 保存清理函数
      cleanup = () => {
        localContainer.removeEventListener('scroll', handleLocalMarketScroll);
      };
    };

    // 开始尝试绑定
    tryBindScroll();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [currentView, localMarketLoading]);

  // 当 localMarketLoadingMore 变为 true 时,触发数据加载
  useEffect(() => {
    if (localMarketLoadingMore && localMarketHasMore && currentView === 'localMarket') {
      const nextPage = localMarketPage + 1;
      setLocalMarketPage(nextPage);
      fetchLocalMarketApps(nextPage, localMarketSearchValue, localMarketActiveTab);
    }
  }, [localMarketLoadingMore]);

  useEffect(() => {
    if (visible && currentView === 'form') {
      fetchLocalImageList();
      fetchArchInfo();
    }
  }, [visible, currentView]);

  // 当弹窗打开时，获取可用插件
  useEffect(() => {
    if (visible && pluginsList) {
      fetchAvailablePlugins();
    }
  }, [visible, pluginsList]);

  const handleItemClick = (item) => {
    if (item.hasSubMenu) {
      setCurrentView(item.key);
      // 如果切换到市场视图,获取商店列表
      if (item.key === 'market') {
        fetchMarketStores();
      }
      // 如果切换到镜像视图,获取镜像仓库列表和集群列表
      if (item.key === 'image') {
        fetchImageHubs();
        fetchClusters();
      }
      // 如果切换到源码视图,获取企业信息(包含源码仓库列表)
      if (item.key === 'code') {
        fetchEnterpriseInfo();
      }
      // 如果切换到数据库视图,获取数据库类型列表
      if (item.key === 'database') {
        fetchDatabaseTypes();
      }
      return;
    }
    // 如果标记了需要显示应用列表(点击商店)
    if (item.showMarketModal && item.storeName) {
      const store = marketStores.find(s => s.name === item.storeName);
      setSelectedStore(store);
      setCurrentView('marketStore');
      // 获取该商店的应用列表
      fetchMarketApps(store.name);
      return;
    }

    // 如果标记了需要显示本地组件库
    if (item.showLocalMarketModal) {
      setCurrentView('localMarket');
      // 获取本地组件库列表
      fetchLocalMarketApps(1, '', 'all');
      return;
    }

    // 如果标记了需要显示私有镜像仓库
    if (item.showImgRepostory && item.secretId) {
      const hub = imageHubList.find(h => h.secret_id === item.secretId);
      setSelectedImageHub(hub);
      setCurrentView('imageRepo');
      return;
    }

    // 如果标记了需要显示ThirdList(OAuth源码仓库列表)
    if (item.showThirdList && item.oauthService) {
      setSelectedOauthService(item.oauthService);
      setCurrentView('thirdList');
      return;
    }

    // 如果标记了需要显示插件弹窗
    if (item.showPluginModal && item.plugin) {
      handlePluginClick(item.plugin);
      return;
    }

    // 如果标记了需要显示表单
    if (item.showForm) {
      setCurrentView('form');
      setCurrentFormType(item.formType);
      // 如果有 databaseType 字段，说明是数据库类型，需要设置数据库类型
      if (item.databaseType) {
        setCurrentDatabaseType(item.databaseType);
      }
      return;
    }

    // 如果有路径,跳转到对应页面
    if (item.path) {
      const teamName = globalUtil.getCurrTeamName();
      const regionName = globalUtil.getCurrRegionName();
      dispatch(
        routerRedux.push(
          `/team/${teamName}/region/${regionName}/${item.path}`
        )
      );
      onCancel();
    }
  };

  const handleBack = () => {
    if (currentView === 'form') {
      // 从表单视图返回到对应的二级菜单
      const formTypeToView = {
        'docker': 'image',
        'docker-compose': 'image',
        'demo': 'image',
        'code-custom': 'code',
        'code-jwar': 'code',
        'code-demo': 'code',
        'yaml': 'yaml',
        'helm': 'yaml',
        'third-party': 'yaml',
        'database': 'database'
      };

      setCurrentView(formTypeToView[currentFormType] || 'main');
      setCurrentFormType('');
    } else if (currentView === 'plugin') {
      // 从插件视图返回到主菜单
      setCurrentView('main');
      setSelectedPlugin(null);
    } else if (currentView === 'thirdList') {
      // 从 ThirdList 视图返回到源码菜单
      setCurrentView('code');
      setSelectedOauthService(null);
    } else if (currentView === 'imageRepo') {
      // 从镜像仓库视图返回到镜像菜单
      setCurrentView('image');
      setSelectedImageHub(null);
    } else if (currentView === 'marketInstall') {
      // 从商店应用安装表单返回到商店应用列表
      setCurrentView('marketStore');
      setSelectedMarketApp(null);
    } else if (currentView === 'marketStore') {
      // 从商店应用列表返回到市场菜单
      setCurrentView('market');
      setSelectedStore(null);
      setMarketApps([]);
      setMarketSearchValue('');
      setMarketPage(1);
    } else if (currentView === 'localMarketInstall') {
      // 从本地应用安装表单返回到本地组件库列表
      setCurrentView('localMarket');
      setSelectedLocalApp(null);
    } else if (currentView === 'localMarket') {
      // 从本地组件库列表返回到市场菜单
      setCurrentView('market');
      setLocalMarketApps([]);
      setLocalMarketSearchValue('');
      setLocalMarketPage(1);
      setLocalMarketActiveTab('all');
    } else {
      setCurrentView('main');
    }
  };

  const handleClose = () => {
    setCurrentView('main');
    onCancel();
  };

  const handleOpenAddImageRegistry = () => {
    setShowAddImageRegistry(true);
  };

  const handleCloseAddImageRegistry = () => {
    setShowAddImageRegistry(false);
  };

  const handleAddImageRegistry = (values) => {
    setImageHubLoading(true);
    dispatch({
      type: 'global/addPlatformImageHub',
      payload: {
        secret_id: values.secret_id,
        domain: values.domain,
        username: values.username,
        password: values.password,
        hub_type: values.hub_type
      },
      callback: res => {
        if (res && res.response_data && res.response_data.code == 200) {
          // 添加成功后重新获取镜像仓库列表
          fetchImageHubs();
        }
        setImageHubLoading(false);
        handleCloseAddImageRegistry();
      }
    });
  };

  const handleOpenAddOauth = () => {
    setShowAddOauth(true);
  };

  const handleCloseAddOauth = () => {
    setShowAddOauth(false);
  };

  const handleCreatOauth = (values) => {
    const { oauth_type, redirect_domain, ...rest } = values;
    const homeUrls = {
      github: 'https://github.com',
      aliyun: 'https://oauth.aliyun.com',
      dingtalk: 'https://oapi.dingtalk.com'
    };

    const oauthData = {
      ...rest,
      oauth_type: oauth_type.toLowerCase(),
      home_url: homeUrls[oauth_type.toLowerCase()] || '',
      redirect_uri: `${redirect_domain}/console/oauth/redirect`,
      is_auto_login: false,
      is_console: true,
      eid: currentUser?.enterprise_id,
      service_id: null,
      enable: true,
      system: false
    };

    const updatedTable = [...oauthTable, oauthData];

    dispatch({
      type: 'global/creatOauth',
      payload: {
        enterprise_id: currentUser?.enterprise_id,
        arr: updatedTable
      },
      callback: data => {
        if (data && data.status_code === 200) {
          handleCloseAddOauth();
        }
      }
    });
  };

  // 导入插件
  const importPlugin = (plugin) => {
    // 防止重复导入同一个插件
    if (importingPlugin === plugin.name) {
      return;
    }

    setImportingPlugin(plugin.name);
    setPluginLoading(true);
    setPluginError(false);

    const regionName = globalUtil.getCurrRegionName();

    importAppPagePlugin(plugin, regionName, 'team').then(res => {
      setImportingPlugin(null);
      setPluginApp(res);
      setPluginLoading(false);
      setPluginError(false);
    }).catch(err => {
      setImportingPlugin(null);
      setPluginErrInfo(err?.response?.data?.message || err?.message || "An unexpected error occurred.");
      setPluginLoading(false);
      setPluginError(true);
    });
  };

  // 处理插件点击
  const handlePluginClick = (plugin) => {
    setSelectedPlugin(plugin);
    setCurrentView('plugin');
    setPluginApp({});
    setPluginLoading(true);
    setPluginError(false);
    setPluginErrInfo('');

    // 对于JSInject类型的插件，开始导入
    if (plugin.plugin_type === 'JSInject') {
      setTimeout(() => {
        importPlugin(plugin);
      }, 50);
    } else {
      // iframe类型插件直接加载完成
      setPluginLoading(false);
    }
  };

  // 关闭插件弹窗
  const handlePluginModalClose = () => {
    setPluginModalVisible(false);
    setSelectedPlugin(null);
    setPluginApp({});
    setPluginLoading(true);
    setPluginError(false);
    setPluginErrInfo('');
    setImportingPlugin(null);
  };

  const handleFormSubmit = (value, event_id) => {
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();

    if (currentFormType === 'docker-compose') {
      // Docker Compose 提交
      dispatch({
        type: 'createApp/createAppByCompose',
        payload: {
          team_name: teamName,
          image_type: 'docker_compose',
          ...value,
        },
        callback: data => {
          const { group_id, compose_id, app_name } = data.bean;
          dispatch(
            routerRedux.push(
              `/team/${teamName}/region/${regionName}/create/create-compose-check/${group_id}/${compose_id}?app_name=${app_name}`
            )
          );
          onCancel();
        },
      });
    } else if (currentFormType === 'database') {
      dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/create/database-config/?database_type=${currentDatabaseType}&group_id=${value.group_id}&k8s_app=${value.k8s_app}&service_cname=${value.service_cname}`));
    } else if (currentFormType === 'demo') {
      // 示例镜像提交
      dispatch({
        type: "createApp/createAppByDockerrun",
        payload: {
          team_name: teamName,
          image_type: "docker_run",
          ...value,
        },
        callback: (data) => {
          const appAlias = data && data.bean.service_alias;
          dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/create/create-check/${appAlias}`));
          onCancel();
        },
      });
    } else if (currentFormType === 'code-custom') {
      // 源码提交
      const username = value.username_1;
      const password = value.password_1;
      delete value.username_1;
      delete value.password_1;
      dispatch({
        type: 'createApp/createAppByCode',
        payload: {
          team_name: teamName,
          code_from: 'gitlab_manual',
          ...value,
          username,
          password
        },
        callback: data => {
          if (data) {
            const appAlias = data.bean.service_alias;
            dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/create/create-check/${appAlias}`));
            onCancel();
          }
        }
      });
    } else if (currentFormType === 'code-demo') {
      // 源码示例提交
      dispatch({
        type: 'createApp/createAppByCode',
        payload: {
          team_name: teamName,
          code_from: 'gitlab_demo',
          ...value,
        },
        callback: data => {
          const appAlias = data && data.bean.service_alias;
          dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/create/create-check/${appAlias}`));
          onCancel();
        },
      });
    } else if (currentFormType === 'code-jwar') {
      // 软件包提交
      dispatch({
        type: "createApp/createJarWarFormSubmit",
        payload: {
          region_name: regionName,
          team_name: teamName,
          event_id,
          ...value
        },
        callback: (data) => {
          const appAlias = data && data.bean.service_alias;
          dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/create/create-check/${appAlias}?event_id=${event_id}`));
          onCancel();
        },
      });
    } else if (currentFormType === 'yaml') {
      // Yaml 提交
      dispatch(
        routerRedux.push(
          `/team/${teamName}/region/${regionName}/importMessageYaml?event_id=${event_id}&group_id=${value.group_id}&group_name=${value.group_name}`
        )
      );
      onCancel();
    } else if (currentFormType === 'helm') {
      // Helm 提交
      if (value.imagefrom === 'cmd') {
        dispatch({
          type: "market/HelmwaRehouseAddCom",
          payload: {
            team_name: teamName,
            app_id: value.group_id,
            command: value.helm_cmd
          },
          callback: res => {
            if (res && res.status_code === 200) {
              const info = res.bean;
              if (info.command === "install") {
                const obj = {
                  app_store_name: info.repo_name,
                  app_template_name: info.chart_name,
                  version: info.version,
                  overrides: info.overrides,
                };
                window.sessionStorage.setItem('appinfo', JSON.stringify(obj));
                dispatch(
                  routerRedux.push(
                    `/team/${teamName}/region/${regionName}/apps/${value.group_id}/helminstall?installPath=cmd`
                  )
                );
              }
              onCancel();
            }
          },
        });
      } else {
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/apps/${value.group_id}/helminstall?installPath=upload&event_id=${value.event_id}`
          )
        );
        onCancel();
      }
    } else if (currentFormType === 'third-party') {
      // 第三方组件提交
      dispatch({
        type: 'createApp/createThirdPartyServices',
        payload: {
          team_name: teamName,
          group_id: value.group_id,
          service_cname: value.service_cname,
          ...value
        },
        callback: data => {
          if (data) {
            const appAlias = data.bean.service_alias;
            dispatch(
              routerRedux.push(
                `/team/${teamName}/region/${regionName}/create/create-check/${appAlias}?group_id=${value.group_id}`
              )
            );
            onCancel();
          }
        }
      });
    } else {
      // 容器镜像提交
      dispatch({
        type: "createApp/createAppByDockerrun",
        payload: {
          team_name: teamName,
          image_type: "docker_image",
          ...value,
        },
        callback: (data) => {
          const appAlias = data && data.bean.service_alias;
          dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/create/create-check/${appAlias}`));
          onCancel();
        },
      });
    }
  };

  const handleInstallApp = (value, event_id) => {
    if (value.group_id) {
      // 已有应用
      handleFormSubmit(value, event_id);
    } else {
      // 新建应用再创建组件
      const teamName = globalUtil.getCurrTeamName();
      const regionName = globalUtil.getCurrRegionName();
      dispatch({
        type: 'application/addGroup',
        payload: {
          region_name: regionName,
          team_name: teamName,
          group_name: value.group_name,
          k8s_app: value.k8s_app,
          note: '',
        },
        callback: (res) => {
          if (res && res.group_id) {
            value.group_id = res.group_id;
            handleFormSubmit(value, event_id);
          }
        },
      });
    }
  };

  // 处理从ThirdList提交(OAuth仓库项目)
  const handleThirdListSubmit = (value) => {
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();

    const payload = {
      service_id: selectedOauthService.service_id,
      code_version: value.code_version,
      git_url: value.project_url,
      group_id: value.group_id,
      server_type: 'git',
      service_cname: value.service_cname,
      is_oauth: true,
      git_project_id: value.project_id,
      team_name: teamName,
      open_webhook: value.open_webhook,
      full_name: value.project_full_name,
      k8s_component_name: value.k8s_component_name,
      arch: value.arch,
    };

    const createThirdApp = () => {
      dispatch({
        type: 'createApp/createThirtAppByCode',
        payload,
        callback: data => {
          const appAlias = data && data.bean.service_alias;
          dispatch(
            routerRedux.push(
              `/team/${teamName}/region/${regionName}/create/create-check/${appAlias}`
            )
          );
          onCancel();
        },
      });
    };

    if (value.group_id) {
      // 已有应用,直接创建组件
      createThirdApp();
    } else {
      // 新建应用再创建组件
      dispatch({
        type: 'application/addGroup',
        payload: {
          region_name: regionName,
          team_name: teamName,
          group_name: value.group_name,
          k8s_app: value.k8s_app,
          note: '',
        },
        callback: (res) => {
          if (res && res.group_id) {
            payload.group_id = res.group_id;
            createThirdApp();
          }
        },
      });
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'market':
        return '从应用市场安装';
      case 'marketStore':
        return selectedStore ? selectedStore.alias || selectedStore.name : '应用商店';
      case 'marketInstall':
        return selectedMarketApp ? `安装 ${selectedMarketApp.app_name || selectedMarketApp.name}` : '安装应用';
      case 'localMarket':
        return '本地组件库';
      case 'localMarketInstall':
        return selectedLocalApp ? `安装 ${selectedLocalApp.app_name || selectedLocalApp.name}` : '安装应用';
      case 'image':
        return '从镜像构建';
      case 'imageRepo':
        return selectedImageHub ? `${selectedImageHub.hub_type} (${selectedImageHub.secret_id})` : '私有镜像仓库';
      case 'code':
        return '从源码构建';
      case 'yaml':
        return 'Yaml Helm K8s';
      case 'plugin':
        return selectedPlugin?.display_name || selectedPlugin?.alias || selectedPlugin?.name || '插件';
      case 'thirdList':
        return selectedOauthService ? `${selectedOauthService.name} 仓库` : '源码仓库';
      case 'form':
        if (currentFormType === 'docker') return '容器';
        if (currentFormType === 'docker-compose') return 'Docker Compose';
        if (currentFormType === 'demo') return '示例';
        if (currentFormType === 'code-custom') return '源码';
        if (currentFormType === 'code-jwar') return '软件包';
        if (currentFormType === 'code-demo') return '示例';
        if (currentFormType === 'yaml') return 'Yaml';
        if (currentFormType === 'helm') return 'Helm';
        if (currentFormType === 'third-party') return '第三方组件';
        if (currentFormType === 'database') return '数据库';
        return '创建组件';
      default:
        return '创建组件';
    }
  };

  const getCurrentItems = () => {
    switch (currentView) {
      case 'market':
        return marketSubItems;
      case 'image':
        return imageSubItems;
      case 'code':
        return codeSubItems;
      case 'yaml':
        return yamlSubItems;
      case 'database':
        return databaseSubItems;
      default:
        return menuItems;
    }
  };

  const getAddSectionConfig = () => {
    switch (currentView) {
      case 'image':
        return {
          title: '添加私有镜像仓库',
          desc: '配置您的私有镜像仓库地址'
        };
      case 'code':
        return {
          title: '添加源码仓库',
          desc: '配置您的私有源码仓库地址'
        };
      default:
        return null;
    }
  };

  // 获取 footer
  const getModalFooter = () => {
    const price = selectedMarketApp?.price || 0;

    // 表单视图需要显示提交按钮
    if (currentView === 'form') {
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" onClick={handleFooterSubmit} loading={false}>
            确认创建
          </Button>
        </div>
      );
    }

    // 应用市场安装视图 - 左侧显示价格,右侧显示按钮
    if (currentView === 'marketInstall') {
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: '#595959' }}>
            <span>预估(每天)</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#f5a623', marginLeft: '8px' }}>
              ¥{price.toFixed(2)}
            </span>
          </div>
          <Button type="primary" onClick={handleFooterSubmit} loading={marketSubmitLoading}>
            确认安装
          </Button>
        </div>
      );
    }

    // 本地组件库安装视图
    if (currentView === 'localMarketInstall') {
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: '#595959' }}>
            <span>预估(每天)</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#f5a623', marginLeft: '8px' }}>
              ¥{price.toFixed(2)}
            </span>
          </div>
          <Button type="primary" onClick={handleFooterSubmit} loading={localSubmitLoading}>
            确认安装
          </Button>
        </div>
      );
    }

    // 其他视图不显示 footer
    return null;
  };

  // 处理 footer 按钮点击
  const handleFooterSubmit = () => {
    // 创建一个假的事件对象
    const fakeEvent = { preventDefault: () => { } };

    if (currentView === 'marketInstall') {
      // 应用市场安装 - 直接调用 AppMarketContent 的 handleSubmit 方法
      if (marketInstallFormRef.current && marketInstallFormRef.current.handleSubmit) {
        marketInstallFormRef.current.handleSubmit();
      }
    } else if (currentView === 'localMarketInstall') {
      // 本地组件库安装 - 直接调用 AppMarketContent 的 handleSubmit 方法
      if (localInstallFormRef.current && localInstallFormRef.current.handleSubmit) {
        localInstallFormRef.current.handleSubmit();
      }
    } else if (currentView === 'thirdList') {
      // ThirdList 表单提交
      if (thirdListFormRef.current && thirdListFormRef.current.handleSubmit) {
        thirdListFormRef.current.handleSubmit();
      }
    } else if (currentView === 'imageRepo') {
      // 私有镜像仓库表单提交
      if (imageRepoFormRef.current && imageRepoFormRef.current.getFormRef) {
        const formRef = imageRepoFormRef.current.getFormRef();
        if (formRef && formRef.handleSubmit) {
          formRef.handleSubmit(fakeEvent);
        }
      }
    } else if (currentView === 'form') {
      // 根据不同的 formType 调用对应的提交方法
      let formRef = null;
      switch (currentFormType) {
        case 'docker':
          formRef = dockerFormRef.current;
          break;
        case 'docker-compose':
          formRef = dockerComposeFormRef.current;
          break;
        case 'demo':
          formRef = demoFormRef.current;
          break;
        case 'code-custom':
          formRef = codeCustomFormRef.current;
          break;
        case 'code-demo':
          formRef = codeDemoFormRef.current;
          break;
        case 'code-jwar':
          formRef = codeJwarFormRef.current;
          break;
        case 'yaml':
          formRef = yamlFormRef.current;
          break;
        case 'helm':
          formRef = helmFormRef.current;
          break;
        case 'third-party':
          formRef = thirdPartyFormRef.current;
          break;
        case 'database':
          formRef = databaseFormRef.current;
          break;
        default:
          break;
      }

      if (formRef && formRef.handleSubmit) {
        formRef.handleSubmit(fakeEvent);
      }
    }
  };

  const DatabaseSVG = () => (
    <svg t="1761709531655" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="11608" viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor"><path d="M928 204.8v614.4h-64V601.728q-28.928 17.28-70.4 31.168-117.376 39.104-281.6 39.104-164.224 0-281.6-39.104-41.472-13.824-70.4-31.168V819.2h-64V204.8q0-76.096 134.4-120.896Q347.712 44.8 512 44.8q164.224 0 281.6 39.104 134.4 44.8 134.4 120.896z m-768 90.112V512q0 10.496 17.984 24.704 24.768 19.52 72.576 35.456Q358.08 608 512 608q153.856 0 261.44-35.84 47.808-16 72.576-35.456 17.984-14.208 17.984-24.704V294.912q-28.736 16.896-70.4 30.72Q676.288 364.8 512 364.8q-164.224 0-281.6-39.104-41.664-13.888-70.4-30.784z m688.448-112.768q-24.64-20.672-75.008-37.504Q665.92 108.8 512 108.8q-153.856 0-261.44 35.84-50.368 16.832-75.008 37.504-15.552 13.12-15.552 22.656t15.552 22.656q24.64 20.672 75.008 37.504Q358.08 300.8 512 300.8q153.856 0 261.44-35.84 50.368-16.832 75.008-37.504 15.552-13.12 15.552-22.656t-15.552-22.656zM160 819.2q0 10.496 17.984 24.704 24.768 19.52 72.576 35.456 107.52 35.84 261.44 35.84 153.856 0 261.44-35.84 47.808-16 72.576-35.456 17.984-14.208 17.984-24.704h64q0 41.6-42.368 74.944-33.536 26.432-91.968 45.952Q676.224 979.2 512 979.2t-281.6-39.104q-58.496-19.52-92.032-45.952Q96 860.8 96 819.2h64z" fill="#303133" p-id="11609"></path></svg>
  );
  const DatabaseIcon = props => <Icon component={DatabaseSVG} {...props} />;
  return (
    <>
      <Modal
        title={
          <div className={styles.modalTitle}>
            {currentView !== 'main' && (
              <Icon
                type="arrow-left"
                className={styles.backIcon}
                onClick={handleBack}
              />
            )}
            <Icon type="appstore" className={styles.titleIcon} />
            {getTitle()}
          </div>
        }
        visible={visible}
        onCancel={handleClose}
        footer={getModalFooter()}
        width={
          (currentView === 'imageRepo' || currentView === 'thirdList') ? 700 : 600
        }
        className={styles.createComponentModal}
        bodyStyle={
          (currentView === 'marketStore' || currentView === 'localMarket')
            ? { padding: 0 }
            : {}
        }
        style={{ top: 144 }}
      >
        {currentView === 'main' ? (
          <>
            <div className={styles.subtitle}>
              选择以下任意方式来创建您的第一个应用组件
            </div>
            <div className={styles.menuList}>
              {menuItems.map((item) => (
                <div
                  key={item.key}
                  className={styles.menuItem}
                  onClick={() => handleItemClick(item)}
                >
                  <div className={styles.menuIcon}>
                    {item.key == 'database' ?
                      <DatabaseIcon />
                      :
                      <Icon type={item.icon} />
                    }
                  </div>
                  <div className={styles.menuTitle}>{item.title}</div>
                  <Icon type="right" className={styles.arrowIcon} />
                </div>
              ))}
            </div>
          </>
        ) : currentView === 'imageRepo' ? (
          <div>
            {selectedImageHub && (
              <ImgRepostory
                ref={imageRepoFormRef}
                dispatch={dispatch}
                currentUser={currentUser}
                imgSecretId={selectedImageHub.secret_id}
                showSubmitBtn={true}
              />
            )}
          </div>
        ) : currentView === 'thirdList' ? (
          <div className={styles.formWrapper}>
            {selectedOauthService && (
              <ThirdList
                wrappedComponentRef={thirdListFormRef}
                type={selectedOauthService.service_id}
                dispatch={dispatch}
                currentUser={currentUser}
                archInfo={archInfo}
                handleSubmit={handleThirdListSubmit}
              />
            )}
          </div>
        ) : currentView === 'marketStore' ? (
          <AppMarketContent
            currentView="list"
            apps={marketApps}
            loading={marketLoading}
            loadingMore={marketLoadingMore}
            searchValue={marketSearchValue}
            onSearchChange={(e) => setMarketSearchValue(e.target.value)}
            onSearch={handleMarketSearch}
            listRef={marketListRef}
            onInstall={handleMarketAppInstall}
            total={marketTotal}
          />
        ) : currentView === 'marketInstall' ? (
          <MarketInstallFormWrapper contentRef={marketInstallFormRef}>
            <AppMarketContent
              currentView="install"
              selectedApp={selectedMarketApp}
              groups={groups}
              onChangeVersion={handleMarketVersionChange}
              installType={marketInstallType}
              onInstallTypeChange={(e) => setMarketInstallType(e.target.value)}
              currentVersionInfo={currentMarketVersionInfo}
              onSubmit={handleMarketAppSubmit}
              submitLoading={marketSubmitLoading}
              showSubmitBtn={false}
            />
          </MarketInstallFormWrapper>
        ) : currentView === 'localMarket' ? (
          <AppMarketContent
            currentView="list"
            apps={localMarketApps}
            loading={localMarketLoading}
            loadingMore={localMarketLoadingMore}
            searchValue={localMarketSearchValue}
            onSearchChange={(e) => setLocalMarketSearchValue(e.target.value)}
            onSearch={handleLocalMarketSearch}
            activeTab={localMarketActiveTab}
            onTabChange={handleLocalMarketTabChange}
            tabs={[
              { tab: '全部', key: 'all' },
              { tab: '公司发布', key: 'enterprise' },
              { tab: '团队发布', key: 'team' }
            ]}
            listRef={localMarketListRef}
            onInstall={handleLocalAppInstall}
            showResourceInfo={false}
            total={localMarketTotal}
          />
        ) : currentView === 'localMarketInstall' ? (
          <LocalInstallFormWrapper contentRef={localInstallFormRef}>
            <AppMarketContent
              currentView="install"
              selectedApp={selectedLocalApp}
              groups={groups}
              onChangeVersion={handleLocalVersionChange}
              installType={localInstallType}
              onInstallTypeChange={(e) => setLocalInstallType(e.target.value)}
              currentVersionInfo={currentLocalVersionInfo}
              showResourceInfo={false}
              onSubmit={handleLocalAppSubmit}
              submitLoading={localSubmitLoading}
              showSubmitBtn={false}
            />
          </LocalInstallFormWrapper>
        ) : currentView === 'plugin' ? (
          <div className={styles.pluginWrapper}>
            {pluginLoading ? (
              <div className={styles.loadingContainer}>
                <Spin size="large" />
              </div>
            ) : pluginError ? (
              <div className={styles.errorContainer}>
                <h3>插件加载失败</h3>
                <p>{pluginErrInfo}</p>
                <Button onClick={() => importPlugin(selectedPlugin)}>重试</Button>
              </div>
            ) : (
              <RbdPluginsCom
                app={pluginApp}
                plugins={selectedPlugin}
                loading={pluginLoading}
                pluginLoading={pluginLoading}
                error={pluginError}
                errInfo={pluginErrInfo}
                isCom={true}
              />
            )}
          </div>
        ) : currentView === 'form' ? (
          <div className={styles.formWrapper}>
            {currentFormType === 'docker' && (
              <ImageNameForm
                wrappedComponentRef={dockerFormRef}
                localList={localImageList}
                data={{ docker_cmd: "" }}
                onSubmit={handleInstallApp}
                dispatch={dispatch}
                archInfo={archInfo}
                showSubmitBtn={false}
              />
            )}
            {currentFormType === 'docker-compose' && (
              <ImageComposeForm
                wrappedComponentRef={dockerComposeFormRef}
                onSubmit={handleInstallApp}
                dispatch={dispatch}
                archInfo={archInfo}
                showSubmitBtn={false}
              />
            )}
            {currentFormType === 'demo' && (
              <ImageCmdDemoForm
                wrappedComponentRef={demoFormRef}
                data={{ docker_cmd: "" }}
                onSubmit={handleInstallApp}
                dispatch={dispatch}
                isDemo={true}
                archInfo={archInfo}
                showSubmitBtn={false}
              />
            )}
            {currentFormType === 'code-custom' && (
              <CodeCustomForm
                wrappedComponentRef={codeCustomFormRef}
                onSubmit={handleInstallApp}
                dispatch={dispatch}
                archInfo={archInfo}
                enterpriseInfo={enterpriseInfo}
                showSubmitBtn={false}
              />
            )}
            {currentFormType === 'code-demo' && (
              <CodeDemoForm
                wrappedComponentRef={codeDemoFormRef}
                data={{ git_url: '' }}
                onSubmit={handleInstallApp}
                dispatch={dispatch}
                archInfo={archInfo}
                showSubmitBtn={false}
              />
            )}
            {currentFormType === 'code-jwar' && (
              <CodeJwarForm
                wrappedComponentRef={codeJwarFormRef}
                onSubmit={handleInstallApp}
                dispatch={dispatch}
                archInfo={archInfo}
                showSubmitBtn={false}
              />
            )}
            {currentFormType === 'yaml' && (
              <CodeYamlForm
                wrappedComponentRef={yamlFormRef}
                onSubmit={handleInstallApp}
                dispatch={dispatch}
                showSubmitBtn={false}
              />
            )}
            {currentFormType === 'helm' && (
              <HelmCmdForm
                wrappedComponentRef={helmFormRef}
                onSubmit={handleInstallApp}
                dispatch={dispatch}
                onRef={(ref) => setHelmChildRef(ref)}
                showSubmitBtn={false}
              />
            )}
            {currentFormType === 'third-party' && (
              <OuterCustomForm
                wrappedComponentRef={thirdPartyFormRef}
                onSubmit={handleInstallApp}
                dispatch={dispatch}
                showSubmitBtn={false}
              />
            )}
            {currentFormType === 'database' && (
              <DatabaseCreateForm
                wrappedComponentRef={databaseFormRef}
                onSubmit={handleInstallApp}
                dispatch={dispatch}
                showSubmitBtn={false}
                groupId={globalUtil.getAppID()}
              />
            )}
          </div>
        ) : (
          <>
            <div className={styles.subtitle}>
              选择具体的部署方式:
            </div>
            {(currentView === 'market' && loadingStores) ||
              (currentView === 'image' && loadingImageHubs) ||
              (currentView === 'code' && loadingEnterpriseInfo) ||
              (currentView === 'database' && loadingDatabaseInfo) ? (
              <div className={styles.loadingWrapper}>
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className={styles.menuList}>
                  {getCurrentItems().map((item) => (
                    <div
                      key={item.key}
                      className={styles.menuItem}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className={styles.menuIcon}>
                        {currentView == 'database' ?
                          <DatabaseIcon />
                          :
                          <Icon type={item.icon} />
                        }
                      </div>
                      <div className={styles.menuTitle}>{item.title}</div>
                      <Icon type="right" className={styles.arrowIcon} />
                    </div>
                  ))}
                </div>
                {getAddSectionConfig() && (
                  <div
                    className={styles.addPrivateRegistry}
                    onClick={currentView === 'image' ? handleOpenAddImageRegistry : handleOpenAddOauth}
                  >
                    <div className={styles.addIcon}>
                      <Icon type="plus" />
                    </div>
                    <div className={styles.addContent}>
                      <div className={styles.addTitle}>{getAddSectionConfig().title}</div>
                      <div className={styles.addDesc}>{getAddSectionConfig().desc}</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Modal>

      {showAddImageRegistry && (
        <AddOrEditImageRegistry
          loading={imageHubLoading}
          imageList={imageHubList}
          clusters={clusters}
          onOk={handleAddImageRegistry}
          onCancel={handleCloseAddImageRegistry}
        />
      )}

      {showAddOauth && (
        <OauthForm
          title="添加私有Git仓库"
          type="private"
          oauthInfo={false}
          onOk={handleCreatOauth}
          onCancel={handleCloseAddOauth}
        />
      )}

      {/* 插件弹窗 */}
      {pluginModalVisible && selectedPlugin && (
        <Modal
          title={
            <div className={styles.modalTitle}>
              <Icon
                type="arrow-left"
                className={styles.backIcon}
                onClick={handlePluginModalClose}
              />
              <Icon type="api" className={styles.titleIcon} />
              {selectedPlugin.display_name || selectedPlugin.alias || selectedPlugin.name || '插件'}
            </div>
          }
          visible={pluginModalVisible}
          onCancel={handlePluginModalClose}
          footer={null}
          width={1200}
          className={styles.pluginModal}
          style={{ top: 100 }}
          bodyStyle={{ padding: 0, height: '80vh', overflow: 'hidden' }}
        >
          <div className={styles.pluginContent}>
            {pluginLoading ? (
              <div className={styles.loadingContainer}>
                <Spin size="large" />
              </div>
            ) : pluginError ? (
              <div className={styles.errorContainer}>
                <h3>插件加载失败</h3>
                <p>{pluginErrInfo}</p>
                <Button onClick={() => importPlugin(selectedPlugin)}>重试</Button>
              </div>
            ) : (
              <RbdPluginsCom
                app={pluginApp}
                plugins={selectedPlugin}
                loading={pluginLoading}
                pluginLoading={pluginLoading}
                error={pluginError}
                errInfo={pluginErrInfo}
                isCom={true}
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default connect(({ global, teamControl }) => ({
  groups: global.groups,
  pluginsList: teamControl.pluginsList
}))(CreateComponentModal);
