import React, { Fragment, PureComponent } from 'react';
import { getDvaApp } from 'umi';
import AgentHost from './index';
import styles from './RootShell.less';
import {
  buildAgentContext,
  getAgentRouteSignature,
  isAgentRouteHidden,
} from '../../utils/agentContext';
import { persistAgentSession } from '../../services/agent';
import { getAgentPanelConfig } from '../../utils/agentLayout';

export default class AgentRootShell extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: null,
      needLogin: false,
      agent: null,
      location: {},
      panelConfig: getAgentPanelConfig(),
    };
    this.store = null;
    this.unsubscribe = null;
    this.retryTimer = null;
    this.prevLoginKey = '';
    this.prevPathSignature = '';
    this.prevAgentUpdatedAt = 0;
    this.isSyncingContext = false;
  }

  componentDidMount() {
    this.attachStoreWithRetry();
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
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
    const pathSignature = getAgentRouteSignature(location);

    if (loginKey !== previousLoginKey) {
      this.prevLoginKey = loginKey;
      this.prevAgentUpdatedAt = 0;

      if (previousLoginKey && !loginKey) {
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
      persistAgentSession(agent, loginKey);
      this.prevAgentUpdatedAt = agent.updatedAt;
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

  shouldShowAgent = () => {
    const { currentUser, needLogin, location } = this.state;
    return !!currentUser && !needLogin && !isAgentRouteHidden(location);
  };

  render() {
    const { children } = this.props;
    const { agent, currentUser, panelConfig } = this.state;
    const canShowAgent = this.shouldShowAgent();
    const isPanelVisible = !!(canShowAgent && agent && agent.visible);
    const isPushMode = panelConfig && panelConfig.mode === 'push';
    const appViewportWidth =
      isPanelVisible && isPushMode
        ? `calc(100% - ${panelConfig.width}px)`
        : '100%';

    return (
      <div className={styles.rootShell}>
        <div
          className={`${styles.appViewport} ${
            isPanelVisible && isPushMode
              ? styles.appViewportPush
              : styles.appViewportFull
          }`}
          style={{ width: appViewportWidth }}
        >
          {children}
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
