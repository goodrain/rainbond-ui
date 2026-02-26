import { Button, Form, Icon, Input, Modal, Radio, Select, Switch, Tooltip } from 'antd';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import globalUtil from '@/utils/global';

// 框架图标（内联 SVG）
export const FRAMEWORK_ICONS = {
  'react': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><g fill="#61DAFB"><circle cx="64" cy="64" r="11.4"/><path d="M107.3 45.2c-2.2-.8-4.5-1.6-6.9-2.3.6-2.4 1.1-4.8 1.5-7.1 2.1-13.2-.2-22.5-6.6-26.1-1.9-1.1-4-1.6-6.4-1.6-7 0-15.9 5.2-24.9 13.9-9-8.7-17.9-13.9-24.9-13.9-2.4 0-4.5.5-6.4 1.6-6.4 3.7-8.7 13-6.6 26.1.4 2.3.9 4.7 1.5 7.1-2.4.7-4.7 1.4-6.9 2.3C8.2 50 1.4 56.6 1.4 64s6.9 14 19.3 18.8c2.2.8 4.5 1.6 6.9 2.3-.6 2.4-1.1 4.8-1.5 7.1-2.1 13.2.2 22.5 6.6 26.1 1.9 1.1 4 1.6 6.4 1.6 7.1 0 16-5.2 24.9-13.9 9 8.7 17.9 13.9 24.9 13.9 2.4 0 4.5-.5 6.4-1.6 6.4-3.7 8.7-13 6.6-26.1-.4-2.3-.9-4.7-1.5-7.1 2.4-.7 4.7-1.4 6.9-2.3 12.5-4.8 19.3-11.4 19.3-18.8s-6.8-14-19.3-18.8zM92.5 14.7c4.1 2.4 5.5 9.8 3.8 20.3-.3 2.1-.8 4.3-1.4 6.6-5.2-1.2-10.7-2-16.5-2.5-3.4-4.8-6.9-9.1-10.4-13 7.4-7.3 14.9-12.3 21-12.3 1.3 0 2.5.3 3.5.9zM81.3 74c-1.8 3.2-3.9 6.4-6.1 9.6-3.7.3-7.4.4-11.2.4-3.9 0-7.6-.1-11.2-.4-2.2-3.2-4.2-6.4-6-9.6-1.9-3.3-3.7-6.7-5.3-10 1.6-3.3 3.4-6.7 5.3-10 1.8-3.2 3.9-6.4 6.1-9.6 3.7-.3 7.4-.4 11.2-.4 3.9 0 7.6.1 11.2.4 2.2 3.2 4.2 6.4 6 9.6 1.9 3.3 3.7 6.7 5.3 10-1.7 3.3-3.4 6.6-5.3 10zm8.3-3.3c1.5 3.5 2.7 6.9 3.8 10.3-3.4.8-7 1.4-10.8 1.9 1.2-1.9 2.5-3.9 3.6-6 1.2-2.1 2.3-4.2 3.4-6.2zM64 97.8c-2.4-2.6-4.7-5.4-6.9-8.3 2.3.1 4.6.2 6.9.2 2.3 0 4.6-.1 6.9-.2-2.2 2.9-4.5 5.7-6.9 8.3zm-18.6-15c-3.8-.5-7.4-1.1-10.8-1.9 1.1-3.3 2.3-6.8 3.8-10.3 1.1 2 2.2 4.1 3.4 6.1 1.2 2.2 2.4 4.1 3.6 6.1zm-7-25.5c-1.5-3.5-2.7-6.9-3.8-10.3 3.4-.8 7-1.4 10.8-1.9-1.2 1.9-2.5 3.9-3.6 6-1.2 2.1-2.3 4.2-3.4 6.2zM64 30.2c2.4 2.6 4.7 5.4 6.9 8.3-2.3-.1-4.6-.2-6.9-.2-2.3 0-4.6.1-6.9.2 2.2-2.9 4.5-5.7 6.9-8.3zm22.2 21l-3.6-6c3.8.5 7.4 1.1 10.8 1.9-1.1 3.3-2.3 6.8-3.8 10.3-1.1-2.1-2.2-4.2-3.4-6.2zM31.7 35c-1.7-10.5-.3-17.9 3.8-20.3 1-.6 2.2-.9 3.5-.9 6 0 13.5 4.9 21 12.3-3.5 3.8-7 8.2-10.4 13-5.8.5-11.3 1.4-16.5 2.5-.6-2.3-1-4.5-1.4-6.6zM7 64c0-4.7 5.7-9.7 15.7-13.4 2-.8 4.2-1.5 6.4-2.1 1.6 5 3.6 10.3 6 15.6-2.4 5.3-4.5 10.5-6 15.5C15.3 75.6 7 69.6 7 64zm28.5 49.3c-4.1-2.4-5.5-9.8-3.8-20.3.3-2.1.8-4.3 1.4-6.6 5.2 1.2 10.7 2 16.5 2.5 3.4 4.8 6.9 9.1 10.4 13-7.4 7.3-14.9 12.3-21 12.3-1.3 0-2.5-.3-3.5-.9zM96.3 93c1.7 10.5.3 17.9-3.8 20.3-1 .6-2.2.9-3.5.9-6 0-13.5-4.9-21-12.3 3.5-3.8 7-8.2 10.4-13 5.8-.5 11.3-1.4 16.5-2.5.6 2.3 1 4.5 1.4 6.6zm9-15.6c-2 .8-4.2 1.5-6.4 2.1-1.6-5-3.6-10.3-6-15.6 2.4-5.3 4.5-10.5 6-15.5 13.8 4 22.1 10 22.1 15.6 0 4.7-5.8 9.7-15.7 13.4z"/></g></svg>'),
  'vue': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#42b883" d="M78.8 10L64 35.4 49.2 10H0l64 110 64-110z"/><path fill="#35495e" d="M78.8 10L64 35.4 49.2 10H25.6L64 76 102.4 10z"/></svg>'),
  'angular': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#dd0031" d="M64 0L1.6 22.4l9.5 82.5L64 128l52.9-23.1 9.5-82.5z"/><path fill="#c3002f" d="M64 0v14.2-.1V128l52.9-23.1 9.5-82.5z"/><path fill="#fff" d="M64 14.1L23.3 98.5h15.2l8.2-20.4h34.5l8.2 20.4h15.2zm12 48.3H52l12-28.5z"/></svg>'),
  'vite': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="a" x1="6%" y1="32.4%" x2="100%" y2="67.6%"><stop offset="0%" stop-color="#41d1ff"/><stop offset="100%" stop-color="#bd34fe"/></linearGradient><linearGradient id="b" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#ffbd4f"/><stop offset="100%" stop-color="#ff980e"/></linearGradient></defs><path fill="url(#a)" d="M124.8 19.6L67.5 122.5c-1.3 2.4-4.8 2.4-6.2 0L3.2 19.6c-1.4-2.6.5-5.7 3.5-5.4l58 6.3c.4 0 .8 0 1.2 0l56.4-6.3c3-.3 4.9 2.8 3.5 5.4z"/><path fill="url(#b)" d="M91.5 1.2L48.9 9.9c-.7.1-1.2.7-1.3 1.4l-5.2 36.4c-.1 1 .7 1.9 1.7 1.8l10.8-1.2c1.1-.1 2 .8 1.8 1.9l-3.2 16.1c-.2 1.1.8 2 1.9 1.8l6.7-1.2c1.1-.2 2 .7 1.9 1.8l-5.1 29.4c-.2 1.4 1.6 2.1 2.4.9l.5-.8 28.2-56.8c.5-1.1-.3-2.3-1.5-2.2l-11.2 1c-1.1.1-2-.9-1.7-2l7.4-33.4c.3-1.1-.6-2.1-1.7-2z"/></svg>'),
  'nextjs-static': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64c11.2 0 21.7-2.9 30.8-7.9L48.4 55.3v36.6h-6.8V41.8h6.8l50.5 75.8C116.4 106.2 128 86.5 128 64c0-35.3-28.7-64-64-64zm22.1 84.6l-7.5-11.4V41.8h7.5v42.8z"/></svg>'),
  'nextjs': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64c11.2 0 21.7-2.9 30.8-7.9L48.4 55.3v36.6h-6.8V41.8h6.8l50.5 75.8C116.4 106.2 128 86.5 128 64c0-35.3-28.7-64-64-64zm22.1 84.6l-7.5-11.4V41.8h7.5v42.8z"/></svg>'),
  'nuxt-static': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#00dc82" d="M72.1 102.4H115c1.5 0 3-.4 4.3-1.2 1.3-.8 2.4-1.9 3.1-3.2.7-1.4 1.1-2.9 1-4.4-.1-1.6-.6-3-1.5-4.3L91.5 40.1c-.7-1.2-1.7-2.2-2.9-2.9-1.2-.7-2.6-1.1-4-1.1s-2.8.4-4 1.1c-1.2.7-2.2 1.7-2.9 2.9L72.1 49l-11-19c-.7-1.2-1.7-2.2-2.9-2.9-1.2-.7-2.6-1.1-4-1.1s-2.8.4-4 1.1c-1.2.7-2.2 1.7-2.9 2.9L5.1 89.3c-.9 1.3-1.4 2.7-1.5 4.3-.1 1.5.3 3 1 4.4.7 1.3 1.8 2.4 3.1 3.2 1.3.8 2.8 1.2 4.3 1.2h27.1c11.3 0 19.6-4.9 25.4-14.5l10.1-17.4 5.5-9.5 16.5 28.5H78.1l-6 12.9zm-32.6-12.9l-18.4.1 27.5-47.5 13.7 23.7-9.8 16.9c-3.6 5.6-8 6.8-13 6.8z"/></svg>'),
  'nuxt': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#00dc82" d="M72.1 102.4H115c1.5 0 3-.4 4.3-1.2 1.3-.8 2.4-1.9 3.1-3.2.7-1.4 1.1-2.9 1-4.4-.1-1.6-.6-3-1.5-4.3L91.5 40.1c-.7-1.2-1.7-2.2-2.9-2.9-1.2-.7-2.6-1.1-4-1.1s-2.8.4-4 1.1c-1.2.7-2.2 1.7-2.9 2.9L72.1 49l-11-19c-.7-1.2-1.7-2.2-2.9-2.9-1.2-.7-2.6-1.1-4-1.1s-2.8.4-4 1.1c-1.2.7-2.2 1.7-2.9 2.9L5.1 89.3c-.9 1.3-1.4 2.7-1.5 4.3-.1 1.5.3 3 1 4.4.7 1.3 1.8 2.4 3.1 3.2 1.3.8 2.8 1.2 4.3 1.2h27.1c11.3 0 19.6-4.9 25.4-14.5l10.1-17.4 5.5-9.5 16.5 28.5H78.1l-6 12.9zm-32.6-12.9l-18.4.1 27.5-47.5 13.7 23.7-9.8 16.9c-3.6 5.6-8 6.8-13 6.8z"/></svg>'),
  'express': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path d="M126.67 98.44c-4.56 1.16-7.38.05-9.91-3.75-5.68-8.51-11.95-16.63-18-24.9-.78-1.07-1.59-2.12-2.6-3.45C89 76 81.85 85.2 75.14 94.77c-2.4 3.42-4.92 4.91-9.4 3.7l26.92-36.13L67.6 29.71c4.31-.84 7.29-.41 9.93 3.45 5.83 8.52 12.26 16.63 18.67 25.21 6.45-8.55 12.8-16.67 18.8-25.11 2.41-3.42 5-4.72 9.33-3.46-3.28 4.35-6.49 8.63-9.72 12.88-4.36 5.73-8.64 11.53-13.16 17.14-1.61 2-1.35 3.3.09 5.19C109.9 76 118.16 87.1 126.67 98.44zM1.33 61.74c.72-3.61 1.2-7.29 2.2-10.83 6-21.43 30.6-30.34 47.5-17.06C60.93 41.64 63.39 52.62 62.9 65H7.1c-.84 22.21 15.15 35.62 35.53 28.78 7.15-2.4 11.36-8 13.47-15 1.07-3.51 2.84-4.06 6.14-3.06-1.69 8.76-5.52 16.08-13.52 20.66-12 6.86-29.13 4.64-38.14-4.89C5.26 85.89 3 78.92 2 71.39c-.15-1.2-.46-2.38-.7-3.57q.03-3.04.03-6.08zm5.87-1.49h50.43c-.33-16.06-10.33-27.47-24-27.57-15-.12-25.78 11.02-26.43 27.57z"/></svg>'),
  'koa': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#689f63" d="M112.8 74.2c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9 12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9zm0-21.8c-4.9 0-8.9 4-8.9 8.9s4 8.9 8.9 8.9 8.9-4 8.9-8.9-4-8.9-8.9-8.9z"/><path fill="#689f63" d="M64 128C28.7 128 0 99.3 0 64S28.7 0 64 0s64 28.7 64 64-28.7 64-64 64zM64 6.3C32.2 6.3 6.3 32.2 6.3 64s25.9 57.7 57.7 57.7 57.7-25.9 57.7-57.7S95.8 6.3 64 6.3z"/><path fill="#689f63" d="M75.4 87.3L58.6 64l16.8-23.3h-9.1L53.5 58.3 40.7 40.7h-9.1L48.4 64 31.6 87.3h9.1l12.8-17.6 12.8 17.6z"/></svg>'),
  'nestjs': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#e0234e" d="M73.3 5.3c-1.5-.2-3 .2-4.2 1.1-.9.7-1.5 1.6-1.9 2.6.8.2 1.5.5 2.2.9.7.4 1.3.9 1.9 1.4.1 0 .2.1.3.1h.3c1.1.1 2.2-.1 3.2-.5 1-.4 1.9-1 2.6-1.8-.5-.9-1.2-1.7-2-2.3-1-.7-2.2-1.2-3.4-1.4-.3-.1-.7-.1-1-.1zm9.2 4.2c-.1.6-.1 1.2 0 1.8 0 .3.1.6.2.9.1.2.1.4.2.6l.3.6c.5.8 1.1 1.5 1.9 2.1.8.6 1.6 1.1 2.6 1.4 1.9.6 4 .6 5.9-.1-.3-.8-.7-1.5-1.2-2.2-.5-.7-1.1-1.3-1.8-1.8-1.4-1.1-3-1.9-4.8-2.3-.6-.1-1.2-.2-1.8-.3-.5-.1-1-.2-1.5-.2v-.5zm-18.9.8c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm24.5 3.5c-.4 0-.8.1-1.2.2-.4.1-.7.3-1 .5-.3.2-.5.5-.7.8-.2.3-.3.7-.3 1 0 .3.1.6.2.9.1.3.3.5.5.7.2.2.5.4.8.5.3.1.6.2.9.2.6 0 1.2-.2 1.7-.6.5-.4.8-.9.9-1.5 0-.3 0-.6-.1-.9-.1-.3-.2-.5-.4-.8-.2-.2-.4-.4-.7-.6-.2-.2-.5-.3-.8-.4h.2zm-30.9.5c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-4.9 2.7c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-4.9 3.5c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-4.2 4.2c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-3.5 4.9c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-2.1 5.6c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-.7 6.3c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm.7 6.3c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm2.1 5.6c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm3.5 4.9c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm4.2 4.2c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm4.9 3.5c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm4.9 2.7c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm5.6 1.4c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm5.6.7c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm5.6 0c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm5.6-.7c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm5.6-1.4c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm4.9-2.7c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm4.9-3.5c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm4.2-4.2c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm3.5-4.9c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm2.1-5.6c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm.7-6.3c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-.7-6.3c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-2.1-5.6c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-3.5-4.9c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-4.2-4.2c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-4.9-3.5c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-4.9-2.7c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-5.6-1.4c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-5.6-.7c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-5.6 0c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1zm-5.6.7c-.1 0-.2 0-.3.1-.1 0-.2.1-.3.1-.2.1-.3.2-.4.4-.1.1-.2.3-.2.5 0 .2 0 .3.1.5.1.1.2.3.3.4.1.1.3.2.4.2.2.1.3.1.5.1.3 0 .6-.1.8-.3.2-.2.4-.5.4-.8 0-.2 0-.3-.1-.5-.1-.1-.2-.3-.3-.4-.1-.1-.3-.2-.4-.2-.2-.1-.3-.1-.5-.1z"/><path fill="#e0234e" d="M64 27.7c-20 0-36.3 16.2-36.3 36.3S44 100.3 64 100.3s36.3-16.2 36.3-36.3S84 27.7 64 27.7zm17.9 50.6c-.3.5-.8.9-1.4 1.1-.6.2-1.2.2-1.8 0-.6-.2-1.1-.6-1.4-1.1L64 56.5 50.7 78.3c-.3.5-.8.9-1.4 1.1-.6.2-1.2.2-1.8 0-.6-.2-1.1-.6-1.4-1.1-.3-.5-.4-1.1-.3-1.7.1-.6.4-1.1.9-1.5L61.4 52c.3-.5.8-.9 1.4-1.1.6-.2 1.2-.2 1.8 0 .6.2 1.1.6 1.4 1.1l14.7 23.1c.3.5.4 1.1.3 1.7-.1.6-.4 1.1-.9 1.5h-.2z"/></svg>'),
  'other-static': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#f0db4f" d="M1.4 1.4h125.2v125.2H1.4z"/><path fill="#323330" d="M116.5 96.6c-1.1-6.8-5.6-12.5-18.9-17.8-4.6-2.2-9.7-3.7-11.2-7.2-.6-2-.7-3.1-.3-4.3.9-3.4 4.3-4.4 7.1-3.5 1.8.6 3.5 2.1 4.5 4.5 4.8-3.1 4.8-3.1 8.1-5.1-1.2-1.9-1.8-2.8-2.6-3.6-2.9-3.2-6.7-4.8-12.9-4.7l-3.2.4c-3.1.7-6 2.2-7.7 4.1-5.2 5.4-3.7 14.8 2.6 18.7 6.2 4.2 15.3 5.1 16.5 9.1 1.1 4.8-3.5 6.3-8 5.8-3.3-.6-5.1-2.1-7.1-4.8l-8.4 4.8c1 2 2 2.8 3.6 4.5 7.6 7.7 26.6 7.3 30-4.4.1-.4.9-2.7.3-6.3l.6-.2zM69.9 55.7h-10.4c0 8.9 0 17.7-.1 26.6 0 5.7.3 10.9-.6 12.5-1.5 3.2-5.4 2.8-7.2 2.2-1.8-.9-2.7-2.1-3.8-3.9-.3-.5-.5-.9-.6-1l-8.4 5.2c1.4 2.9 3.5 5.4 6.1 7 3.9 2.4 9.1 3.2 14.6 1.9 3.6-1 6.7-3.1 8.3-6.3 2.3-4.2 1.8-9.4 1.8-15.2.1-9.6.1-19.3.1-29h.2z"/></svg>'),
  'docusaurus': 'data:image/svg+xml,' + encodeURIComponent('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><g fill="#3ECC5F"><path d="M23 163c-7.4 0-14-4-17.3-10A20 20 0 003 163c0 11 9 20 20 20h20v-20H23zm141 20h9v-4h-8z"/><path d="M183 53V43c0-11-9-20-20-20H73c-4-8-6-8-10 0-4-8-6-8-10 0-4-8-6-8-10 0-7-9-9-5-10.3 2.3-9-3-10.3-1.7-7.3 7.3-9 2-10 3-2.4 10.4-8 4-8 6 0 10-8 4-8 6 0 10-8 4-8 6 0 10-8 4-8 6 0 10-8 4-8 6 0 10-8 4-8 6 0 10-8 4-8 6 0 10-8 4-8 6 0 10-8 4-8 6 0 10-8 4-8 6 0 10-8 4-8 6 0 10 0 11 9 20 20 20h120c11 0 20-9 20-20"/></g><path fill="#FFF" d="M183 83l-70-4.3c-13.3-1.5-13.3-19.8 0-21.3l70-4.4"/><path d="M103 183h60c11 0 20-9 20-20V93h-60c-11 0-20 9-20 20v70z" fill="#FFFF50"/><g fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"><path d="M63 53a1 1 0 10-20 0" stroke-width="5"/><path d="M183 62.6c-5 0-5 10-10 10.7-5 0-5-10-10-10s-5 9-10 9-5-8.5-10-8.5-5 8-10 8-5-7.25-10-7.25-5 6.5-10 6.5" stroke-linecap="butt"/><path d="M168 113h-50m50 10h-50m50 10h-50m50 10h-50m50 10h-50m50 10h-50"/></g><circle cx="143" cy="39.3" r="2.5"/><circle cx="163" cy="38" r="2.5"/><circle cx="113" cy="71" r="1"/><path d="M83 123h40v-20H83zm0 60h40v-40H83z" fill="#3ECC5F"/><g fill="#44D860"><circle cx="123" cy="113" r="10"/><circle cx="128" cy="104.3" r="2.4"/><circle cx="131.7" cy="108" r="2.4"/><circle cx="133" cy="113" r="2.4"/><circle cx="131.7" cy="118" r="2.4"/><circle cx="128" cy="121.7" r="2.4"/></g><g fill="#44D860"><circle cx="123" cy="163" r="20"/><circle cx="113" cy="145.7" r="5"/><circle cx="123" cy="143" r="5"/><circle cx="133" cy="145.7" r="5"/><circle cx="140.3" cy="153" r="5"/><circle cx="143" cy="163" r="5"/></g></svg>'),
  'other-server': 'data:image/svg+xml,' + encodeURIComponent('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#689f63" d="M112.8 74.2c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9 12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9zm0-21.8c-4.9 0-8.9 4-8.9 8.9s4 8.9 8.9 8.9 8.9-4 8.9-8.9-4-8.9-8.9-8.9z"/><path fill="#689f63" d="M64 128C28.7 128 0 99.3 0 64S28.7 0 64 0s64 28.7 64 64-28.7 64-64 64zM64 6.3C32.2 6.3 6.3 32.2 6.3 64s25.9 57.7 57.7 57.7 57.7-25.9 57.7-57.7S95.8 6.3 64 6.3z"/><path fill="#689f63" d="M75.4 87.3L58.6 64l16.8-23.3h-9.1L53.5 58.3 40.7 40.7h-9.1L48.4 64 31.6 87.3h9.1l12.8-17.6 12.8 17.6z"/></svg>'),
};

