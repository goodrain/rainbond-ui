import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Icon, Form } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import globalUtil from '../../utils/global';
import PluginUtil from '../../utils/pulginUtils';
import { pinyin } from 'pinyin-pro';
import AppMarketContent from '../AppMarketContent';
import roleUtil from '../../utils/newRole';
import appIcon from '../../../public/images/app_icon.jpg';
import styles from './index.less';

const MarketModal = ({ visible, onCancel, dispatch, currentEnterprise, store, groups, pluginsList, form, initialApp }) => {
  const [apps, setApps] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentView, setCurrentView] = useState(initialApp ? 'install' : 'list'); // 'list' or 'install'
  const [selectedApp, setSelectedApp] = useState(initialApp || null);
  const [addAppLoading, setAddAppLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [currentVersionInfo, setCurrentVersionInfo] = useState({});
  const [installType, setInstallType] = useState('new');
  const [cpuPrice, setCpuPrice] = useState(0);
  const [memoryPrice, setMemoryPrice] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (visible && store) {
      // 如果提供了 initialApp，直接跳转到安装页面
      if (initialApp) {
        const versions = initialApp?.versions || initialApp?.versions_info || [];
        const initialVersion = versions.length > 0 ? (versions[0].app_version || versions[0].version) : '';
        const initialVersionInfo = versions.length > 0 ? versions[0] : {};

        setCurrentView('install');
        setSelectedApp(initialApp);
        setSelectedVersion(initialVersion);
        setCurrentVersionInfo(initialVersionInfo);
        setInstallType('new');

        // 设置表单初始值
        if (form) {
          setTimeout(() => {
            form.setFieldsValue({
              group_version: initialVersion,
              install_type: 'new',
              group_name: initialApp.app_name || initialApp.name || ''
            });
          }, 0);
        }
      } else {
        // 重置状态并获取应用列表
        setApps([]);
        setSearchValue('');
        setPage(1);
        setHasMore(true);
        setCurrentView('list');
        setSelectedApp(null);
        fetchApps(store.name, 1, '', true);
      }

      // 如果安装了计费插件，获取价格信息
      if (PluginUtil.isInstallPlugin(pluginsList, 'rainbond-bill')) {
        fetchPrices();
      }
    }
  }, [visible, store, pluginsList, initialApp]);

  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = listElement;
      // 当滚动到底部附近时加载更多
      if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loadingMore && !loading) {
        loadMore();
      }
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => {
      listElement.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, loadingMore, loading, page, searchValue]);

  const fetchApps = (storeName, pageNum = 1, query = '', isReset = false) => {
    if (isReset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    dispatch({
      type: 'market/fetchMarkets',
      payload: {
        name: storeName,
        enterprise_id: currentEnterprise.enterprise_id,
        query,
        pageSize: 9,
        page: pageNum
      },
      callback: data => {
        if (data) {
          const newApps = data.list || [];
          const totalCount = data.total || 0;

          if (isReset) {
            setApps(newApps);
          } else {
            setApps(prev => [...prev, ...newApps]);
          }

          setTotal(totalCount);
          setHasMore(apps.length + newApps.length < totalCount);
        }
        setLoading(false);
        setLoadingMore(false);
      }
    });
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || !store) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchApps(store.name, nextPage, searchValue, false);
  };

  const handleSearch = (value) => {
    if (store) {
      setPage(1);
      setHasMore(true);
      fetchApps(store.name, 1, value, true);
    }
  };

  const fetchPrices = () => {
    dispatch({
      type: 'global/getPricingConfig',
      payload: {
        region_name: globalUtil.getCurrRegionName() || ''
      },
      callback: (res) => {
        if (res.status_code === 200) {
          setCpuPrice(res.response_data?.cpu_price_per_core / 1000000 || 0);
          setMemoryPrice(res.response_data?.memory_price_per_gb / 1000000 || 0);
        }
      }
    });
  };

  const generateEnglishName = (name) => {
    if (name) {
      const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
      const cleanedPinyinName = pinyinName.toLowerCase();
      return cleanedPinyinName;
    }
    return '';
  };

  const handleInstall = (app) => {
    const versions = app?.versions || app?.versions_info || [];
    const initialVersion = versions.length > 0 ? (versions[0].app_version || versions[0].version) : '';
    const initialVersionInfo = versions.length > 0 ? versions[0] : {};

    setSelectedApp(app);
    setSelectedVersion(initialVersion);
    setCurrentVersionInfo(initialVersionInfo);
    setCurrentView('install');
    setInstallType('new');

    // 设置表单初始值
    if (form) {
      form.setFieldsValue({
        group_version: initialVersion,
        install_type: 'new',
        group_name: app.app_name || app.name || ''
      });
    }
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedApp(null);
    setAddAppLoading(false);
  };

  const handleChangeVersion = (value) => {
    const versions = selectedApp?.versions || selectedApp?.versions_info || [];
    const versionInfo = versions.find(v => (v.app_version || v.version) === value) || {};
    setSelectedVersion(value);
    setCurrentVersionInfo(versionInfo);
  };

  const handleSubmitInstall = (e) => {
    e.preventDefault();
    form.validateFields((err, vals) => {
      if (!err) {
        setAddAppLoading(true);
        const teamName = globalUtil.getCurrTeamName();
        const regionName = globalUtil.getCurrRegionName();
        const group_id = globalUtil.getAppID();

        const installApp = (finalGroupId, isNewApp = false) => {
          console.log(finalGroupId, isNewApp)
          dispatch({
            type: 'createApp/installApp',
            payload: {
              team_name: teamName,
              ...vals,
              group_id: finalGroupId,
              app_id: selectedApp.app_id,
              is_deploy: true,
              group_key: selectedApp.group_key || selectedApp.ID,
              app_version: vals.group_version,
              marketName: store.name,
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
              setAddAppLoading(false);
              onCancel();
            },
            handleError: () => {
              setAddAppLoading(false);
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
              roleUtil.refreshPermissionsInfo()
              if (res && res.group_id) {
                installApp(res.group_id, true);
              } else {
                setAddAppLoading(false);
              }
            },
            handleError: () => {
              setAddAppLoading(false);
            }
          });
        } else if (vals.install_type === 'existing' && vals.group_id) {
          // 安装到已有应用
          installApp(vals.group_id, true);
        } else {
          setAddAppLoading(false);
        }
      }
    });
  };
  const group_id = globalUtil.getAppID();
  const isLocal = selectedApp?.source === 'local';
  const showSaaSPrice = PluginUtil.isInstallPlugin(pluginsList, 'rainbond-bill');

  return (
    <Modal
      title={
        currentView === 'list' ? (
          <div className={styles.modalTitle}>
            <Icon type="shop" className={styles.titleIcon} />
            {store?.alias || store?.name || '应用市场'}
          </div>
        ) : (
          <div className={styles.modalTitle}>
            <Icon type="arrow-left" className={styles.backIcon} onClick={handleBack} style={{ cursor: 'pointer', marginRight: 8 }} />
            安装应用
          </div>
        )
      }
      visible={visible}
      onCancel={onCancel}
      footer={
        currentView === 'install' ? (
          showSaaSPrice && !isLocal ? (
            <div className={styles.priceFooter}>
              <div className={styles.priceInfo}>
                <span className={styles.priceLabel}>
                  预估(每天)
                  <span className={styles.priceValue}>
                    ¥{(
                      ((currentVersionInfo?.cpu || 0) / 1000 * cpuPrice * 24) +
                      ((currentVersionInfo?.memory || 0) / 1024 * memoryPrice * 24)
                    ).toFixed(2)}
                  </span>
                </span>
              </div>
              <div className={styles.actionButtons}>
                <Button onClick={handleBack}>返回</Button>
                <Button onClick={handleSubmitInstall} type="primary" loading={addAppLoading}>
                  安装
                </Button>
              </div>
            </div>
          ) : (
            [
              <Button key="back" onClick={handleBack}>返回</Button>,
              <Button key="install" onClick={handleSubmitInstall} type="primary" loading={addAppLoading}>
                安装
              </Button>
            ]
          )
        ) : null
      }
      width={currentView === 'install' ? 500 : 800}
      centered
      className={styles.marketModal}
    >
      <AppMarketContent
        currentView={currentView}
        apps={apps}
        loading={loading}
        loadingMore={loadingMore}
        searchValue={searchValue}
        onSearchChange={(e) => setSearchValue(e.target.value)}
        onSearch={handleSearch}
        listRef={listRef}
        onInstall={handleInstall}
        selectedApp={selectedApp}
        form={form}
        groups={groups}
        onChangeVersion={handleChangeVersion}
        installType={installType}
        onInstallTypeChange={(e) => setInstallType(e.target.value)}
        showResourceInfo={!isLocal}
        appIcon={appIcon}
        currentVersionInfo={currentVersionInfo}
      />
    </Modal>
  );
};

export default connect(({ global, enterprise, teamControl }) => ({
  currentEnterprise: enterprise.currentEnterprise,
  groups: global.groups,
  pluginsList: teamControl.pluginsList
}))(Form.create()(MarketModal));
