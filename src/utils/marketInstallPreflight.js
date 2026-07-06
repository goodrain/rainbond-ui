import React from 'react';
import { Modal } from 'antd';

export function getMarketInstallPreflightBean(response) {
  if (!response) {
    return {};
  }
  if (response.bean) {
    return response.bean;
  }
  if (response.data && response.data.bean) {
    return response.data.bean;
  }
  if (response.response_data && response.response_data.data && response.response_data.data.bean) {
    return response.response_data.data.bean;
  }
  return {};
}

function getPreflightMessages(preflight) {
  const checks = preflight && Array.isArray(preflight.checks) ? preflight.checks : [];
  const messages = checks
    .filter(item => item && (item.status === 'block' || item.status === 'warning') && item.message)
    .map(item => item.message);
  if (messages.length > 0) {
    return messages.slice(0, 4);
  }
  return preflight && preflight.summary ? [preflight.summary] : [];
}

function renderPreflightContent(preflight) {
  const messages = getPreflightMessages(preflight);
  return (
    <div>
      {preflight && preflight.summary && <p>{preflight.summary}</p>}
      {messages.length > 0 && (
        <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
          {messages.map((message, index) => (
            <li key={`${message}-${index}`}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function confirmMarketInstallPreflight(preflight, { onPass, onCancel } = {}) {
  const safePreflight = preflight || {};
  if (safePreflight.should_block) {
    Modal.error({
      title: '暂不能安装',
      content: renderPreflightContent(safePreflight),
      okText: '我知道了',
      onOk: onCancel
    });
    return;
  }
  if (safePreflight.status === 'warning') {
    Modal.confirm({
      title: '安装前检测未完全通过',
      content: renderPreflightContent(safePreflight),
      okText: '继续安装',
      cancelText: '取消',
      onOk: onPass,
      onCancel
    });
    return;
  }
  if (onPass) {
    onPass();
  }
}

export function runMarketInstallPreflight({ dispatch, payload, onPass, onCancel, onError }) {
  dispatch({
    type: 'createApp/preflightInstallApp',
    payload,
    callback: response => {
      confirmMarketInstallPreflight(getMarketInstallPreflightBean(response), {
        onPass,
        onCancel
      });
    },
    handleError: onError
  });
}
