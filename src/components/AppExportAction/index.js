import React from 'react';
import { Button, Modal } from 'antd';
import { formatMessage } from '@/utils/intl';

const downloadFile = downloadPath => {
  if (!downloadPath) {
    return;
  }
  let anchor = document.querySelector('#app-export-download-anchor');
  if (!anchor) {
    anchor = document.createElement('a');
    anchor.id = 'app-export-download-anchor';
    anchor.setAttribute('download', 'filename');
    document.body.appendChild(anchor);
  }
  anchor.href = downloadPath;
  if (document.all) {
    anchor.click();
    return;
  }
  const event = document.createEvent('MouseEvents');
  event.initEvent('click', true, true);
  anchor.dispatchEvent(event);
};

const AppExportAction = ({
  disabled = false,
  exportStatus = {},
  loading = false,
  onExport
}) => {
  const showExportConfirm = () => {
    if (disabled || !onExport) {
      return;
    }
    Modal.confirm({
      title: formatMessage({
        id: 'appVersion.export.confirm.title',
        defaultMessage: '导出快照版本'
      }),
      content: formatMessage({
        id: 'appVersion.export.confirm.desc',
        defaultMessage: '将把当前快照导出为 rainbond-app 安装包，是否继续？'
      }),
      okText: formatMessage({ id: 'button.confirm' }),
      cancelText: formatMessage({ id: 'button.cancel' }),
      onOk: () => onExport()
    });
  };

  const status = exportStatus && exportStatus.status;
  const hasSuccessExport = exportStatus && exportStatus.is_export_before && status === 'success';
  const isExporting = loading || status === 'exporting';
  const exportLabel = exportStatus && exportStatus.is_export_before
    ? formatMessage({ id: 'button.to_export' })
    : formatMessage({ id: 'button.export' });

  if (hasSuccessExport) {
    return (
      <>
        <Button
          size="small"
          type="primary"
          onClick={() => downloadFile(exportStatus.file_path)}
        >
          {formatMessage({ id: 'button.download' })}
        </Button>
        <Button size="small" onClick={showExportConfirm}>
          {formatMessage({ id: 'button.to_export' })}
        </Button>
      </>
    );
  }

  return (
    <Button
      size="small"
      type="primary"
      ghost={!isExporting}
      loading={loading}
      disabled={disabled || isExporting}
      onClick={showExportConfirm}
    >
      {isExporting
        ? formatMessage({
            id: 'appVersion.action.exporting',
            defaultMessage: '导出中'
          })
        : exportLabel}
    </Button>
  );
};

export default AppExportAction;
