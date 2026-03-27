import { Alert, Button, Icon, Input, Modal, Select, Spin, Tabs } from 'antd';
import React from 'react';
import { formatMessage } from '@/utils/intl';
import styles from './DependencyConfigModal.less';

const { Option } = Select;
const { TabPane } = Tabs;

function findEnvBySuffix(envs, suffixes) {
  return envs.find(env => {
    const attrName = env.attr_name || '';
    return suffixes.some(suffix => attrName.endsWith(suffix));
  });
}

function buildCodeExamples(envs) {
  const hostEnv = findEnvBySuffix(envs, ['_HOST']);
  const portEnv = findEnvBySuffix(envs, ['_PORT']);
  const userEnv = findEnvBySuffix(envs, ['_USER', '_USERNAME']);
  const passwordEnv = findEnvBySuffix(envs, ['_PASSWORD', '_PASS']);
  const nameEnv = findEnvBySuffix(envs, ['_NAME', '_DATABASE']);

  if (!envs.length) {
    return {
      java: '// No environment variables available',
      python: '# No environment variables available',
      nodejs: '// No environment variables available',
      go: '// No environment variables available'
    };
  }

  const javaLines = [
    '// Java',
    `String host = System.getenv("${hostEnv ? hostEnv.attr_name : ''}");`,
    `String port = System.getenv("${portEnv ? portEnv.attr_name : ''}");`
  ];
  if (userEnv) {
    javaLines.push(`String username = System.getenv("${userEnv.attr_name}");`);
  }
  if (passwordEnv) {
    javaLines.push(`String password = System.getenv("${passwordEnv.attr_name}");`);
  }
  if (nameEnv) {
    javaLines.push(`String database = System.getenv("${nameEnv.attr_name}");`);
  }

  const pythonLines = [
    '# Python',
    'import os',
    '',
    `host = os.getenv("${hostEnv ? hostEnv.attr_name : ''}")`,
    `port = os.getenv("${portEnv ? portEnv.attr_name : ''}")`
  ];
  if (userEnv) {
    pythonLines.push(`username = os.getenv("${userEnv.attr_name}")`);
  }
  if (passwordEnv) {
    pythonLines.push(`password = os.getenv("${passwordEnv.attr_name}")`);
  }
  if (nameEnv) {
    pythonLines.push(`database = os.getenv("${nameEnv.attr_name}")`);
  }

  const nodejsLines = [
    '// Node.js',
    `const host = process.env.${hostEnv ? hostEnv.attr_name : ''};`,
    `const port = process.env.${portEnv ? portEnv.attr_name : ''};`
  ];
  if (userEnv) {
    nodejsLines.push(`const username = process.env.${userEnv.attr_name};`);
  }
  if (passwordEnv) {
    nodejsLines.push(`const password = process.env.${passwordEnv.attr_name};`);
  }
  if (nameEnv) {
    nodejsLines.push(`const database = process.env.${nameEnv.attr_name};`);
  }

  const goLines = [
    '// Go',
    'import "os"',
    '',
    `host := os.Getenv("${hostEnv ? hostEnv.attr_name : ''}")`,
    `port := os.Getenv("${portEnv ? portEnv.attr_name : ''}")`
  ];
  if (userEnv) {
    goLines.push(`username := os.Getenv("${userEnv.attr_name}")`);
  }
  if (passwordEnv) {
    goLines.push(`password := os.Getenv("${passwordEnv.attr_name}")`);
  }
  if (nameEnv) {
    goLines.push(`database := os.Getenv("${nameEnv.attr_name}")`);
  }

  return {
    java: javaLines.join('\n'),
    python: pythonLines.join('\n'),
    nodejs: nodejsLines.join('\n'),
    go: goLines.join('\n')
  };
}

