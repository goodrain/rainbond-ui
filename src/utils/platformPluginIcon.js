import React from 'react';
import global from './global';

const PLATFORM_PLUGIN_ICON_KEY_BY_NAME = {
  'rainbond-observability': 'observation',
  'rainbond-enterprise-base': 'basics',
  'rainbond-enterprise-alarm': 'alert',
  'rainbond-gpu': 'gpu',
  pipeline: 'pipeline',
  'rainbond-pipeline': 'pipeline',
  'rainbond-enterprise-logs': 'logs',
  'rainbond-recovery': 'security',
  'rainbond-bill': 'bill',
  'rainbond-sourcescan': 'scan',
  'rainbond-source-scan': 'scan',
  'source-scan': 'scan'
};

function getPlatformPluginName(plugin = {}) {
  return plugin.name || plugin.plugin_id || plugin.plugin_name || '';
}

export function getPlatformPluginIconKey(plugin = {}) {
  return plugin.icon || PLATFORM_PLUGIN_ICON_KEY_BY_NAME[getPlatformPluginName(plugin)];
}

function renderDefaultPluginIcon(size, color) {
  return (
    <svg
      className="icon"
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
    >
      <path
        d="M512.45099 1024L64.997835 767.475541 64.383834 255.475541 511.222988 0l447.453156 256.524459 0.614001 512-446.839155 255.475541z m401.454255-745.192425l-402.682257-234.266926L109.154733 277.758657l0.614001 467.433768 402.682256 234.266926 402.068256-233.218008-0.614001-467.433768z"
        fill={color}
      />
      <path
        d="M491.063292 511.232499h44.770899v356.632189h-44.770899z"
        fill={color}
      />
      <path
        d="M524.424008 530.599111l-22.38545-38.579724 310.198371-178.213761 22.38545 38.579724z"
        fill={color}
      />
      <path
        d="M524.424008 492.019387l-22.38545 38.579724-310.172788-178.213761 22.38545-38.579724z"
        fill={color}
      />
    </svg>
  );
}

export function renderPlatformPluginIcon(plugin = {}, options = {}) {
  const {
    size = 44,
    color = global.getPublicColor(),
    fallback = true
  } = options;

  if (plugin.logo) {
    return <img src={plugin.logo} alt="" />;
  }

  const iconKey = getPlatformPluginIconKey(plugin);
  if (iconKey) {
    const iconNode = global.fetchSvg(iconKey, color, size);
    if (React.isValidElement(iconNode)) {
      return iconNode;
    }
  }

  return fallback ? renderDefaultPluginIcon(size, color) : null;
}
