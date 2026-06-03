import React from 'react';
import { Button, Icon, Tag } from 'antd';
import styles from './StructuredResultCard.less';
import structuredResultHelpers from './structuredResultHelpers';

const {
  getExecutedAction,
  getProposedActionLabel,
  getProposedToolAction,
  getSuggestedWorkflowActions,
  isStandaloneExecutedActionResult
} = structuredResultHelpers;

function buildBadges(structuredResult = {}) {
  const badges = [];
  const subflowData = structuredResult.subflowData || {};

  if (subflowData.runtimeState) {
    badges.push({
      key: 'runtime',
      color: subflowData.runtimeState === 'runtime_unhealthy' ? 'red' : 'green',
      label: subflowData.runtimeState,
    });
  }

  if (subflowData.deliveryState) {
    badges.push({
      key: 'delivery',
      color: subflowData.deliveryState === 'delivered-but-needs-manual-validation' ? 'orange' : 'green',
      label: subflowData.deliveryState,
    });
  }

  return badges;
}

function renderMetaRow(label, value) {
  if (!value && value !== 0) {
    return null;
  }

  return (
    <div className={styles.metaRow} key={label}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={styles.metaValue}>{String(value)}</span>
    </div>
  );
}

export default function StructuredResultCard(props) {
  const workflowState = props.workflowState || null;
  const structuredResult = props.structuredResult || null;

  if (!workflowState && !structuredResult) {
    return null;
  }

  if (!workflowState && isStandaloneExecutedActionResult(structuredResult || {})) {
    return null;
  }

  const badges = buildBadges(structuredResult || {});
  const subflowData = (structuredResult && structuredResult.subflowData) || {};
  const toolCalls = (structuredResult && structuredResult.tool_calls) || [];
  const proposedAction = getProposedToolAction(structuredResult || {});
  const executedAction = getExecutedAction(structuredResult || {});
  const suggestedActions = getSuggestedWorkflowActions(structuredResult || {});
  const proposedActionLabel = getProposedActionLabel(structuredResult || {});
  const onContinue = props.onContinue;
  const onSelectSuggestedAction = props.onSelectSuggestedAction;
  const sending = !!props.sending;
  const title = suggestedActions.length > 0 ? '后续建议' : '分析结果';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <Icon type="deployment-unit" className={styles.titleIcon} />
          <div>
            <div className={styles.title}>{title}</div>
          </div>
        </div>
        {badges.length > 0 ? (
          <div className={styles.badges}>
            {badges.map(item => (
              <Tag key={item.key} color={item.color} className={styles.badge}>
                {item.label}
              </Tag>
            ))}
          </div>
        ) : null}
      </div>

      {structuredResult && structuredResult.summary ? (
        <div className={styles.summary}>{structuredResult.summary}</div>
      ) : null}

      {proposedAction ? (
        <div className={styles.actionRow}>
          <div className={styles.actionMeta}>
            待执行动作：{proposedAction.toolName}
          </div>
          <Button
            size="small"
            type="primary"
            onClick={onContinue}
            loading={sending}
          >
            {proposedActionLabel}
          </Button>
        </div>
      ) : null}

      {suggestedActions.length > 0 ? (
        <div className={styles.suggestionSection}>
          <div className={styles.toolTitle}>推荐方案</div>
          <div className={styles.suggestionList}>
            {suggestedActions.map((item, index) => {
              const pendingAction = item.pendingAction || {};
              const optionKey = item.optionKey || String(index + 1);
              const label = item.label || `方案${optionKey}`;
              const description = item.description || '';
              const requiresApproval = pendingAction.requiresApproval === true;

              return (
                <div key={`${optionKey}-${index}`} className={styles.suggestionCard}>
                  <div className={styles.suggestionHeader}>
                    <div>
                      <div className={styles.suggestionTitle}>
                        方案 {optionKey} · {label}
                      </div>
                      {description ? (
                        <div className={styles.suggestionDescription}>{description}</div>
                      ) : null}
                    </div>
                    <div className={styles.suggestionActions}>
                      {item.recommended ? (
                        <Tag color="green" className={styles.badge}>
                          推荐
                        </Tag>
                      ) : null}
                      <Tag color={requiresApproval ? 'orange' : 'blue'} className={styles.badge}>
                        {requiresApproval ? '需审批' : '可直接执行'}
                      </Tag>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => onSelectSuggestedAction && onSelectSuggestedAction(item)}
                        loading={sending}
                      >
                        {requiresApproval ? '申请执行' : '执行方案'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {executedAction ? (
        <div className={styles.actionRow}>
          <div className={styles.actionMeta}>
            已执行动作：{executedAction.toolName}
          </div>
        </div>
      ) : null}

      <div className={styles.metaGrid}>
        {renderMetaRow('应用状态', subflowData.appStatus)}
        {renderMetaRow('组件数量', subflowData.componentCount)}
        {renderMetaRow('重点组件状态', subflowData.inspectedComponentStatus)}
        {renderMetaRow('组件名称', subflowData.componentName)}
        {renderMetaRow('模板 ID', subflowData.appModelId)}
        {renderMetaRow('版本数量', subflowData.versionCount)}
        {renderMetaRow('当前版本', subflowData.currentVersion)}
        {renderMetaRow('快照数量', subflowData.snapshotCount)}
        {renderMetaRow('新快照版本', subflowData.snapshotVersion)}
        {renderMetaRow('安装后应用', subflowData.installedAppName)}
        {renderMetaRow('新增服务数', subflowData.installedServiceCount)}
        {renderMetaRow('日志行数', subflowData.logLineCount)}
        {renderMetaRow('阻塞提示', subflowData.blockerHint)}
      </div>

      {toolCalls.length > 0 ? (
        <div className={styles.toolSection}>
          <div className={styles.toolTitle}>已执行工具</div>
          <div className={styles.toolList}>
            {toolCalls.map((item, index) => (
              <span key={`${item.name || 'tool'}-${index}`} className={styles.toolItem}>
                {item.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
