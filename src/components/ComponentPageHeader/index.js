import globalUtil from '@/utils/global';
import { Tabs, Row, Col, Button, Icon } from 'antd';
import classNames from 'classnames';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { createElement, PureComponent } from 'react';
import AppState from '../ApplicationState';

import styles from './index.less';

const { TabPane } = Tabs;

@connect()
export default class PageHeader extends PureComponent {
  static contextTypes = {
  };
  onChange = key => {
    if (this.props.onTabChange) {
      this.props.onTabChange(key);
    }
  };
  handleClose = () => {    
    this.props.dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview`
      )
    );
    const iframe = document.querySelector('#myframe');
    iframe?.contentWindow?.postMessage({
        type: 'TRIGGER_CLICK_BACKGROUND'
    }, '*');
  }
  render() {
    const {
      title,
      logo,
      action,
      content,
      tabList,
      className,
      tabActiveKey,
      isSvg,
      titleSvg,
      pluginSVg,
      status
    } = this.props;
    const clsString = classNames(styles.pageHeader, className);
    let tabDefaultValue;
    if (tabActiveKey !== undefined && tabList) {
      tabDefaultValue = tabList.filter(item => item.default)[0] || tabList[0];
    }
    const activeKeyProps = {
      defaultActiveKey: tabDefaultValue && tabDefaultValue.key
    };
    if (tabActiveKey !== undefined) {
      activeKeyProps.activeKey = tabActiveKey;
    }
    return (
      <>
        <div className={clsString}>
          <div className={styles.detail}>
            <div className={styles.main}>
              <div onClick={this.handleClose} className={styles.close} >
                <Icon type="close" style={{ fontSize: 16 }} />
              </div>
              <Row style={{ marginBottom: '4px' }}>
                <Col span={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: 32 }}>
                  {titleSvg && <div className={styles.title_svg}>{titleSvg}</div>}
                  {title && <div className={styles.title_style}>{title}</div>}
                  {status && <AppState AppStatus={status} />}
                </Col>
                <Col span={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {action && <div className={styles.action}>{action}</div>}
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  {content && <div className={styles.content}>{content}</div>}
                </Col>
              </Row>
              {/* <div className={styles.row} style={{ marginBottom: '4px' }}>
                {titleSvg && <div className={styles.title_svg}>{titleSvg}</div>}
                {title && <h1 className={styles.title}>{title}</h1>}
                {status && <AppState AppStatus={status} />}
                {action && <div className={styles.action}>{action}</div>}
              </div>
              <div className={styles.row}>
                {content && <div className={styles.content}>{content}</div>}
              </div> */}
            </div>
          </div>
        </div>
        {tabList && tabList.length && (
          <div className={styles.tabsStyle}>
            <Tabs
              className={styles.tabs}
              {...activeKeyProps}
              onChange={this.onChange}
              type='card'
            >
              {tabList.map(item => {
                const { key, tab } = item;
                return (
                  <TabPane
                    tab={
                      <span className={styles.verticalCen}>
                        {tab}
                      </span>
                    }
                    key={key}
                  />
                );
              })}
            </Tabs>
          </div>
        )}
      </>
    );
  }
}