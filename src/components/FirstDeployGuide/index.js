import { Button, Icon } from 'antd';
import React, { PureComponent } from 'react';
import { captureFirstDeployGuide } from '../../posthog';
import { formatMessage } from '../../utils/intl';
import { getFeaturedMarketSearchName, resolveFeaturedMarketApp } from './marketApps';

export const featuredMarketApps = [
  {
    key: 'mysql',
    label: 'firstDeployGuide.market.mysql',
    description: 'firstDeployGuide.market.mysql.description',
    searchNames: { default: 'Mysql' },
    modelKeys: {
      default: '7f0d0509699e4425964c71be4b0fa428'
    }
  },
  {
    key: 'redis',
    label: 'firstDeployGuide.market.redis',
    description: 'firstDeployGuide.market.redis.description',
    searchNames: {
      amd64: 'Redis',
      arm64: 'Redis单机版ARM',
      default: 'Redis'
    },
    modelKeys: {
      amd64: '6953c50771ae4548b9fed312d220d720',
      arm64: 'd6c01070c6b049dbaf3de6757a1b63ef',
      default: '6953c50771ae4548b9fed312d220d720'
    }
  }
];

export { getFeaturedMarketSearchName, resolveFeaturedMarketApp };

const featuredAppOrder = featuredMarketApps.map(app => app.key);

// 应用市场返回的图标加载失败时，退回中性的通用图标
class StarterLogo extends PureComponent {
  state = { failed: false };

  handleError = () => this.setState({ failed: true });

  render() {
    const { src, cardStyles } = this.props;
    if (!src || this.state.failed) {
      return (
        <span className={`${cardStyles.appIcon} ${cardStyles.starterIconNeutral}`}>
          <Icon type="appstore" aria-hidden="true" />
        </span>
      );
    }
    return (
      <span className={`${cardStyles.appIcon} ${cardStyles.starterIconLogo}`}>
        <img src={src} alt="" onError={this.handleError} />
      </span>
    );
  }
}

/**
 * 空团队的起步卡片。渲染在团队首页应用卡片网格里、「新建应用」卡片之后，
 * 复用宿主网格传入的应用卡片样式（cardStyles），自身不带页面级布局。
 */
export default class FirstDeployGuide extends PureComponent {
  componentDidMount() {
    this.captureViewed();
  }

  componentDidUpdate() {
    this.captureViewed();
  }

  captureViewed = () => {
    const { guideLocation, marketAvailable, marketResolved } = this.props;
    if (this.viewed || !marketResolved) {
      return;
    }
    this.viewed = true;
    captureFirstDeployGuide('viewed', {
      guide_location: guideLocation,
      market_available: !!marketAvailable
    });
  }

  handleEntry = (entry, properties = {}) => {
    const { guideLocation, marketAvailable, onEntry } = this.props;
    captureFirstDeployGuide('clicked', {
      guide_location: guideLocation,
      entry,
      market_available: !!marketAvailable,
      featured_app: properties.featured_app || ''
    });
    onEntry(entry, properties);
  };

  renderCard = ({ key, recommended, icon, title, subtitle, description, action, actionIcon, actionTestId, onClick }) => {
    const { cardStyles } = this.props;
    const cardClassName = [
      cardStyles.teamHotAppItem,
      cardStyles.starterCard,
      recommended ? cardStyles.starterCardRecommended : ''
    ].filter(Boolean).join(' ');

    return (
      <div key={key}>
        <div data-testid={`rbd-starter-card-${key}`} className={cardClassName} onClick={onClick}>
          <div className={cardStyles.appStatusBar}></div>
          <div className={cardStyles.appCardContent}>
            <div className={cardStyles.appCardHeader}>
              <div className={cardStyles.appCardHeaderLeft}>
                {icon}
                <div className={cardStyles.appNameWrapper}>
                  <span className={cardStyles.appName}>{title}</span>
                  <span className={cardStyles.appComponentSummary}>{subtitle}</span>
                </div>
              </div>
              {recommended && (
                <div className={cardStyles.appCardHeaderRight}>
                  <div className={`${cardStyles.appCardStatus} ${cardStyles.starterTag}`}>
                    <span className={cardStyles.statusText}>
                      {formatMessage({ id: 'firstDeployGuide.recommended' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className={cardStyles.appMetaRow}>
              <span className={cardStyles.appMetaItem} title={description}>{description}</span>
            </div>
            <div className={`${cardStyles.appCardActions} ${cardStyles.starterCardActions}`}>
              {/* 点击冒泡到整张卡片统一处理，避免重复上报 */}
              <Button
                data-testid={actionTestId}
                type={recommended ? 'primary' : 'default'}
                className={cardStyles.appActionButton}
              >
                <Icon type={actionIcon} aria-hidden="true" />
                <span>{action}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { featuredApps = [], canCreate, cardStyles } = this.props;
    // 没有创建权限时不提供任何创建入口，仅保留曝光上报，提示文案由宿主网格展示
    if (!canCreate) {
      return null;
    }
    const orderedApps = featuredApps
      .slice()
      .sort((a, b) => featuredAppOrder.indexOf(a.key) - featuredAppOrder.indexOf(b.key));

    return (
      <div className={cardStyles.starterCards} data-testid="rbd-first-deploy-guide">
        {this.renderCard({
          key: 'example',
          recommended: true,
          icon: (
            <span className={`${cardStyles.appIcon} ${cardStyles.starterIconPrimary}`}>
              <Icon type="rocket" aria-hidden="true" />
            </span>
          ),
          title: formatMessage({ id: 'firstDeployGuide.example.title' }),
          subtitle: formatMessage({ id: 'firstDeployGuide.example.subtitle' }),
          description: formatMessage({ id: 'firstDeployGuide.example.description' }),
          action: formatMessage({ id: 'firstDeployGuide.example.action' }),
          actionIcon: 'thunderbolt',
          actionTestId: 'rbd-starter-deploy-example',
          onClick: () => this.handleEntry('example_image')
        })}
        {orderedApps.map(app => this.renderCard({
          key: app.key,
          icon: (
            <StarterLogo
              cardStyles={cardStyles}
              src={app.marketApp && (app.marketApp.logo || app.marketApp.icon)}
            />
          ),
          title: formatMessage({ id: app.label }),
          subtitle: formatMessage({ id: 'firstDeployGuide.market.source' }),
          description: formatMessage({ id: app.description }),
          action: formatMessage({ id: 'firstDeployGuide.market.install' }),
          actionIcon: 'download',
          actionTestId: `rbd-starter-install-${app.key}`,
          onClick: () => this.handleEntry('market_featured', {
            featured_app: app.key,
            market_app: app
          })
        }))}
      </div>
    );
  }
}
