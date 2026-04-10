import { Empty, Input, Modal, Popconfirm, Table, Tag, Tooltip } from 'antd';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import styles from './index.less';

class VMAssetCatalogModal extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      keyword: '',
      detailAsset: null,
      deleteLoadingId: null
    };
  }

  getSourceLabel = (sourceType) => {
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

  formatBytes = (size) => {
    const value = Number(size || 0);
    if (!value) {
      return '-';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let current = value;
    let unitIndex = 0;
    while (current >= 1024 && unitIndex < units.length - 1) {
      current /= 1024;
      unitIndex += 1;
    }
    return `${current.toFixed(current >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  handleDelete = async (asset) => {
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
      return [item.name, item.source_type, item.arch, item.format, item.status]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().indexOf(lowerKeyword) > -1);
    });
  };

  renderDetailLine = (label, value) => (
    <div style={{ display: 'flex', marginBottom: 12 }}>
      <div style={{ width: 120, color: '#8d9bad' }}>{label}</div>
      <div style={{ flex: 1, wordBreak: 'break-all' }}>{value === 0 ? '0' : value || '-'}</div>
    </div>
  );

  render() {
    const { visible, onCancel, onUseAsset, assets = [] } = this.props;
    const { keyword, detailAsset, deleteLoadingId } = this.state;
    const filteredAssets = this.getFilteredAssets();
    const columns = [
      {
        title: formatMessage({ id: 'Vm.assetCatalog.name' }),
        dataIndex: 'name',
        key: 'name',
        width: 160,
        render: value => (
          <span className={styles.nameText} title={value}>
            {value}
          </span>
        )
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.source' }),
        dataIndex: 'source_type',
        key: 'source_type',
        width: 110,
        render: value => <Tag color="blue">{this.getSourceLabel(value)}</Tag>
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.archFormat' }),
        key: 'arch_format',
        width: 130,
        render: (_, record) => (
          <span className={styles.textWrap}>
            {`${record.arch || '-'} / ${record.format || '-'}`}
          </span>
        )
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.size' }),
        dataIndex: 'size_bytes',
        key: 'size_bytes',
        width: 100,
        render: value => this.formatBytes(value)
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.status' }),
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: value => <Tag>{value || formatMessage({ id: 'Vm.assetCatalog.statusUnknown' })}</Tag>
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.diskCount' }),
        dataIndex: 'disk_count',
        key: 'disk_count',
        width: 90,
        render: value => value || '-'
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.references' }),
        dataIndex: 'reference_count',
        key: 'reference_count',
        width: 90,
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.createdAt' }),
        dataIndex: 'create_time',
        key: 'create_time',
        width: 160,
        render: value => <span className={styles.textWrap}>{value || '-'}</span>
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.actions' }),
        key: 'actions',
        width: 220,
        render: (_, record) => (
          <div className={styles.actionCell}>
            <Tooltip title={record.status !== 'ready' ? formatMessage({ id: 'Vm.assetCatalog.useDisabled' }) : ''}>
              <a
                className={styles.actionLink}
                style={{ color: record.status !== 'ready' ? '#bfbfbf' : undefined }}
                onClick={e => {
                  if (record.status !== 'ready') {
                    e.preventDefault();
                    return;
                  }
                  onUseAsset && onUseAsset(record);
                }}
              >
                {formatMessage({ id: 'Vm.assetCatalog.useAsset' })}
              </a>
            </Tooltip>
            <a className={styles.actionLink} onClick={() => this.setState({ detailAsset: record })}>
              {formatMessage({ id: 'Vm.assetCatalog.detail' })}
            </a>
            <Popconfirm
              title={formatMessage({ id: 'Vm.assetCatalog.deleteConfirm' })}
              onConfirm={() => this.handleDelete(record)}
              okText={formatMessage({ id: 'button.confirm' })}
              cancelText={formatMessage({ id: 'button.cancel' })}
              disabled={record.reference_count > 0}
            >
              <Tooltip
                title={record.reference_count > 0 ? formatMessage({ id: 'Vm.assetCatalog.deleteDisabled' }) : ''}
              >
                <a
                  className={styles.actionLink}
                  style={{ color: record.reference_count > 0 ? '#bfbfbf' : undefined }}
                  onClick={e => {
                    if (record.reference_count > 0 || deleteLoadingId === record.id) {
                      e.preventDefault();
                    }
                  }}
                >
                  {formatMessage({ id: 'Vm.assetCatalog.delete' })}
                </a>
              </Tooltip>
            </Popconfirm>
          </div>
        )
      }
    ];
    const tableScrollX = columns.reduce((total, column) => total + (Number(column.width) || 0), 0);

    return (
      <Fragment>
        <Modal
          title={formatMessage({ id: 'Vm.assetCatalog.title' })}
          visible={visible}
          width={1200}
          wrapClassName={styles.assetCatalogModal}
          bodyStyle={{ overflowX: 'hidden' }}
          footer={null}
          onCancel={onCancel}
          destroyOnClose
        >
          <div className={styles.toolbar}>
            <Input.Search
              placeholder={formatMessage({ id: 'Vm.assetCatalog.searchPlaceholder' })}
              style={{ width: 320 }}
              value={keyword}
              onChange={e => this.setState({ keyword: e.target.value })}
            />
          </div>
          <div className={styles.tableWrap}>
            <Table
              rowKey="id"
              dataSource={filteredAssets}
              columns={columns}
              tableLayout="fixed"
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              scroll={{ x: tableScrollX }}
              locale={{
                emptyText: <Empty description={formatMessage({ id: 'Vm.assetCatalog.empty' })} />
              }}
            />
          </div>
        </Modal>

        <Modal
          title={formatMessage({ id: 'Vm.assetCatalog.detailTitle' })}
          visible={!!detailAsset}
          footer={null}
          onCancel={() => this.setState({ detailAsset: null })}
          destroyOnClose
        >
          {detailAsset && (
            <div>
              {this.renderDetailLine(formatMessage({ id: 'Vm.assetCatalog.name' }), detailAsset.name)}
              {this.renderDetailLine(formatMessage({ id: 'Vm.assetCatalog.diskCount' }), detailAsset.disk_count)}
              {this.renderDetailLine(formatMessage({ id: 'Vm.assetCatalog.source' }),
                this.getSourceLabel(detailAsset.source_type))}
              {this.renderDetailLine(formatMessage({ id: 'Vm.assetCatalog.sourceUri' }), detailAsset.source_uri)}
              {this.renderDetailLine(formatMessage({ id: 'Vm.assetCatalog.status' }), detailAsset.status)}
              {this.renderDetailLine(formatMessage({ id: 'Vm.assetCatalog.archFormat' }),
                `${detailAsset.arch || '-'} / ${detailAsset.format || '-'}`)}
              {this.renderDetailLine(formatMessage({ id: 'Vm.assetCatalog.size' }),
                this.formatBytes(detailAsset.size_bytes))}
              {this.renderDetailLine(formatMessage({ id: 'Vm.assetCatalog.bootMode' }), detailAsset.boot_mode)}
              {this.renderDetailLine(formatMessage({ id: 'Vm.assetCatalog.references' }), detailAsset.reference_count)}
              {detailAsset.source_asset && this.renderDetailLine(
                formatMessage({ id: 'Vm.assetCatalog.sourceAsset' }),
                detailAsset.source_asset.name
              )}
            </div>
          )}
        </Modal>
      </Fragment>
    );
  }
}

export default VMAssetCatalogModal;
