import React from 'react';
import { Icon } from 'antd';

// 源码构建图标
export const CodeIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor">
      <path d="M375.872 810.688a46.016 46.016 0 0 1-32.832-13.504L56.768 522.88c-18.816-17.92-18.816-46.464 0-62.912l286.272-275.84c18.752-17.92 48.512-17.92 65.728 0 18.752 17.984 18.752 46.464 0 62.976l-253.44 242.816 253.44 242.816c18.752 17.92 18.752 46.464 0 62.912a39.936 39.936 0 0 1-32.896 15.04zM648.128 810.688a46.016 46.016 0 0 1-32.896-13.504c-18.752-17.984-18.752-46.464 0-62.976l253.44-242.816L613.76 247.104c-18.752-17.984-18.752-46.464 0-62.976 18.752-17.92 48.512-17.92 65.728 0l286.272 275.84c18.752 17.92 18.752 46.464 0 62.912l-284.736 274.304a48.768 48.768 0 0 1-32.832 13.44z" />
    </svg>
  )} />
);

// 示例图标（灯泡）
export const ExampleIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
    </svg>
  )} />
);

// 数据库图标
export const DatabaseIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor">
      <path d="M928 204.8v614.4h-64V601.728q-28.928 17.28-70.4 31.168-117.376 39.104-281.6 39.104-164.224 0-281.6-39.104-41.472-13.824-70.4-31.168V819.2h-64V204.8q0-76.096 134.4-120.896Q347.712 44.8 512 44.8q164.224 0 281.6 39.104 134.4 44.8 134.4 120.896z m-768 90.112V512q0 10.496 17.984 24.704 24.768 19.52 72.576 35.456Q358.08 608 512 608q153.856 0 261.44-35.84 47.808-16 72.576-35.456 17.984-14.208 17.984-24.704V294.912q-28.736 16.896-70.4 30.72Q676.288 364.8 512 364.8q-164.224 0-281.6-39.104-41.664-13.888-70.4-30.784z m688.448-112.768q-24.64-20.672-75.008-37.504Q665.92 108.8 512 108.8q-153.856 0-261.44 35.84-50.368 16.832-75.008 37.504-15.552 13.12-15.552 22.656t15.552 22.656q24.64 20.672 75.008 37.504Q358.08 300.8 512 300.8q153.856 0 261.44-35.84 50.368-16.832 75.008-37.504 15.552-13.12 15.552-22.656t-15.552-22.656zM160 819.2q0 10.496 17.984 24.704 24.768 19.52 72.576 35.456 107.52 35.84 261.44 35.84 153.856 0 261.44-35.84 47.808-16 72.576-35.456 17.984-14.208 17.984-24.704h64q0 41.6-42.368 74.944-33.536 26.432-91.968 45.952Q676.224 979.2 512 979.2t-281.6-39.104q-58.496-19.52-92.032-45.952Q96 860.8 96 819.2h64z" />
    </svg>
  )} />
);

// 应用市场/商店图标
export const StoreIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/>
      <path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/>
      <path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/>
    </svg>
  )} />
);

// 本地组件库图标
export const FolderOpenIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>
    </svg>
  )} />
);

// 离线导入/上传图标
export const UploadIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12"/>
      <path d="m17 8-5-5-5 5"/>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    </svg>
  )} />
);

// 容器/镜像图标
export const ContainerIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z"/>
      <path d="M10 21.9V14L2.1 9.1"/>
      <path d="m10 14 11.9-6.9"/>
      <path d="M14 19.8v-8.1"/>
      <path d="M18 17.5V9.4"/>
    </svg>
  )} />
);

// 软件包图标
export const PackageIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/>
      <path d="M12 22V12"/>
      <polyline points="3.29 7 12 12 20.71 7"/>
      <path d="m7.5 4.27 9 5.15"/>
    </svg>
  )} />
);

// Yaml 文件图标
export const FileTextIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
      <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
      <path d="M10 9H8"/>
      <path d="M16 13H8"/>
      <path d="M16 17H8"/>
    </svg>
  )} />
);

// Helm 图标（船）
export const ShipIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10.189V14"/>
      <path d="M12 2v3"/>
      <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
      <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76"/>
      <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    </svg>
  )} />
);

// 第三方组件图标（拼图）
export const PuzzleIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>
    </svg>
  )} />
);

// 镜像仓库图标（多个盒子）
export const BoxesIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/>
      <path d="m7 16.5-4.74-2.85"/>
      <path d="m7 16.5 5-3"/>
      <path d="M7 16.5v5.17"/>
      <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/>
      <path d="m17 16.5-5-3"/>
      <path d="m17 16.5 4.74-2.85"/>
      <path d="M17 16.5v5.17"/>
      <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/>
      <path d="M12 8 7.26 5.15"/>
      <path d="m12 8 4.74-2.85"/>
      <path d="M12 13.5V8"/>
    </svg>
  )} />
);

// Git 分支图标
export const GitBranchIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" x2="6" y1="3" y2="15"/>
      <circle cx="18" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M18 9a9 9 0 0 1-9 9"/>
    </svg>
  )} />
);

// GitHub 图标
export const GithubIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
      <path d="M9 18c-4.51 2-5-2-7-2"/>
    </svg>
  )} />
);

// GitLab 图标
export const GitlabIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 13.29-3.33-10a.42.42 0 0 0-.14-.18.38.38 0 0 0-.22-.11.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18l-2.26 6.67H8.32L6.1 3.26a.42.42 0 0 0-.1-.18.38.38 0 0 0-.26-.08.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18L2 13.29a.74.74 0 0 0 .27.83L12 21l9.69-6.88a.71.71 0 0 0 .31-.83Z"/>
    </svg>
  )} />
);

// Gitee 图标
export const GiteeIcon = () => (
  <Icon component={() => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor">
      <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296z"/>
    </svg>
  )} />
);
