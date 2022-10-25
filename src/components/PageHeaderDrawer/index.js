/* eslint-disable no-nested-ternary */
import globalUtil from '@/utils/global';
import { Breadcrumb, Icon, Tabs, Row, Col } from 'antd';
import classNames from 'classnames';
import { connect } from 'dva';
import pathToRegexp from 'path-to-regexp';
import PropTypes from 'prop-types';
import React, { createElement, PureComponent } from 'react';
import styles from './index.less';
import helm from '../../../public/images/store.svg'

const { TabPane } = Tabs;

function getBreadcrumb(breadcrumbNameMap, url) {
  let breadcrumb = {};
  Object.keys(breadcrumbNameMap).forEach(item => {
    if (pathToRegexp(item).test(url)) {
      breadcrumb = breadcrumbNameMap[item];
    }
  });
  return breadcrumb;
}
@connect()
export default class PageHeader extends PureComponent {
  constructor(arg) {
    super(arg)
    this.state = {
      back: '',
      helm: helm,
    }
  }
  static contextTypes = {
    routes: PropTypes.array,
    params: PropTypes.object,
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object
  };
  handleTitleList = values => {
    if (this.props.onTabChange) {
      this.props.onTabChange(values.key);
      this.setState({
        back: '#e3e3e3'
      })
    } else {
      this.setState({
        back: ''
      })
    }
  }
  onChange = key => {
    if (this.props.onTabChange) {
      this.props.onTabChange(key);
    }
  };
  getBreadcrumbProps = () => {
    return {
      routes: this.props.routes || this.context.routes,
      params: this.props.params || this.context.params,
      routerLocation: this.props.location || this.context.location,
      breadcrumbNameMap:
        this.props.breadcrumbNameMap || this.context.breadcrumbNameMap || {}
    };
  };
  // Generated according to props
  conversionFromProps = () => {
    const { breadcrumbList, linkElement = 'a' } = this.props;
    return (
      <Breadcrumb className={styles.breadcrumb}>
        {breadcrumbList.map((item, i) => (
          <Breadcrumb.Item key={`bread${i}`}>
            {item.icon ? (
              <Icon style={{ marginRight: '5px' }} type={item.icon} />
            ) : (
              ''
            )}
            {item.href
              ? createElement(
                linkElement,
                {
                  [linkElement === 'a' ? 'href' : 'to']: item.href
                },
                item.title
              )
              : item.title}
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
    );
  };
  conversionFromLocation = (routerLocation, breadcrumbNameMap) => {
    const { linkElement = 'a' } = this.props;
    // Convert the path to an array
    const pathSnippets = routerLocation.pathname.split('/').filter(i => i);
    // Loop data mosaic routing
    const extraBreadcrumbItems = pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;

      const currentBreadcrumb = getBreadcrumb(breadcrumbNameMap, url);
      const isLinkable =
        index !== pathSnippets.length - 1 && currentBreadcrumb.component;
      return currentBreadcrumb.name && !currentBreadcrumb.hideInBreadcrumb ? (
        <Breadcrumb.Item key={url}>
          {createElement(
            isLinkable ? linkElement : 'span',
            {
              [linkElement === 'a' ? 'href' : 'to']: url
            },
            currentBreadcrumb.name
          )}
        </Breadcrumb.Item>
      ) : null;
    });
    return (
      <Breadcrumb className={styles.breadcrumb}>
        {extraBreadcrumbItems}
      </Breadcrumb>
    );
  };
  /**
   * 将参数转化为面包屑
   * Convert parameters into breadcrumbs
   */
  conversionBreadcrumbList = () => {
    const { breadcrumbList } = this.props;
    const {
      routes,
      params,
      routerLocation,
      breadcrumbNameMap
    } = this.getBreadcrumbProps();

    if (breadcrumbList && breadcrumbList.length) {
      return this.conversionFromProps();
    }

    // 如果传入 routes 和 params 属性 If pass routes and params attributes
    if (routes && params) {
      return (
        <Breadcrumb
          className={styles.breadcrumb}
          routes={routes.filter(route => route.breadcrumbName)}
          params={params}
          itemRender={this.itemRender}
        />
      );
    }
    // 根据 location 生成 面包屑 Generate breadcrumbs based on location
    if (location && location.pathname) {
      return this.conversionFromLocation(routerLocation, breadcrumbNameMap);
    }
    return null;
  };
  // 渲染Breadcrumb 子节点 Render the Breadcrumb child node
  itemRender = (route, params, routes, paths) => {
    const { linkElement = 'a' } = this.props;
    const last = routes.indexOf(route) === routes.length - 1;
    return last || !route.component ? (
      <span>{route.breadcrumbName}</span>
    ) : (
      createElement(
        linkElement,
        {
          href: paths.join('/') || '/',
          to: paths.join('/') || '/'
        },
        route.breadcrumbName
      )
    );
  };
  render() {
    const {
      title,
      logo,
      action,
      content,
      extraContent,
      tabList,
      className,
      tabActiveKey,
      isSvg
    } = this.props;
    const { back } = this.state
    const appMarketSvg = globalUtil.fetchSvg('appmarket');
    const clsString = classNames(styles.pageHeader, className);
    // const { teamName, regionName } = this.props.match.params;
    let tabDefaultValue;
    if (tabActiveKey !== undefined && tabList) {
      tabDefaultValue = tabList.filter(item => item.default)[0] || tabList[0];
    }
    const breadcrumb = this.conversionBreadcrumbList();
    const activeKeyProps = {
      defaultActiveKey: tabDefaultValue && tabDefaultValue.key
    };
    if (tabActiveKey !== undefined) {
      activeKeyProps.activeKey = tabActiveKey;
    }

    return (
      <div className={clsString}>
        {/* disable breadcrumb */}
        {/* {breadcrumb} */}
        <div className={styles.detail}>
          {logo && <div className={styles.logo}>{logo}</div>}
          <div className={styles.main}>
            <div className={styles.row}>
              {title && <h1 className={styles.title}>{title}</h1>}
              {action && <div className={styles.action}>{action}</div>}
            </div>
            <div className={styles.row}>
              {content && <div className={styles.content}>{content}</div>}
              {extraContent && (
                <div className={styles.extraContent}>{extraContent}</div>
              )}
            </div>
          </div>
        </div>
        <div style={{display:'flex'}}>
          {tabList.map(item => {
            const { key, tab } = item;
            return (
              <Col
                style={{width:'20%'}}
                {...activeKeyProps}
                className={styles.ServiceDiv}
                onClick={this.handleTitleList.bind(this, item)}
              >
                {isSvg &&
                  globalUtil.fetchSvg(
                    key === 'localApplication'
                      // ? 'appComponent'
                      // : key.indexOf('Helm-') > -1 ? 
                      // 'HelmSvgs': 
                      // 'appmarket'
                      ? 'location_drawer_store'
                      : key.indexOf('Helm-') > -1 ?
                      'helm_drawer_store'
                      :
                      'openSource_drawer_store'
                  )}
                  {/* {!(key === 'localApplication') && key.indexOf('Helm-') > -1 && <img src={helm} alt="" />} */}
                <p className={styles.ServiceSmallTitle}>{tab}</p>
              </Col>
            );
          })}
        </div>
      </div>
    );
  }
}
