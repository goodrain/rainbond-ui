import { Button, Icon } from 'antd';
import React, { PureComponent } from 'react';
import { captureFirstDeployGuide } from '../../posthog';
import { formatMessage } from '../../utils/intl';
import styles from './index.less';

export const featuredMarketApps = [
  {
    key: 'mysql',
    label: 'firstDeployGuide.market.mysql',
    modelKeys: {
      default: '7f0d0509699e4425964c71be4b0fa428'
    }
  },
  {
    key: 'redis',
    label: 'firstDeployGuide.market.redis',
    requiresArchitecture: true,
    modelKeys: {
      amd64: '6953c50771ae4548b9fed312d220d720',
      arm64: 'd6c01070c6b049dbaf3de6757a1b63ef',
      default: '6953c50771ae4548b9fed312d220d720'
    }
  },
  {
    key: 'nacos',
    label: 'firstDeployGuide.market.nacos',
    modelKeys: {}
  }
];

export default class FirstDeployGuide extends PureComponent {
  componentDidMount() {
    const { guideLocation, marketAvailable } = this.props;
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
      market_app_key: properties.market_app_key || ''
    });
    onEntry(entry, properties);
  };

  render() {
    const { marketAvailable, guideLocation, featuredApps = [] } = this.props;
    const isTeamGuide = guideLocation === 'team_empty';

    return (
      <section className={styles.guide} data-testid="rbd-first-deploy-guide">
        <div className={styles.hero}>
          <Icon type="rocket" className={styles.heroIcon} />
          <div>
            <h2>{formatMessage({ id: isTeamGuide ? 'firstDeployGuide.team.title' : 'firstDeployGuide.app.title' })}</h2>
            <p>{formatMessage({ id: isTeamGuide ? 'firstDeployGuide.team.description' : 'firstDeployGuide.app.description' })}</p>
          </div>
        </div>
        {isTeamGuide && (
          <Button type="primary" size="large" onClick={() => this.handleEntry('example_image')}>
            {formatMessage({ id: 'firstDeployGuide.exampleImage' })}
          </Button>
        )}
        {marketAvailable && (
          <div className={styles.marketSection}>
            <div className={styles.sectionTitle}>{formatMessage({ id: 'firstDeployGuide.market.title' })}</div>
            {isTeamGuide && featuredApps.map(app => (
              <Button
                key={app.key}
                onClick={() => this.handleEntry('market_featured', {
                  market_app_key: app.modelKey,
                  market_app: app
                })}
              >
                {formatMessage({ id: app.label })}
              </Button>
            ))}
            <Button onClick={() => this.handleEntry('market_all')}>{formatMessage({ id: 'firstDeployGuide.market.all' })}</Button>
          </div>
        )}
        <div className={styles.secondaryEntries}>
          <Button onClick={() => this.handleEntry('image')}>
            <Icon type="container" />{formatMessage({ id: 'firstDeployGuide.image' })}
          </Button>
          <Button onClick={() => this.handleEntry('source_code')}>
            <Icon type="code" />{formatMessage({ id: 'firstDeployGuide.sourceCode' })}
          </Button>
        </div>
        {!marketAvailable && <p className={styles.offlineHint}>{formatMessage({ id: 'firstDeployGuide.market.unavailable' })}</p>}
      </section>
    );
  }
}
