import React from 'react';
import { Modal } from 'antd';
import preflightPresentation from './preflightPresentation';

const { getPreflightDisplay } = preflightPresentation;

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

function renderPreflightContent(preflight, copyType) {
  const display = getPreflightDisplay(preflight, { copyType });
  return (
    <div>
      {display.summary && <p>{display.summary}</p>}
      {display.messages.length > 0 && (
        <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: 0 }}>
          {display.messages.map((message, index) => (
            <li key={`${message}-${index}`}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function confirmMarketInstallPreflight(preflight, { onPass, onCancel, copy = {} } = {}) {
  const safePreflight = preflight || {};
  const modalCopy = {
    blockTitle: '暂不能安装',
    warningTitle: '部分检测无法确认',
    continueText: '仍然继续安装',
    copyType: 'install',
    ...copy
  };
  if (safePreflight.should_block) {
    Modal.error({
      title: modalCopy.blockTitle,
      content: renderPreflightContent(safePreflight, modalCopy.copyType),
      okText: '我知道了',
      onOk: onCancel
    });
    return;
  }
  if (safePreflight.status === 'warning') {
    Modal.confirm({
      title: modalCopy.warningTitle,
      content: renderPreflightContent(safePreflight, modalCopy.copyType),
      okText: modalCopy.continueText,
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
        onCancel,
        copy: {
          blockTitle: '暂不能部署',
          warningTitle: '部分检测无法确认',
          continueText: '仍然继续部署'
        }
      });
    },
    handleError: onError
  });
}

export function runDeployPreflight({ dispatch, payload, onPass, onCancel, onError }) {
  dispatch({
    type: 'createApp/preflightDeploy',
    payload,
    callback: response => {
      confirmMarketInstallPreflight(getMarketInstallPreflightBean(response), {
        onPass,
        onCancel,
        copy: {
          blockTitle: '暂不能部署',
          warningTitle: '部分检测无法确认',
          continueText: '仍然继续部署',
          copyType: 'deploy'
        }
      });
    },
    handleError: onError
  });
}
