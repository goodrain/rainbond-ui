/* eslint-disable no-nested-ternary */
import { Col, Form, Row, Tooltip,Card ,Skeleton} from 'antd';
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

@Form.create()
class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      language: cookie.get('language') === 'zh-CN',
    };
  }

  handleMore = state => {
    const { handleMore, onPageChange } = this.props;
    if (handleMore && onPageChange) {
      onPageChange(1);
      handleMore(state);
    }
  };
  titleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  render() {
    const { language } = this.state; 
    const {
      status,
      beanData,
      more,
      resourcesLoading,
      memory,
      disk,
      dataList,
      buildSource,
      isThird,
      method,
      showStorageUsed,
      storageUsed
    } = this.props;
    
    const setMemory = (memory === 0 && !showStorageUsed) ? <FormattedMessage id='componentOverview.body.tab.overview.unlimited'/> : numeral(memory).format('0,0');
    const hasStatus = status && Object.keys(status).length > 0;
    const currentStatus = status?.status || '';
    const statusDisplay = (status && language) ? this.titleCase(status.status_cn || currentStatus) : this.titleCase(currentStatus);

    return (
      <Row>
        {!isThird && hasStatus ? (
        <Col xs={24} xm={24} md={24} lg={24} xl={24}>
          <div
            className={styles.buildBox}
            style={{
              background: globalUtil.fetchStateBJColor(currentStatus)
            }}
          >
            <div className={styles.buildContent}>
              <div className={styles.buildLeftBox}>
                <h2
                  className={styles.buildState}
                  style={{
                    color: globalUtil.fetchStateColor(currentStatus)
                  }}
                >
                  {statusDisplay}
                </h2>
                <div className={styles.buildCommitInfo}>
                  <ul className={styles.buildInfo}>
                    {currentStatus !== 'undeploy' && currentStatus !== 'closed' && (
                        <li>
                          <a target="_blank">
                            {Svg.getSvg('runTime',16,'rbd-content-color-secondary')}
                            <FormattedMessage id='componentOverview.body.tab.overview.run'/>
                            <span
                              style={{
                                color: globalUtil.getPublicColor('rbd-content-color'),
                                paddingLeft: '20px'
                              }}
                            >
                              {status?.start_time
                                ? globalUtil.fetchTime(
                                    Date.now() - new Date(status.start_time).getTime()
                                  )
                                : ''}
                            </span>
                          </a>
                        </li>
                      )}
                    <li>
                      <a>
                      {Svg.getSvg('fenpei',16,'rbd-content-color-secondary')}
                        <FormattedMessage id='componentOverview.body.tab.overview.allocation'/>
                        {!resourcesLoading && (
                          <Fragment>
                            <Tooltip title={setMemory}>
                              <span
                                style={{
                                  color: globalUtil.getPublicColor('rbd-content-color'),
                                  padding: '0 20px',
                                  minWidth: '80px'
                                }}
                              >
                                {setMemory}
                              </span>
                            </Tooltip>
                            {(memory !== 0 || showStorageUsed) &&<FormattedMessage id='componentOverview.body.tab.overview.memory'/>}
                          </Fragment>
                        )}
                      </a>
                    </li>
                    <li>
                      <a>
                      {Svg.getSvg('zhanyong',16,'rbd-content-color-secondary')}
                        <FormattedMessage id='componentOverview.body.tab.overview.occupy'/>
                        {!resourcesLoading && (
                          <Fragment>
                            <Tooltip title={showStorageUsed ? storageUsed?.value : numeral(disk).format('0,0')}>
                              <span
                                style={{
                                  color: globalUtil.getPublicColor('rbd-content-color'),
                                  padding: '0 20px',
                                  minWidth: '80px'
                                }}
                              >
                                {showStorageUsed ? storageUsed?.value : numeral(disk).format('0,0')}
                              </span>
                            </Tooltip>
                            {showStorageUsed ? storageUsed?.unit : 'MB'}&nbsp;
                            {formatMessage({id:'componentOverview.body.tab.overview.disk'})}
                          </Fragment>
                        )}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              {method === 'vm' ? (
                <div className={styles.buildRightBox}>
                  <h2 className={` ${styles.en_alcen} ${styles.buildState} `}>
                  <span className={` ${styles.en_alcen}  `}>
                    {globalUtil.fetchSvg('basicInfo')}
                    <span style={{ color: globalUtil.getPublicColor('rbd-title-color') }}>
                      <FormattedMessage id='componentOverview.body.tab.overview.vmImage'/>
                    </span>
                  </span>
                  <span
                    style={{
                      color: beanData?.vm_image
                        ? globalUtil.getPublicColor('rbd-success-status')
                        : globalUtil.getPublicColor('rbd-content-color')
                    }}
                  >
                    {beanData?.vm_image || <FormattedMessage id='componentOverview.body.tab.overview.not'/>}
                  </span>
                </h2>
                </div>
              ):(
                <div className={styles.buildRightBox}>
                <h2 className={` ${styles.en_alcen} ${styles.buildState} `}>
                  <span className={` ${styles.en_alcen}  `}>
                  {Svg.getSvg('banben',16,'rbd-content-color-secondary')}
                    <span style={{ color: globalUtil.getPublicColor('rbd-content-color-secondary') }}>
                      <FormattedMessage id='componentOverview.body.tab.overview.version'/>
                    </span>
                  </span>
                  <span
                    style={{
                      color: beanData?.build_version
                        ? globalUtil.getPublicColor('rbd-success-status')
                        : globalUtil.getPublicColor('rbd-content-color')
                    }}
                  >
                    {beanData?.build_version || <FormattedMessage id='componentOverview.body.tab.overview.not'/>}
                  </span>
                </h2>
                <div className={styles.buildCommitInfo}>
                  <ul className={styles.buildInfo}>
                    <li>
                      <a target="_blank">
                        <span className={` ${styles.en_alcen}  `}>
                          {Svg.getSvg((buildSource === 'source_code' ? 'code' : buildSource === 'package_build' ? 'MD5' : 'dizhi'), 16, 'rbd-content-color-secondary')}
                          {buildSource === 'source_code'
                            ? <FormattedMessage id='componentOverview.body.tab.overview.codeVersion'/>
                            : buildSource === 'package_build'
                            ? <FormattedMessage id='componentOverview.body.tab.overview.file'/>
                            : <FormattedMessage id='componentOverview.body.tab.overview.warehouse.address'/>}
                        </span>
                        <Tooltip
                          title={
                            beanData?.kind === '源码构建' ? '' :
                            beanData?.kind === '本地文件' ? beanData.code_version :
                            beanData?.image_domain
                          }
                        >
                          <span className={styles.buildText}>
                            {beanData?.kind === '源码构建' && beanData.code_version && buildSource === 'source_code'
                              ? beanData.code_version.substr(0, 8)
                              : beanData?.kind === '本地文件' && beanData.code_version && buildSource === 'package_build'
                              ? beanData.code_version
                              : beanData?.image_domain || <FormattedMessage id='componentOverview.body.tab.overview.not'/>}
                          </span>
                        </Tooltip>
                      </a>
                    </li>
                    <li>
                      <a target="_blank">
                        <span className={` ${styles.en_alcen}  `}>
                          {Svg.getSvg((buildSource === 'source_code' ? 'msg' : buildSource === 'package_build' ? 'fileName' : 'jingxiang'), 16, 'rbd-content-color-secondary')}
                          {buildSource === 'source_code'
                            ?  <FormattedMessage id='componentOverview.body.tab.overview.submit'/>
                            : buildSource === 'package_build'
                            ?  <FormattedMessage id='componentOverview.body.tab.overview.fileName'/>
                            :  <FormattedMessage id='componentOverview.body.tab.overview.imageName'/>}
                        </span>
                        <Tooltip
                          title={
                            beanData?.kind === '源码构建' || beanData?.kind === '本地文件'
                              ? beanData.code_commit_msg
                              : beanData?.image_repo
                          }
                        >
                          <span className={styles.buildText}>
                            {beanData?.kind === '源码构建' || beanData?.kind === '本地文件'
                              ? beanData.code_commit_msg || <FormattedMessage id='componentOverview.body.tab.overview.not'/>
                              : beanData?.image_repo || <FormattedMessage id='componentOverview.body.tab.overview.not'/>}
                          </span>
                        </Tooltip>
                      </a>
                    </li>
                    <li>
                      <a target="_blank">
                        <span className={` ${styles.en_alcen}  `}>
                          {Svg.getSvg((buildSource === 'source_code' ? 'fenzhi' : buildSource === 'package_build' ? 'upLoad' : 'jingxiangTga'), 16, 'rbd-content-color-secondary')}
                          {buildSource === 'source_code'
                            ? <FormattedMessage id='componentOverview.body.tab.overview.codeBranch'/>
                            : buildSource === 'package_build'
                            ? <FormattedMessage id='componentOverview.body.tab.overview.uploadTime'/>
                            : <FormattedMessage id='componentOverview.body.tab.overview.image'/>}
                        </span>
                        <Tooltip
                          title={
                            beanData?.kind === '源码构建' ? beanData.code_branch :
                            beanData?.kind === '本地文件' ? (beanData.code_branch && moment(beanData.code_branch).format('YYYY-MM-DD HH:mm:ss')) :
                            beanData?.image_tag
                          }
                        >
                          <span className={styles.buildText}>
                            {beanData?.kind === '源码构建'
                              ? beanData.code_branch || <FormattedMessage id='componentOverview.body.tab.overview.not'/>
                              : beanData?.kind === '本地文件'
                              ? (beanData.code_branch && moment(beanData.code_branch).format('YYYY-MM-DD HH:mm:ss')) || <FormattedMessage id='componentOverview.body.tab.overview.not'/>
                              : beanData?.image_tag || <FormattedMessage id='componentOverview.body.tab.overview.not'/>}
                          </span>
                        </Tooltip>
                      </a>
                    </li>
                  </ul>
                  <p className={styles.buildAuthor}>
                    {dataList && dataList.length > 0 && !more ? (
                      <a onClick={() => this.handleMore(true)}>
                        <FormattedMessage id='componentOverview.body.tab.overview.moreVersion'/>
                      </a>
                    ) : (
                      more && (
                        <a onClick={() => this.handleMore(false)}>
                          <FormattedMessage id='componentOverview.body.tab.overview.return'/>
                        </a>
                      )
                    )}
                  </p>
                </div>
              </div>
              )}
              
            </div>
          </div>
        </Col>
        ) : (
          !isThird &&
          <Card style={{ margin: '0px 12px', height: 170 }} bodyStyle={{ padding: '5px 20px 5px' }}>
            <Skeleton active />
          </Card>
        )}
      </Row>
    );
  }
}

export default Index;