const { Option, OptGroup } = Select;
const { TextArea } = Input;

// 根据后端返回的 display_name 和 runtime_type 构造本地化标签
// 后端返回纯英文 display_name，前端根据 name 和 type 添加 i18n 后缀
const getFrameworkLabel = (framework) => {
  const { value, label, type } = framework;
  // nextjs-static / nuxt-static: 显示 "Next.js (静态导出)" / "Nuxt (静态导出)"
  if (value === 'nextjs-static' || value === 'nuxt-static') {
    return `${label} (${formatMessage({id: 'componentOverview.body.NodeJSCNB.type_static_export'})})`;
  }
  // nextjs / nuxt (SSR): 显示 "Next.js (SSR)" / "Nuxt (SSR)"
  if ((value === 'nextjs' || value === 'nuxt') && type === 'server') {
    return `${label} (${formatMessage({id: 'componentOverview.body.NodeJSCNB.type_ssr'})})`;
  }
  // other-static / other-server: 使用 i18n
  if (value === 'other-static') {
    return formatMessage({id: 'componentOverview.body.NodeJSCNB.other_static'});
  }
  if (value === 'other-server') {
    return formatMessage({id: 'componentOverview.body.NodeJSCNB.other_server'});
  }
  return label;
};

// Mirror 配置文件类型 - 根据包管理器映射
// 注意：pnpm 使用 .npmrc（不是 .pnpmrc），与 npm 相同
const MIRROR_CONFIG_MAP = {
  npm: { value: '.npmrc', label: '.npmrc', fieldName: 'CNB_MIRROR_NPMRC' },
  yarn: { value: '.yarnrc', label: '.yarnrc', fieldName: 'CNB_MIRROR_YARNRC' },
  pnpm: { value: '.npmrc', label: '.npmrc', fieldName: 'CNB_MIRROR_NPMRC' },
};

