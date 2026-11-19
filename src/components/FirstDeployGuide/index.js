import { Button, Icon } from 'antd';
import React, { PureComponent } from 'react';
import { captureFirstDeployGuide } from '../../posthog';
import { formatMessage } from '../../utils/intl';
import { getFeaturedMarketSearchName, resolveFeaturedMarketApp } from './marketApps';
import styles from './index.less';

export const featuredMarketApps = [
  {
    key: 'mysql',
    label: 'firstDeployGuide.market.mysql',
    searchNames: { default: 'Mysql' },
    modelKeys: {
      default: '7f0d0509699e4425964c71be4b0fa428'
    }
  },
  {
    key: 'redis',
    label: 'firstDeployGuide.market.redis',
    requiresArchitecture: true,
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

  render() {
    const { marketAvailable, marketResolved, guideLocation, featuredApps = [], canCreate } = this.props;

    return (
      <section className={styles.guide} data-testid="rbd-first-deploy-guide">
        <div className={styles.hero}>
          <Icon type="rocket" className={styles.heroIcon} />
          <div>
            <h2>{formatMessage({ id: 'firstDeployGuide.team.title' })}</h2>
            <p>{formatMessage({ id: 'firstDeployGuide.team.description' })}</p>
          </div>
        </div>
        {canCreate && (
          <Button type="primary" size="large" onClick={() => this.handleEntry('example_image')}>
            {formatMessage({ id: 'firstDeployGuide.exampleImage' })}
          </Button>
        )}
        {marketAvailable && canCreate && (
          <div className={styles.marketSection}>
            <div className={styles.sectionTitle}>{formatMessage({ id: 'firstDeployGuide.market.title' })}</div>
            {featuredApps.map(app => (
              <Button
                key={app.key}
                onClick={() => this.handleEntry('market_featured', {
                  featured_app: app.key,
                  market_app: app
                })}
              >
                {formatMessage({ id: app.label })}
              </Button>
            ))}
            <Button onClick={() => this.handleEntry('market_all')}>{formatMessage({ id: 'firstDeployGuide.market.all' })}</Button>
          </div>
        )}
        {canCreate && <div className={styles.secondaryEntries}>
          <Button onClick={() => this.handleEntry('image')}>
            <Icon type="container" />{formatMessage({ id: 'firstDeployGuide.image' })}
          </Button>
          <Button onClick={() => this.handleEntry('source_code')}>
            <Icon type="code" />{formatMessage({ id: 'firstDeployGuide.sourceCode' })}
          </Button>
        </div>}
        {!canCreate && <p className={styles.offlineHint}>{formatMessage({ id: 'firstDeployGuide.noCreatePermission' })}</p>}
        {marketResolved && !marketAvailable && canCreate && <p className={styles.offlineHint}>{formatMessage({ id: 'firstDeployGuide.market.unavailable' })}</p>}
      </section>
    );
  }
}
