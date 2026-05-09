import { Empty, Input, Popconfirm, Tooltip, Button, List, Tag } from 'antd';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
const { isVMAssetSelectable } = require('../ImageVirtualMachineForm/assetReadiness');
import styles from './index.less';

class VMAssetCatalogModal extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      keyword: '',
      deleteLoadingId: null
    };
  }

  getSourceLabel = sourceType => {
    const sourceMap = {
      public: 'Vm.createVm.public',
      url: 'Vm.createVm.add',
      upload: 'Vm.createVm.upload',
      existing: 'Vm.createVm.have',
      clone: 'Vm.createVm.clone',
      vm_export: 'Vm.export.sourceLabel'
    };
    return formatMessage({ id: sourceMap[sourceType] || 'Vm.assetCatalog.sourceUnknown' });
  };

  handleDelete = async asset => {
    const { onDelete } = this.props;
    if (!onDelete) {
      return;
    }
    this.setState({ deleteLoadingId: asset.id });
    try {
      await onDelete(asset);
    } finally {
      this.setState({ deleteLoadingId: null });
    }
  };

  getFilteredAssets = () => {
    const { assets = [] } = this.props;
    const { keyword } = this.state;
    if (!keyword) {
      return assets;
    }
    const lowerKeyword = keyword.toLowerCase();
    return assets.filter(item => {
      return [item.display_name, item.name, item.source_type, item.arch, item.format, item.status]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().indexOf(lowerKeyword) > -1);
    });
  };

  render() {
    const { assets = [], onUseAsset } = this.props;
    const { keyword, deleteLoadingId } = this.state;
    const filteredAssets = this.getFilteredAssets();
      const renderAssetItem = asset => {
        const canUse = isVMAssetSelectable(asset);
        const displayName = asset.display_name || asset.name || '-';
        const metaItems = [
          {
            label: formatMessage({ id: 'Vm.assetCatalog.source' }),
            value: this.getSourceLabel(asset.source_type)
        },
        {
          label: formatMessage({ id: 'Vm.assetCatalog.status' }),
          value: asset.status || formatMessage({ id: 'Vm.assetCatalog.statusUnknown' })
        },
        {
          label: formatMessage({ id: 'Vm.assetCatalog.references' }),
          value: asset.reference_count || 0
        },
        {
          label: formatMessage({ id: 'Vm.assetCatalog.createdAt' }),
          value: asset.create_time || '-'
        }
      ];

        return (
          <List.Item key={asset.id || asset.name} className={styles.assetItem}>
            <div className={styles.assetMain}>
              <div className={styles.assetNameWrap}>
                <Tooltip title={displayName}>
                  <span className={styles.nameText}>{displayName}</span>
                </Tooltip>
              </div>
            <div className={styles.assetMetaGrid}>
              {metaItems.map(item => (
                <div key={item.label} className={styles.assetMetaItem}>
                  <div className={styles.assetMetaLabel}>{item.label}:</div>
                  <div className={styles.assetMetaValue} title={String(item.value)}>
                    {item.label === formatMessage({ id: 'Vm.assetCatalog.status' }) ? (
                      <Tag color={canUse ? 'green' : 'orange'}>
                        {item.value}
                      </Tag>
                    ) : (
                      item.value
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.actionCell}>
            <Tooltip
              title={canUse ? '' : formatMessage({ id: 'Vm.assetCatalog.useDisabled' })}
            >
              <Button
                type="primary"
                size="small"
                className={styles.actionButton}
                disabled={!canUse}
                onClick={() => onUseAsset && onUseAsset(asset)}
              >
                {formatMessage({ id: 'Vm.assetCatalog.useAsset' })}
              </Button>
            </Tooltip>
            <Popconfirm
              title={formatMessage({ id: 'Vm.assetCatalog.deleteConfirm' })}
              onConfirm={() => this.handleDelete(asset)}
              okText={formatMessage({ id: 'button.confirm' })}
              cancelText={formatMessage({ id: 'button.cancel' })}
              disabled={asset.reference_count > 0}
            >
              <Tooltip
                title={
                  asset.reference_count > 0
                    ? formatMessage({ id: 'Vm.assetCatalog.deleteDisabled' })
                    : ''
                }
              >
                <Button
                  size="small"
                  className={styles.actionButton}
                  disabled={asset.reference_count > 0 || deleteLoadingId === asset.id}
                >
                  {formatMessage({ id: 'Vm.assetCatalog.delete' })}
                </Button>
              </Tooltip>
            </Popconfirm>
          </div>
        </List.Item>
      );
    };

    return (
      <Fragment>
        <div className={styles.catalogSurface}>
          <div className={styles.toolbar}>
            <Input.Search
              placeholder={formatMessage({ id: 'Vm.assetCatalog.searchPlaceholder' })}
              className={styles.searchInput}
              value={keyword}
              onChange={e => this.setState({ keyword: e.target.value })}
            />
          </div>
          <div className={styles.listWrap}>
            <List
              dataSource={filteredAssets}
              renderItem={renderAssetItem}
              locale={{
                emptyText: (
                  <div className={styles.emptyWrap}>
                    <Empty description={formatMessage({ id: 'Vm.assetCatalog.empty' })} />
                  </div>
                )
              }}
            />
          </div>
        </div>
      </Fragment>
    );
  }
}

export default VMAssetCatalogModal;
