import React, { PureComponent } from 'react';
import { Upload, Button, Icon } from 'antd';
import { formatMessage } from '@/utils/intl';
import styles from '../index.less';

class YamlModalHeader extends PureComponent {
  render() {
    const { mode, onUpload } = this.props;

    return (
      <div className={styles.yamlModalHeader}>
        <div className={styles.yamlModalHeaderMain}>
          <span className={styles.yamlModalHeaderIcon}>
            <Icon type="code" />
          </span>
          <div className={styles.yamlModalHeaderCopy}>
            <div className={styles.yamlModalHeaderTitle}>
              {mode === 'edit'
                ? formatMessage({ id: 'resourceCenter.yaml.modalTitle.edit', defaultMessage: '编辑 YAML' })
                : formatMessage({ id: 'resourceCenter.yaml.modalTitle.create', defaultMessage: '创建资源 YAML' })}
            </div>
            <div className={styles.yamlModalHeaderHint}>
              {mode === 'edit'
                ? formatMessage({ id: 'resourceCenter.yaml.header.editHint', defaultMessage: '直接修改当前资源定义并保存' })
                : formatMessage({ id: 'resourceCenter.yaml.header.createHint', defaultMessage: '粘贴或导入 Kubernetes YAML 后继续编辑' })}
            </div>
          </div>
        </div>
        {mode === 'create' && (
          <Upload showUploadList={false} beforeUpload={onUpload} accept=".yaml,.yml">
            <Button className={styles.yamlUploadTrigger} icon="upload">{formatMessage({ id: 'resourceCenter.yaml.import', defaultMessage: '导入文件' })}</Button>
          </Upload>
        )}
      </div>
    );
  }
}

export default YamlModalHeader;
