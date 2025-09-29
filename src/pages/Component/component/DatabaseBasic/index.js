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
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';

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
      // 保留 KB 原生状态用于与 native 进行“ready”判断
      raw_status: raw
    };
  };

  // 合并原生 status 与 KB status: 仅当两者均为 running 时显示 running，否则以 KB 的状态为准
  getMergedStatus = (rbdStatus, clusterDetail) => {
    // nativeStatus: 父组件传入的原有状态对象，包含 status/status_cn/start_time
    const kbStatus = this.extractKBStatus(clusterDetail);
    if (!kbStatus) return rbdStatus;
    const isRBDRunning = rbdStatus && rbdStatus.status === 'running';
    const isKbRunning = kbStatus && kbStatus.raw_status === 'running';
    if (isRBDRunning && isKbRunning) {
      return rbdStatus;
    }
    return {
      status: kbStatus.status || (rbdStatus && rbdStatus.status),
      status_cn: kbStatus.status_cn || (rbdStatus && rbdStatus.status_cn),
      start_time: kbStatus.start_time || (rbdStatus && rbdStatus.start_time)
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

    // 根据业务约束合并 native 与 KB 状态，仅当二者均 running 时显示 running，否则使用 KB 状态
    const status = this.getMergedStatus(originStatus, clusterDetail);

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