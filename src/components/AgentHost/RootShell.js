import React, { Fragment, PureComponent } from 'react';
import { Icon } from 'antd';
import { routerRedux } from 'dva/router';
import { getDvaApp } from 'umi';
import AgentHost from './index';
import styles from './RootShell.less';
import {
  buildAgentContext,
  getAgentRouteSignature,
  isAgentRouteHidden,
} from '../../utils/agentContext';
const { getAgentViewportCssVars } = require('../../utils/agentViewport');
import { persistAgentSession } from '../../services/agent';
import { getAgentPanelConfig } from '../../utils/agentLayout';
const { createSessionPersistenceScheduler } = require('./sessionPersistenceScheduler');
const { shouldViewportLock } = require('./viewportLockState');

const VIEWPORT_LOCK_NOTICE_EXIT_MS = 180;
const VIEWPORT_LOCK_GLOW_EXIT_MS = 220;
const VIEWPORT_LOCK_TOTAL_EXIT_MS =
  VIEWPORT_LOCK_NOTICE_EXIT_MS + VIEWPORT_LOCK_GLOW_EXIT_MS;

export default class AgentRootShell extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: null,
      needLogin: false,
      agent: null,
      location: {},
      panelConfig: getAgentPanelConfig(),
      viewportLockMounted: false,
      viewportLockPhase: 'idle',
      viewportLockNoticeSize: null,
    };
    this.store = null;
    this.unsubscribe = null;
    this.retryTimer = null;
    this.viewportLockTimer = null;
    this.viewportLockNoticeNode = null;
    this.viewportLockResizeObserver = null;
    this.prevLoginKey = '';
    this.prevPathSignature = '';
    this.prevAgentUpdatedAt = 0;
    this.prevMutationNavigationKey = '';
    this.prevMutationRefreshKey = '';
    this.isSyncingContext = false;
    this.viewportLockBorderGradientId = `appViewportLockBorderGradient_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    this.persistenceScheduler = createSessionPersistenceScheduler({
      delayMs: 400,
      persistFn: persistAgentSession,
    });
  }

  componentDidMount() {
    this.attachStoreWithRetry();
  }

  componentDidUpdate(prevProps, prevState) {
    const prevLocked = shouldViewportLock(prevState);
    const nextLocked = shouldViewportLock(this.state);

    if (prevLocked === nextLocked) {
      return;
    }

    if (nextLocked) {
      this.enterViewportLock();
    } else {
      this.exitViewportLock();
    }
  }

  componentWillUnmount() {
    this.persistenceScheduler.flush();
    this.persistenceScheduler.cancel();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    if (this.viewportLockTimer) {
      clearTimeout(this.viewportLockTimer);
    }
    this.disconnectViewportLockResizeObserver();
    window.removeEventListener('resize', this.handleResize);
  }

  attachStoreWithRetry = () => {
    const dvaApp = getDvaApp();
    if (dvaApp && dvaApp._store) {
      this.attachStore(dvaApp._store);
      return;
    }
    this.retryTimer = setTimeout(this.attachStoreWithRetry, 80);
  };

  attachStore = store => {
    if (!store || this.store === store) {
      return;
    }
    this.store = store;
    this.unsubscribe = store.subscribe(this.handleStoreChange);
    this.handleStoreChange();
    window.addEventListener('resize', this.handleResize);
  };

  handleResize = () => {
    const nextPanelConfig = getAgentPanelConfig();
    const currentPanelConfig = this.state.panelConfig || {};
    if (
      nextPanelConfig.width !== currentPanelConfig.width ||
      nextPanelConfig.mode !== currentPanelConfig.mode
    ) {
      this.setState({
        panelConfig: nextPanelConfig,
      });
    }
    this.measureViewportLockNotice();
  };

  setViewportLockNoticeRef = node => {
    if (this.viewportLockNoticeNode === node) {
      return;
    }

    this.disconnectViewportLockResizeObserver();
    this.viewportLockNoticeNode = node;

    if (!node) {
      return;
    }

    this.measureViewportLockNotice();

    if (typeof ResizeObserver !== 'undefined') {
      this.viewportLockResizeObserver = new ResizeObserver(() => {
        this.measureViewportLockNotice();
      });
      this.viewportLockResizeObserver.observe(node);
    }
  };

  disconnectViewportLockResizeObserver = () => {
    if (this.viewportLockResizeObserver) {
      this.viewportLockResizeObserver.disconnect();
      this.viewportLockResizeObserver = null;
    }
  };

  measureViewportLockNotice = () => {
    const node = this.viewportLockNoticeNode;
    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    if (width <= 0 || height <= 0) {
      return;
    }

    const prevSize = this.state.viewportLockNoticeSize;
    if (
      prevSize &&
      prevSize.width === width &&
      prevSize.height === height
    ) {
      return;
    }

    this.setState({
      viewportLockNoticeSize: {
        width,
        height,
      },
    });
  };

  handleStoreChange = () => {
    if (!this.store) {
      return;
    }

    const storeState = this.store.getState() || {};
    const currentUser = storeState.user && storeState.user.currentUser;
    const needLogin = storeState.global && storeState.global.needLogin;
    const location =
      (storeState.routing && storeState.routing.location) || {};
    const agent = storeState.agent || null;
    const loginKey =
      currentUser && currentUser.user_id ? String(currentUser.user_id) : '';
    const previousLoginKey = this.prevLoginKey;
    const previousAgent = this.state.agent || null;
    const pathSignature = getAgentRouteSignature(location);
    const mutationNavigationKey = agent && agent.pendingMutationNavigationKey;
    const mutationRoute = agent && agent.pendingMutationRoute;
    const mutationRefreshKey = agent && agent.pendingMutationRefreshKey;
    const mutationRefreshMode = agent && agent.pendingMutationRefreshMode;

    if (loginKey !== previousLoginKey) {
      this.prevLoginKey = loginKey;
      this.prevAgentUpdatedAt = 0;
      this.prevMutationNavigationKey = '';
      this.prevMutationRefreshKey = '';

      if (previousLoginKey && !loginKey) {
        this.persistenceScheduler.flush();
        this.persistenceScheduler.cancel();
        this.store.dispatch({
          type: 'agent/clearSession',
          payload: {
            userId: previousLoginKey,
            preserveVisible: false,
          },
        });
      }

      if (loginKey) {
        this.prevPathSignature = '';
        this.store.dispatch({
          type: 'agent/hydrateSession',
          payload: {
            userId: loginKey,
          },
        });
      }
    }

    if (
      loginKey &&
      agent &&
      agent.hydrated &&
      pathSignature !== this.prevPathSignature &&
      !isAgentRouteHidden(location) &&
      !this.isSyncingContext
    ) {
      this.prevPathSignature = pathSignature;
      this.isSyncingContext = true;
      try {
        this.store.dispatch({
          type: 'agent/syncContext',
          payload: buildAgentContext(location, storeState),
        });
      } finally {
        this.isSyncingContext = false;
      }
    } else if (!loginKey) {
      this.prevPathSignature = pathSignature;
    }

    if (
      loginKey &&
      agent &&
      agent.hydrated &&
      agent.updatedAt &&
      agent.updatedAt !== this.prevAgentUpdatedAt
    ) {
      const panelClosed = !!(previousAgent && previousAgent.visible && !agent.visible);
      this.persistenceScheduler.schedule(agent, loginKey, {
        immediate: !agent.sending || panelClosed,
      });
      this.prevAgentUpdatedAt = agent.updatedAt;
    }

    if (
      mutationNavigationKey &&
      mutationRoute &&
      mutationNavigationKey !== this.prevMutationNavigationKey
    ) {
      this.prevMutationNavigationKey = mutationNavigationKey;
      const currentRoute = this.buildLocationRoute(location);
      if (currentRoute !== mutationRoute) {
        this.store.dispatch(routerRedux.push(mutationRoute));
      }
    }

    if (
      mutationRefreshMode === 'route' &&
      mutationRefreshKey &&
      mutationRefreshKey !== this.prevMutationRefreshKey
    ) {
      this.prevMutationRefreshKey = mutationRefreshKey;
      const refreshedRoute = this.buildRefreshedRoute(location);
      if (refreshedRoute) {
        this.store.dispatch(routerRedux.push(refreshedRoute));
      }
    }

    if (
      this.state.currentUser !== currentUser ||
      this.state.needLogin !== needLogin ||
      this.state.location !== location ||
      this.state.agent !== agent
    ) {
      this.setState({
        currentUser,
        needLogin,
        location,
        agent,
      });
    }
  };

  buildLocationRoute = location => {
    if (!location) {
      return '';
    }

    return `${location.pathname || ''}${location.search || ''}`;
  };

  buildRefreshedRoute = location => {
    if (!location || !location.pathname) {
      return '';
    }

    const search = location.search || '';
    const queryString = search.indexOf('?') === 0 ? search.slice(1) : search;
    const params = new URLSearchParams(queryString);
    params.set('refresh', `${Date.now()}`);
    const nextSearch = params.toString();

    return `${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
  };

  shouldShowAgent = () => {
    return this.shouldShowAgentFor(this.state);
  };

  shouldShowAgentFor = snapshot => {
    if (!snapshot) {
      return false;
    }
    const { currentUser, needLogin, location } = snapshot;
    return !!currentUser && !needLogin && !isAgentRouteHidden(location);
  };

  enterViewportLock = () => {
    if (this.viewportLockTimer) {
      clearTimeout(this.viewportLockTimer);
      this.viewportLockTimer = null;
    }

    if (!this.state.viewportLockMounted || this.state.viewportLockPhase !== 'enter') {
      this.setState({
        viewportLockMounted: true,
        viewportLockPhase: 'enter',
      });
    }
  };

  exitViewportLock = () => {
    if (!this.state.viewportLockMounted) {
      return;
    }

    if (this.viewportLockTimer) {
      clearTimeout(this.viewportLockTimer);
    }

    this.setState({
      viewportLockPhase: 'exit',
    });

    this.viewportLockTimer = setTimeout(() => {
      this.viewportLockTimer = null;
      this.setState({
        viewportLockMounted: false,
        viewportLockPhase: 'idle',
      });
    }, VIEWPORT_LOCK_TOTAL_EXIT_MS);
  };

  renderViewportLock = () => {
    const {
      viewportLockMounted,
      viewportLockPhase,
      viewportLockNoticeSize,
    } = this.state;

    if (!viewportLockMounted) {
      return null;
    }

    const borderWidth = viewportLockNoticeSize && viewportLockNoticeSize.width
      ? viewportLockNoticeSize.width
      : 0;
    const borderHeight = viewportLockNoticeSize && viewportLockNoticeSize.height
      ? viewportLockNoticeSize.height
      : 0;
    const borderInset = 2;
    const borderStrokeRectWidth = Math.max(borderWidth - borderInset * 2, 0);
    const borderStrokeRectHeight = Math.max(borderHeight - borderInset * 2, 0);
    const borderRadius = Math.max(borderStrokeRectHeight / 2, 0);
    const phaseClassName =
      viewportLockPhase === 'exit'
        ? styles.appViewportLockExit
        : styles.appViewportLockEnter;

    return (
      <div
        className={`${styles.appViewportLock} ${phaseClassName}`}
        aria-hidden="true"
      >
        <div className={styles.appViewportLockGlow} />
        <div className={styles.appViewportLockNotice} ref={this.setViewportLockNoticeRef}>
          <div className={styles.appViewportLockNoticeAura} />
          {borderWidth > 0 && borderHeight > 0 ? (
            <svg
              className={styles.appViewportLockBorderSvg}
              viewBox={`0 0 ${borderWidth} ${borderHeight}`}
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id={this.viewportLockBorderGradientId}
                  x1="0"
                  y1="0"
                  x2={borderWidth}
                  y2={borderHeight}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#2EF2FF" />
                  <stop offset="24%" stopColor="#57C8FF" />
                  <stop offset="50%" stopColor="#6E90FF" />
                  <stop offset="74%" stopColor="#8C70FF" />
                  <stop offset="100%" stopColor="#43E7FF" />
                  <animateTransform
                    attributeName="gradientTransform"
                    attributeType="XML"
                    type="rotate"
                    from={`0 ${borderWidth / 2} ${borderHeight / 2}`}
                    to={`360 ${borderWidth / 2} ${borderHeight / 2}`}
                    dur="3.4s"
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>
              <rect
                className={styles.appViewportLockBorderTrack}
                x={borderInset}
                y={borderInset}
                width={borderStrokeRectWidth}
                height={borderStrokeRectHeight}
                rx={borderRadius}
                ry={borderRadius}
                pathLength="100"
                vectorEffect="non-scaling-stroke"
                style={{ stroke: `url(#${this.viewportLockBorderGradientId})` }}
              />
              <rect
                className={styles.appViewportLockBorderRunner}
                x={borderInset}
                y={borderInset}
                width={borderStrokeRectWidth}
                height={borderStrokeRectHeight}
                rx={borderRadius}
                ry={borderRadius}
                pathLength="100"
                vectorEffect="non-scaling-stroke"
                style={{ stroke: `url(#${this.viewportLockBorderGradientId})` }}
              />
            </svg>
          ) : null}
          <div className={styles.appViewportLockNoticeInner}>
            <span className={styles.appViewportLockIcon}>
              <Icon type="message" />
            </span>
            <span className={styles.appViewportLockText}>AI 正在工作中，请勿操作</span>
            <span className={styles.appViewportLockDots} aria-hidden="true">
              <span className={styles.appViewportLockDot} />
              <span className={styles.appViewportLockDot} />
              <span className={styles.appViewportLockDot} />
            </span>
            <span className={styles.appViewportLockHint}>接管</span>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { currentUser, needLogin, location } = this.state;
    const { children } = this.props;
    const { agent, panelConfig } = this.state;
    const canShowAgent = this.shouldShowAgent();
    const isPanelVisible = !!(canShowAgent && agent && agent.visible);
    const isPushMode = panelConfig && panelConfig.mode === 'push';
    const appViewportWidth =
      isPanelVisible && isPushMode
        ? `calc(100% - ${panelConfig.width}px)`
        : '100%';
    const viewportCssVars = getAgentViewportCssVars({
      isPanelVisible,
      panelConfig,
    });

    return (
      <div className={styles.rootShell} style={viewportCssVars}>
        <div
          className={`${styles.appViewport} ${
            isPanelVisible && isPushMode
              ? styles.appViewportPush
              : styles.appViewportFull
          }`}
          style={{ width: appViewportWidth }}
        >
          {children}
          {this.renderViewportLock()}
        </div>
        {canShowAgent && this.store ? (
          <AgentHost
            agent={agent || {}}
            currentUser={currentUser}
            dispatch={this.store.dispatch}
            panelConfig={panelConfig}
          />
        ) : null}
      </div>
    );
  }
}