// 获取包管理器对应的配置文件
const getConfigForPackageManager = (pmName) => {
  // 默认使用 npm
  const pm = pmName?.toLowerCase() || 'npm';
  return MIRROR_CONFIG_MAP[pm] || MIRROR_CONFIG_MAP.npm;
};

// 默认镜像配置模板
const DEFAULT_MIRROR_CONFIGS = {
  '.npmrc': `registry=https://registry.npmmirror.com
disturl=https://npmmirror.com/dist
sharp_binary_host=https://npmmirror.com/mirrors/sharp
sharp_libvips_binary_host=https://npmmirror.com/mirrors/sharp-libvips
profiler_binary_host_mirror=https://npmmirror.com/mirrors/node-inspector/
fse_binary_host_mirror=https://npmmirror.com/mirrors/fsevents
node_sqlite3_binary_host_mirror=https://npmmirror.com/mirrors
sqlite3_binary_host_mirror=https://npmmirror.com/mirrors
sqlite3_binary_site=https://npmmirror.com/mirrors/sqlite3
sass_binary_site=https://npmmirror.com/mirrors/node-sass
electron_mirror=https://npmmirror.com/mirrors/electron/
puppeteer_download_host=https://npmmirror.com/mirrors
chromedriver_cdnurl=https://npmmirror.com/mirrors/chromedriver
operadriver_cdnurl=https://npmmirror.com/mirrors/operadriver
phantomjs_cdnurl=https://npmmirror.com/mirrors/phantomjs
python_mirror=https://npmmirror.com/mirrors/python`,
  '.yarnrc': `registry "https://registry.npmmirror.com"
disturl "https://npmmirror.com/dist"
sharp_binary_host "https://npmmirror.com/mirrors/sharp"
sharp_libvips_binary_host "https://npmmirror.com/mirrors/sharp-libvips"
profiler_binary_host_mirror "https://npmmirror.com/mirrors/node-inspector/"
fse_binary_host_mirror "https://npmmirror.com/mirrors/fsevents"
node_sqlite3_binary_host_mirror "https://npmmirror.com/mirrors"
sqlite3_binary_host_mirror "https://npmmirror.com/mirrors"
sqlite3_binary_site "https://npmmirror.com/mirrors/sqlite3"
sass_binary_site "https://npmmirror.com/mirrors/node-sass"
electron_mirror "https://npmmirror.com/mirrors/electron/"
puppeteer_download_host "https://npmmirror.com/mirrors"
chromedriver_cdnurl "https://npmmirror.com/mirrors/chromedriver"
operadriver_cdnurl "https://npmmirror.com/mirrors/operadriver"
phantomjs_cdnurl "https://npmmirror.com/mirrors/phantomjs"
python_mirror "https://npmmirror.com/mirrors/python"`,
};