export default function DependencyConfigModal({
  visible,
  loading,
  submitting,
  sourceName,
  targetName,
  ports,
  selectedPortKey,
  selectedPort,
  aliasValue,
  envs,
  activeLanguage,
  shouldUpdateService,
  canSubmit,
  onClose,
  onPortChange,
  onAliasChange,
  onLanguageChange,
  onCancelAction,
  onSubmit
}) {
  const codeExamples = buildCodeExamples(envs);
  const footer = [
    <Button key="cancel" onClick={onCancelAction}>
      {formatMessage({ id: 'topology.dependency_config.cancel' })}
    </Button>,
    <Button
      key="submit"
      type="primary"
      loading={submitting}
      disabled={!canSubmit}
      onClick={onSubmit}
    >
      {formatMessage({
        id: shouldUpdateService
          ? 'topology.dependency_config.submit_update'
          : 'topology.dependency_config.submit_save'
      })}
    </Button>
  ];

  return (
    <Modal
      visible={visible}
      width={800}
      title={null}
      footer={footer}
      onCancel={onClose}
      maskClosable={false}
      className={styles.dependencyConfigModal}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon}>
            <Icon type="share-alt" />
          </span>
          <span className={styles.titleText}>
            {formatMessage({ id: 'topology.dependency_config.title' })}
          </span>
        </div>
        <div className={styles.pathRow}>
          <span>{sourceName}</span>
          <Icon type="arrow-right" className={styles.pathArrow} />
          <span>{targetName}</span>
        </div>
        <div className={styles.summary}>
          {formatMessage(
            { id: 'topology.dependency_config.summary' },
            {
              source: sourceName,
              target: targetName
            }
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingWrapper}>
          <Spin />
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.aliasCard}>
            <div className={styles.aliasTitle}>
              {formatMessage({ id: 'topology.dependency_config.alias_title' })}
            </div>
            <div className={styles.aliasDesc}>
              {formatMessage({ id: 'topology.dependency_config.alias_desc' })}
            </div>
            <div className={styles.aliasForm}>
              <div className={styles.portField}>
                <div className={styles.fieldLabel}>
                  {formatMessage({ id: 'topology.dependency_config.port_label' })}
                </div>
                <Select
                  value={selectedPortKey || undefined}
                  onChange={onPortChange}
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder={formatMessage({ id: 'topology.dependency_config.port_placeholder' })}
                  disabled={ports.length <= 1}
                >
                  {ports.map(port => (
                    <Option key={port.container_port} value={`${port.container_port}`}>
                      {formatMessage(
                        { id: 'topology.dependency_config.port_option' },
                        {
                          port: port.container_port,
                          protocol: (port.protocol || '').toUpperCase()
                        }
                      )}
                    </Option>
                  ))}
                </Select>
              </div>
              <div className={styles.aliasField}>
                <div className={styles.fieldLabel}>
                  {formatMessage({ id: 'topology.dependency_config.alias_input_label' })}
                </div>
                <Input
                  value={aliasValue}
                  onChange={onAliasChange}
                  placeholder={formatMessage({ id: 'topology.dependency_config.alias_placeholder' })}
                  disabled={!selectedPort}
                />
                <div className={styles.aliasHint}>
                  {formatMessage({ id: 'topology.dependency_config.alias_hint' })}
                </div>
              </div>
            </div>
            {!ports.length && (
              <div className={styles.emptyTip}>
                {formatMessage({ id: 'topology.dependency_config.empty_ports' })}
              </div>
            )}
          </div>

          <div className={styles.panelGrid}>
            <div className={styles.previewPanel}>
              <div className={styles.panelTitleRow}>
                <div className={styles.panelTitle}>
                  <Icon type="check-circle" className={styles.successIcon} />
                  <span>{formatMessage({ id: 'topology.dependency_config.env_title' })}</span>
                </div>
                <div className={styles.panelExtra}>
                  {formatMessage({
                    id: shouldUpdateService
                      ? 'topology.dependency_config.effect_update'
                      : 'topology.dependency_config.effect_restart'
                  })}
                </div>
              </div>

              {envs.length ? (
                <div className={styles.envBlock}>
                  {envs.map(env => (
                    <div key={`${env.attr_name}-${env.attr_value}`} className={styles.envLine}>
                      <span className={styles.envName}>{env.attr_name}</span>
                      <span className={styles.envSplit}>=</span>
                      <span className={styles.envValue}>{env.attr_value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyEnv}>
                  {formatMessage({ id: 'topology.dependency_config.empty_envs' })}
                </div>
              )}

              <Alert
                type="warning"
                showIcon
                className={styles.notice}
                message={formatMessage({ id: 'topology.dependency_config.notice_title' })}
                description={formatMessage({ id: 'topology.dependency_config.notice_desc' })}
              />
            </div>

            <div className={styles.codePanel}>
              <div className={styles.panelTitle}>
                <Icon type="code" className={styles.codeIcon} />
                <span>{formatMessage({ id: 'topology.dependency_config.usage_title' })}</span>
              </div>
              <Tabs activeKey={activeLanguage} onChange={onLanguageChange}>
                <TabPane tab="Java" key="java" />
                <TabPane tab="Python" key="python" />
                <TabPane tab="Node.js" key="nodejs" />
                <TabPane tab="Go" key="go" />
              </Tabs>
              <div className={styles.codeBlock}>
                <pre>{codeExamples[activeLanguage] || codeExamples.java}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
