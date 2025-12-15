/* eslint-disable no-nested-ternary */
import { Col, Form, Row, Tooltip, Card, Skeleton } from 'antd';
// eslint-disable-next-line import/first
import numeral from 'numeral';
import React, { Fragment, PureComponent } from 'react';
import globalUtil from '../../../../utils/global';
import moment from 'moment';
import Svg from '../../../../utils/pageHeaderSvg.js';
import cookie from '../../../../utils/cookie';
import styles from '../../Index.less';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';

// KubeBlocks Component 定制组件, source: ./src/pages/Component/component/Basic/index.js

@Form.create()
class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      language: cookie.get('language') === 'zh-CN'
    };
  }
  componentDidMount() { }

  titleCase = str => {
    str = str.toLowerCase();
    var attr = str.split(' ');
    for (var i = 0; i < attr.length; i++) {
      attr[i] = attr[i].substring(0, 1).toUpperCase() + attr[i].substring(1);
    }
    return attr.join(' ');
  };
  // 将 KubeBlocks ClusterDetail 的状态映射为 rainbond-ui 可识别的状态结构
  mapKBStatusToRBD = kbStatus => {
    if (!kbStatus) return 'unKnow';
    const val = String(kbStatus).toLowerCase();
    // 适配常见状态到 UI 约定的 fetchStateColor / fetchStateBJColor 枚举
    if (val === 'creating') return 'starting';
    if (val === 'running') return 'running';
    if (val === 'updating') return 'upgrade';
    if (val === 'stopping' || val === 'deleting') return 'stopping';
    if (val === 'stopped') return 'closed';
    if (val === 'failed') return 'failed';
    if (val === 'abnormal') return 'ABNORMAL';
    return 'unKnow';
  };

  // 从 clusterDetail 中提取 basic.status 并构造成 UI 的 status 结构
  extractKBStatus = clusterDetail => {
    // clusterDetail 结构: { basic: { status: { status, status_cn, start_time } }, resource, backup }
    const basic = clusterDetail && clusterDetail.basic;
    const kbStatus = basic && basic.status ? basic.status : null;
    if (!kbStatus) return null;
    const raw = kbStatus.status || kbStatus.phase || kbStatus.state || '';
    const mapped = this.mapKBStatusToRBD(raw);
    return {
      status: mapped,
      status_cn: kbStatus.status_cn || null,
      start_time: kbStatus.start_time || null,
      raw_status: raw
    };
  };


  render() {
    const { language } = this.state;
    const {
      status: originStatus,
      resourcesLoading,
      memory,
      disk,
      showStorageUsed,
      storageUsed,
      clusterDetail
    } = this.props;

    const status = this.extractKBStatus(clusterDetail);

    const setMemory =
      memory === 0 && !showStorageUsed ? (
        <FormattedMessage id="componentOverview.body.tab.overview.unlimited" />
      ) : (
        numeral(memory).format('0,0')
      );
    return (
      <Row>
        {status && Object.keys(status).length > 0 ? (
          <Col xs={24} xm={24} md={24} lg={24} xl={24}>
            <div
              className={styles.buildBox}
              style={{
                background: globalUtil.fetchStateBJColor(
                  status && status.status
                )
              }}
            >
              <div className={styles.buildContent}>
                <div className={styles.buildLeftBox}>
                  <h2
                    className={styles.buildState}
                    style={{
                      color: globalUtil.fetchStateColor(status && status.status)
                    }}
                  >
                    {(status && language
                      ? this.titleCase(status.status_cn)
                      : this.titleCase(status.status)) || ''}
                  </h2>
                  <div className={styles.buildCommitInfo}>
                    <ul className={styles.buildInfo}>
                      {status &&
                        status.status !== 'undeploy' &&
                        status.status !== 'undeploy' &&
                        status.status !== 'closed' && (
                          <li>
                            <a target="_blank">
                              {Svg.getSvg(
                                'runTime',
                                16,
                                'rbd-content-color-secondary'
                              )}
                              {/* 运行 */}
                              <FormattedMessage id="componentOverview.body.tab.overview.run" />
                              <span
                                style={{
                                  color: globalUtil.getPublicColor(
                                    'rbd-content-color'
                                  ),
                                  paddingLeft: '20px'
                                }}
                              >
                                {status && status.start_time
                                  ? globalUtil.fetchTime(
                                    Date.parse(new Date()) -
                                    new Date(status.start_time).getTime()
                                  )
                                  : ''}
                              </span>
                            </a>
                          </li>
                        )}
                      <li>
                        <a>
                          {' '}
                          {Svg.getSvg(
                            'fenpei',
                            16,
                            'rbd-content-color-secondary'
                          )}
                          {/* 分配 */}
                          <FormattedMessage id="componentOverview.body.tab.overview.allocation" />
                          {!resourcesLoading && (
                            <Fragment>
                              <Tooltip title={setMemory}>
                                <span
                                  style={{
                                    color: globalUtil.getPublicColor(
                                      'rbd-content-color'
                                    ),
                                    padding: '0 20px',
                                    minWidth: '80px'
                                  }}
                                >
                                  {setMemory}
                                </span>
                              </Tooltip>
                              {(memory !== 0 || showStorageUsed) && (
                                <FormattedMessage id="componentOverview.body.tab.overview.memory" />
                              )}
                            </Fragment>
                          )}
                        </a>
                      </li>
                      <li>
                        <a>
                          {' '}
                          {Svg.getSvg(
                            'zhanyong',
                            16,
                            'rbd-content-color-secondary'
                          )}
                          {/* 占用 */}
                          <FormattedMessage id="componentOverview.body.tab.overview.occupy" />
                          {!resourcesLoading && (
                            <Fragment>
                              <Tooltip
                                title={`${numeral(disk).format('0,0')} Gi`}
                              >
                                <span
                                  style={{
                                    color: globalUtil.getPublicColor(
                                      'rbd-content-color'
                                    ),
                                    padding: '0 20px',
                                    minWidth: '80px'
                                  }}
                                >
                                  {numeral(disk).format('0,0')}
                                </span>
                              </Tooltip>
                              {/* 固定以 Gi 为单位并保留“磁盘”标签 */}
                              {'Gi'}&nbsp;
                              {formatMessage({ id: 'componentOverview.body.tab.overview.disk' })}
                            </Fragment>
                          )}
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className={styles.buildRightBox}>
                  <h2 className={` ${styles.en_alcen} ${styles.buildState} `}>
                    <span className={` ${styles.en_alcen}  `}>
                      {Svg.getSvg('database', 16, 'rbd-content-color-secondary')}
                      <span style={{ color: globalUtil.getPublicColor('rbd-content-color-secondary') }}>
                        <FormattedMessage id='componentOverview.body.tab.overview.databaseType' />
                      </span>
                    </span>
                    <span
                      style={{
                        color:
                          clusterDetail?.basic?.type
                            ? globalUtil.getPublicColor('rbd-success-status')
                            : globalUtil.getPublicColor('rbd-content-color')
                      }}
                    >
                      {clusterDetail?.basic?.type || <FormattedMessage id='componentOverview.body.tab.overview.not' />}
                    </span>
                  </h2>
                  <div className={styles.buildCommitInfo}>
                    <ul className={styles.buildInfo}>
                      <li>
                        <a target="_blank">
                          <span
                            className={` ${styles.en_alcen}  `}
                          >
                            {Svg.getSvg('banben', 16, 'rbd-content-color-secondary')}
                            <FormattedMessage id='componentOverview.body.tab.overview.databaseVersion' />
                          </span>
                          <span className={styles.buildText}>
                            {clusterDetail?.basic?.version || <FormattedMessage id='componentOverview.body.tab.overview.not' />}
                          </span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        ) : (
          <Card
            style={{ margin: '0px 12px', height: 170 }}
            bodyStyle={{ padding: '5px 20px 5px' }}
          >
            <Skeleton active />
          </Card>
        )}
      </Row>
    );
  }
}

export default Index;