// 渲染框架选项（带图标）
const renderFrameworkOption = (framework) => {
  const displayLabel = getFrameworkLabel(framework);
  return (
    <Option key={framework.value} value={framework.value}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={FRAMEWORK_ICONS[framework.value]}
          alt={displayLabel}
          style={{ width: 16, height: 16, marginRight: 8 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span>{displayLabel}</span>
      </div>
    </Option>
  );
};

@connect(
  ({ loading, teamControl, enterprise }) => ({
    soundCodeLanguage: teamControl.codeLanguage,
    packageType: teamControl.packageNpmOrYarn,
    currentEnterprise: enterprise.currentEnterprise
  }), null, null, { withRef: true })
class NodeJSCNBConfig extends PureComponent {
  constructor(props) {
    super(props);
    const { envs, isPureStatic = false } = props;

    // 获取框架信息
    // 优先级: CNB_FRAMEWORK（用户已保存） > BUILD_FRAMEWORK（检测阶段写入） > 默认 'other-static'
    const detectedFramework = envs?.CNB_FRAMEWORK
      || envs?.BUILD_FRAMEWORK
      || 'other-static';

    const isStatic = isPureStatic ? true : (
      detectedFramework.endsWith('-static')
      || detectedFramework === 'other-static'
    );

    // 获取配置文件检测结果
    let hasProjectConfig = false;
    let configFilesInfo = {
      hasNpmrc: false,
      hasYarnrc: false
    };

    if (envs) {
      configFilesInfo = {
        hasNpmrc: envs.BUILD_HAS_NPMRC === 'true',
        hasYarnrc: envs.BUILD_HAS_YARNRC === 'true'
      };
      hasProjectConfig = configFilesInfo.hasNpmrc || configFilesInfo.hasYarnrc;
      // Fallback: 如果 BUILD_HAS_* 标志不存在，但 CNB_MIRROR_SOURCE 已保存为 'project'，
      // 说明创建时检测到了配置文件（兼容旧数据）
      if (!hasProjectConfig && envs.CNB_MIRROR_SOURCE === 'project') {
        hasProjectConfig = true;
      }
    }

    // Mirror 来源：如果用户已保存选择，使用保存的值；否则根据检测结果自动选择
    const savedMirrorSource = envs?.CNB_MIRROR_SOURCE;
    const autoMirrorSource = hasProjectConfig ? 'project' : 'global';

    // 获取检测到的包管理器
    // 优先级: CNB_PACKAGE_TOOL > BUILD_PACKAGE_TOOL > 默认 npm
    const detectedPackageManager = envs?.CNB_PACKAGE_TOOL
      || envs?.BUILD_PACKAGE_TOOL
      || 'npm';
    const mirrorConfig = getConfigForPackageManager(detectedPackageManager);

    this.state = {
      selectedFramework: detectedFramework,
      isStaticFramework: isStatic,
      isPureStatic,  // 新增：纯静态项目标志
      // Mirror 配置相关状态
      mirrorSource: savedMirrorSource || autoMirrorSource,
      mirrorConfigType: mirrorConfig.value,
      mirrorConfigContent: envs?.CNB_MIRROR_CONTENT || '',
      mirrorModalVisible: false,
      tempMirrorContent: '',
      // 配置文件检测结果
      configFilesInfo,
      hasProjectConfig,
      // 检测到的包管理器
      detectedPackageManager,
      mirrorConfig,
      // 从 envs 中恢复已保存的 Mirror 配置内容
      'mirrorContent_.npmrc': envs?.CNB_MIRROR_NPMRC || '',
      'mirrorContent_.yarnrc': envs?.CNB_MIRROR_YARNRC || '',
      // API 数据（componentDidMount 加载）
      nodeVersions: [],
      frameworkList: [],
    };
  }

  componentDidMount() {
    this.fetchCNBData();
  }

  fetchCNBData = () => {
    const { dispatch, currentEnterprise } = this.props;
    if (!dispatch || !currentEnterprise) return;

    const enterprise_id = currentEnterprise.enterprise_id;
    const region_id = globalUtil.getCurrRegionName();
    if (!enterprise_id || !region_id) return;

    // 并行获取版本和框架
    dispatch({
      type: 'global/fetchCNBVersions',
      payload: { enterprise_id, region_id, lang: 'nodejs' },
      callback: (res) => {
        if (res && res.list && res.list.length > 0) {
          const versions = res.list.map(v => ({
            version: v.version,
            _default: v.default
          }));
          this.setState({ nodeVersions: versions });
          // 如果当前没有选中版本，自动选中后端标记的默认版本
          const currentVersion = this.props.form.getFieldValue('CNB_NODE_VERSION');
          if (!currentVersion) {
            const defaultVersion = versions.find(v => v._default);
            if (defaultVersion) {
              this.props.form.setFieldsValue({ CNB_NODE_VERSION: defaultVersion.version });
            }
          }
        }
      }
    });

    dispatch({
      type: 'global/fetchCNBFrameworks',
      payload: { enterprise_id, region_id, lang: 'nodejs' },
      callback: (res) => {
        if (res && res.list && res.list.length > 0) {
          // 将后端框架数据转换为前端格式
          const frameworks = res.list.map(f => ({
            value: f.name,
            label: f.display_name,
            type: f.runtime_type === 'static' ? 'static' : 'server',
            outputDir: f.output_dir || ''
          }));
          // API 加载后，用真实数据修正框架类型判断
          const { selectedFramework, isPureStatic } = this.state;
          const matched = frameworks.find(f => f.value === selectedFramework);
          const newState = { frameworkList: frameworks };
          if (matched && !isPureStatic) {
            newState.isStaticFramework = matched.type === 'static';
          }
          this.setState(newState);
        }
      }
    });
  };

  onFrameworkChange = (value) => {
    const frameworkInfo = this.state.frameworkList.find(f => f.value === value);
    const isStatic = frameworkInfo?.type === 'static';

    this.setState({
      selectedFramework: value,
      isStaticFramework: isStatic
    });

    // 更新输出目录默认值
    if (isStatic && frameworkInfo?.outputDir) {
      this.props.form.setFieldsValue({
        CNB_OUTPUT_DIR: frameworkInfo.outputDir
      });
    }
  };

  // Mirror 配置来源切换
  onMirrorSourceChange = (e) => {
    this.setState({ mirrorSource: e.target.value });
  };

  // Mirror 配置类型切换
  onMirrorTypeChange = (value) => {
    this.setState({ mirrorConfigType: value });
  };

  // 打开编辑弹窗
  openMirrorModal = () => {
    this.setState({
      mirrorModalVisible: true,
      tempMirrorContent: this.state.mirrorConfigContent
    });
  };

  // 关闭编辑弹窗
  closeMirrorModal = () => {
    this.setState({ mirrorModalVisible: false });
  };

  // 保存 Mirror 配置
  saveMirrorConfig = () => {
    const { mirrorConfigType, tempMirrorContent, mirrorConfig } = this.state;
    this.setState({
      [`mirrorContent_${mirrorConfigType}`]: tempMirrorContent,
      mirrorModalVisible: false
    });
    // 更新隐藏表单字段（使用当前包管理器对应的字段名）
    this.props.form.setFieldsValue({
      [mirrorConfig.fieldName]: tempMirrorContent
    });
  };

  render() {
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 }
      }
    };

    const { envs } = this.props;
    const { getFieldDecorator } = this.props.form;
    const {
      selectedFramework,
      isStaticFramework,
      isPureStatic,
      mirrorSource,
      mirrorConfigType,
      mirrorConfigContent,
      mirrorModalVisible,
      tempMirrorContent,
      configFilesInfo,
      hasProjectConfig,
      detectedPackageManager,
      mirrorConfig,
      nodeVersions,
      frameworkList
    } = this.state;

    // 获取 Node.js 版本
    // CNB_NODE_VERSION 是用户已保存的精确版本，没保存过则由 fetchCNBVersions 回调通过 BUILD_RUNTIMES 模糊匹配
    const nodeVersion = envs?.CNB_NODE_VERSION || '';

    // 获取构建配置
    // 优先级: CNB_* > BUILD_*
    const outputDir = envs?.CNB_OUTPUT_DIR
      || envs?.BUILD_OUTPUT_DIR
      || (isPureStatic ? '.' : 'dist');

    const buildScript = envs?.CNB_BUILD_SCRIPT
      || envs?.BUILD_BUILD_CMD
      || (isStaticFramework ? 'build' : '');

    const startCommand = envs?.CNB_START_SCRIPT
      || envs?.BP_NPM_START_SCRIPT
      || envs?.BP_PNPM_START_SCRIPT
      || envs?.BUILD_START_CMD
      || '';

    return (
      <div>
        {/* 1. 项目框架（和创建时保持一致） */}
        <Form.Item
          {...formItemLayout}
          label={
            <span>
              {formatMessage({id: 'componentOverview.body.NodeJSCNB.framework'})}
              <Tooltip title={isPureStatic
                ? formatMessage({id: 'componentOverview.body.NodeJSCNB.framework_tip_static'})
                : formatMessage({id: 'componentOverview.body.NodeJSCNB.framework_tip'})}>
                <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
              </Tooltip>
            </span>
          }
        >
          {getFieldDecorator('CNB_FRAMEWORK', {
            initialValue: selectedFramework
          })(
            <Select
              style={{ width: 300 }}
              onChange={this.onFrameworkChange}
              placeholder={formatMessage({id: 'componentOverview.body.NodeJSCNB.framework_placeholder'})}
            >
              {isPureStatic ? (
                <OptGroup label={formatMessage({id: 'componentOverview.body.NodeJSCNB.framework_group_static_only'})}>
                  {frameworkList.filter(f => f.type === 'static').map(renderFrameworkOption)}
                </OptGroup>
              ) : ([
                <OptGroup key="static" label={formatMessage({id: 'componentOverview.body.NodeJSCNB.framework_group_static'})}>
                  {frameworkList.filter(f => f.type === 'static').map(renderFrameworkOption)}
                </OptGroup>,
                <OptGroup key="server" label={formatMessage({id: 'componentOverview.body.NodeJSCNB.framework_group_server'})}>
                  {frameworkList.filter(f => f.type === 'server').map(renderFrameworkOption)}
                </OptGroup>
              ])}
            </Select>
          )}
        </Form.Item>

        {/* 2. 禁用缓存 */}
        <Form.Item
          {...formItemLayout}
          label={
            <span>
              <FormattedMessage id="componentOverview.body.GoConfig.Disable"/>
              <Tooltip title={<FormattedMessage id="componentOverview.body.GoConfig.remove"/>}>
                <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
              </Tooltip>
            </span>
          }
        >
          {getFieldDecorator('BUILD_NO_CACHE', {
            initialValue: !!(envs && envs.BUILD_NO_CACHE)
          })(<Switch defaultChecked={!!(envs && envs.BUILD_NO_CACHE)} />)}
        </Form.Item>

        {/* 3. Node.js 版本选择 - 仅 Node.js 项目显示 */}
        {!isPureStatic && (
          <Form.Item
            {...formItemLayout}
            label={
              <span>
                {formatMessage({id: 'componentOverview.body.NodeJSCNB.node_version'})}
                <Tooltip title={formatMessage({id: 'componentOverview.body.NodeJSCNB.node_version_tip'})}>
                  <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('CNB_NODE_VERSION', {
              initialValue: nodeVersion
            })(
              <Radio.Group>
                {nodeVersions.map(v => {
                  const ver = typeof v === 'string' ? v : v.version;
                  return <Radio key={ver} value={ver}>{ver}</Radio>;
                })}
              </Radio.Group>
            )}
          </Form.Item>
        )}

        {/* 4. NODE_ENV - 仅 Node.js 项目显示 */}
        {!isPureStatic && (
          <Form.Item
            {...formItemLayout}
            label={
              <span>
                NODE_ENV
                <Tooltip title={formatMessage({id: 'componentOverview.body.NodeJSCNB.node_env_tip'})}>
                  <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('CNB_NODE_ENV', {
              initialValue: envs?.CNB_NODE_ENV || 'production'
            })(
              <Input placeholder="production" style={{ width: 300 }} />
            )}
          </Form.Item>
        )}

        {/* 5. Mirror 配置 - 仅 Node.js 项目显示 */}
        {!isPureStatic && (
          <>
            <Form.Item
              {...formItemLayout}
              label={
                <span>
                  {formatMessage({id: 'componentOverview.body.NodeJSCNB.mirror_config'})}
                  <Tooltip title={formatMessage({id: 'componentOverview.body.NodeJSCNB.mirror_config_tip'})}>
                    <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                  </Tooltip>
                </span>
              }
            >
              <div>
                {getFieldDecorator('CNB_MIRROR_SOURCE', {
                  initialValue: mirrorSource
                })(
                  <Radio.Group onChange={this.onMirrorSourceChange}>
                    <Radio value="project">
                      {formatMessage({id: 'componentOverview.body.NodeJSCNB.mirror_project'})}
                    </Radio>
                    <Radio value="global">
                      {formatMessage({id: 'componentOverview.body.NodeJSCNB.mirror_custom'})}
                    </Radio>
                  </Radio.Group>
                )}
              </div>
            </Form.Item>

            {/* 全局配置 - 只显示检测到的包管理器对应的配置文件 */}
            {mirrorSource === 'global' && (
              <Form.Item
                {...formItemLayout}
                label={
                  <span>
                    {formatMessage({id: 'componentOverview.body.NodeJSCNB.custom_config'})}
                    <Tooltip title={formatMessage({id: 'componentOverview.body.NodeJSCNB.custom_config_tip'})}>
                      <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                    </Tooltip>
                  </span>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* 只显示对应包管理器的配置文件 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#fafafa',
                    borderRadius: 4,
                    border: '1px solid #e8e8e8'
                  }}>
                    <span style={{ fontWeight: 500, width: 80 }}>{mirrorConfig.label}</span>
                    <Button
                      type="link"
                      size="small"
                      icon="edit"
                      onClick={() => {
                        this.setState({
                          mirrorConfigType: mirrorConfig.value,
                          mirrorModalVisible: true,
                          tempMirrorContent: this.state[`mirrorContent_${mirrorConfig.value}`] || ''
                        });
                      }}
                    >
                      {formatMessage({id: 'componentOverview.body.NodeJSCNB.edit'})}
                    </Button>
                    {this.state[`mirrorContent_${mirrorConfig.value}`] && (
                      <span style={{ color: '#52c41a', fontSize: 12, marginLeft: 8 }}>
                        <Icon type="check-circle" style={{ marginRight: 4 }} />
                        {formatMessage({id: 'componentOverview.body.NodeJSCNB.configured'})}
                      </span>
                    )}
                  </div>
                </div>
                {/* 隐藏字段用于表单提交 - 只提交对应包管理器的配置 */}
                {getFieldDecorator(mirrorConfig.fieldName, {
                  initialValue: this.state[`mirrorContent_${mirrorConfig.value}`] || ''
                })(<Input type="hidden" />)}
              </Form.Item>
            )}

            {/* Mirror 配置编辑弹窗 */}
            <Modal
              title={formatMessage({id: 'componentOverview.body.NodeJSCNB.edit_config'}, {type: mirrorConfigType})}
              visible={mirrorModalVisible}
              onOk={this.saveMirrorConfig}
              onCancel={this.closeMirrorModal}
              width={720}
              okText={formatMessage({id: 'componentOverview.body.NodeJSCNB.save'})}
              cancelText={formatMessage({id: 'componentOverview.body.NodeJSCNB.cancel'})}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <Button
                  type="link"
                  size="small"
                  icon="edit"
                  onClick={() => this.setState({
                    tempMirrorContent: DEFAULT_MIRROR_CONFIGS[mirrorConfigType] || ''
                  })}
                >
                  {formatMessage({id: 'componentOverview.body.NodeJSCNB.fill_default'})}
                </Button>
              </div>
              <TextArea
                rows={18}
                value={tempMirrorContent}
                onChange={(e) => this.setState({ tempMirrorContent: e.target.value })}
                placeholder={formatMessage({id: 'componentOverview.body.NodeJSCNB.config_placeholder'}, {type: mirrorConfigType})}
                style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: '22px' }}
              />
            </Modal>
          </>
        )}

        {/* 6. 输出目录 - 静态项目显示（包括纯静态和 Node.js 静态） */}
        {(isStaticFramework || isPureStatic) && (
          <Form.Item
            {...formItemLayout}
            label={
              <span>
                {formatMessage({id: 'componentOverview.body.NodeJSCNB.output_dir'})}
                <Tooltip title={isPureStatic
                  ? formatMessage({id: 'componentOverview.body.NodeJSCNB.output_dir_tip_static'})
                  : formatMessage({id: 'componentOverview.body.NodeJSCNB.output_dir_tip'})}>
                  <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('CNB_OUTPUT_DIR', {
              initialValue: outputDir
            })(<Input placeholder={isPureStatic ? "." : "dist"} style={{ width: 300 }} />)}
          </Form.Item>
        )}

        {/* 7. 构建命令 - Node.js 项目显示（纯静态项目不显示） */}
        {!isPureStatic && (
          <Form.Item
            {...formItemLayout}
            label={
              <span>
                {formatMessage({id: 'componentOverview.body.NodeJSCNB.build_cmd'})}
                <Tooltip title={formatMessage({id: 'componentOverview.body.NodeJSCNB.build_cmd_tip'})}>
                  <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('CNB_BUILD_SCRIPT', {
              initialValue: buildScript
            })(<Input placeholder="build" style={{ width: 300 }} />)}
          </Form.Item>
        )}

        {/* 8. 启动命令 - 仅 Node.js 后端服务显示（纯静态和前端框架不显示） */}
        {!isPureStatic && !isStaticFramework && (
          <Form.Item
            {...formItemLayout}
            label={
              <span>
                {formatMessage({id: 'componentOverview.body.NodeJSCNB.start_cmd'})}
                <Tooltip title={formatMessage({id: 'componentOverview.body.NodeJSCNB.start_cmd_tip'})}>
                  <Icon type="question-circle" style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('CNB_START_SCRIPT', {
              initialValue: startCommand
            })(<Input placeholder={formatMessage({id: 'componentOverview.body.NodeJSCNB.start_cmd_placeholder'})} style={{ width: 300 }} />)}
          </Form.Item>
        )}
      </div>
    );
  }
}

export default NodeJSCNBConfig;
