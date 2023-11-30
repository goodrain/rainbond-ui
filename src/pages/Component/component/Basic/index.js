/* eslint-disable no-nested-ternary */
import { Col, Form, Row, Tooltip,Card ,Skeleton} from 'antd';
// eslint-disable-next-line import/first
import numeral from 'numeral';
import React, { Fragment, PureComponent } from 'react';
import globalUtil from '../../../../utils/global';
import cookie from '../../../../utils/cookie';
import styles from '../../Index.less';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

@Form.create()
class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      language : cookie.get('language') === 'zh-CN' ? true : false,
    };
  }
  componentDidMount() {}

  handleMore = state => {
    const { handleMore, onPageChange } = this.props;
    if (handleMore && onPageChange) {
      onPageChange(1);
      handleMore(state);
    }
  };
   titleCase = (str) => {
    str = str.toLowerCase();
    var attr = str.split(" ");
    for(var i =0;i<attr.length;i++){
       attr[i]=attr[i].substring(0,1).toUpperCase() + attr[i].substring(1);
    }
    return attr.join(" ");
  }
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
      method
    } = this.props;
    const setMemory = memory === 0 ? <FormattedMessage id='componentOverview.body.tab.overview.unlimited'/> : numeral(memory).format('0,0');
    return (
      <Row gutter={24}>
        {!isThird && status && Object.keys(status).length >0 ? (
        <Col xs={24} xm={24} md={24} lg={24} xl={24}>
          <div
            className={styles.buildBox}
            style={{
              background: globalUtil.fetchStateBJColor(status && status.status)
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
                  {(status && language  ?  this.titleCase(status.status_cn) :  this.titleCase(status.status)) || ''}
                </h2>
                <div className={styles.buildCommitInfo}>
                  <ul className={styles.buildInfo}>
                    {status &&
                      status.status !== 'undeploy' &&
                      status.status !== 'undeploy' &&
                      status.status !== 'closed' && (
                        <li>
                          <a target="_blank">
                            {globalUtil.fetchSvg('runTime')}
                            {/* 运行 */}
                            <FormattedMessage id='componentOverview.body.tab.overview.run'/>
                            <span
                              style={{
                                color: 'rgba(0,0,0,0.45)',
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
                        {globalUtil.fetchSvg('distributionMemory')}
                        {/* 分配 */}
                        <FormattedMessage id='componentOverview.body.tab.overview.allocation'/>
                        {!resourcesLoading && (
                          <Fragment>
                            <Tooltip title={setMemory}>
                              <span
                                style={{
                                  color: 'rgba(0,0,0,0.45)',
                                  padding: '0 20px',
                                  minWidth: '80px'
                                }}
                              >
                                {setMemory}
                              </span>
                            </Tooltip>
                            {memory !== 0 && <FormattedMessage id='componentOverview.body.tab.overview.memory'/>}
                          </Fragment>
                        )}
                      </a>
                    </li>
                    <li>
                      <a>
                        {globalUtil.fetchSvg('useDisk')}
                        {/* 占用 */}
                        <FormattedMessage id='componentOverview.body.tab.overview.occupy'/>
                        {!resourcesLoading && (
                          <Fragment>
                            <Tooltip title={numeral(disk).format('0,0')}>
                              <span
                                style={{
                                  color: 'rgba(0,0,0,0.45)',
                                  padding: '0 20px',
                                  minWidth: '80px'
                                }}
                              >
                                {numeral(disk).format('0,0')}
                              </span>
                            </Tooltip>
                            {/* MB 磁盘 */}
                            <FormattedMessage id='componentOverview.body.tab.overview.disk'/>
                          </Fragment>
                        )}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              {method == 'vm' ? (
                <div className={styles.buildRightBox}>
                  <h2 className={` ${styles.en_alcen} ${styles.buildState} `}>
                  <span className={` ${styles.en_alcen}  `}>
                    {globalUtil.fetchSvg('basicInfo')}

                    <span style={{ color: 'rgba(0,0,0,0.65)' }}>
                      {/* 版本号 */}
                      虚拟机镜像
                    </span>
                  </span>
                  <span
                    style={{
                      color:
                        beanData && beanData.vm_image
                          ? '#39aa56'
                          : 'rgba(0, 0, 0, 0.45)'
                    }}
                  >
                    {beanData && beanData.vm_image
                      ? beanData.vm_image
                      : <FormattedMessage id='componentOverview.body.tab.overview.not'/>}
                  </span>
                </h2>
                </div>
              ):(
                <div className={styles.buildRightBox}>
                <h2 className={` ${styles.en_alcen} ${styles.buildState} `}>
                  <span className={` ${styles.en_alcen}  `}>
                    {globalUtil.fetchSvg('version')}

                    <span style={{ color: 'rgba(0,0,0,0.65)' }}>
                      {/* 版本号 */}
                      <FormattedMessage id='componentOverview.body.tab.overview.version'/>
                    </span>
                  </span>
                  <span
                    style={{
                      color:
                        beanData && beanData.build_version
                          ? '#39aa56'
                          : 'rgba(0, 0, 0, 0.45)'
                    }}
                  >
                    {beanData && beanData.build_version
                      ? beanData.build_version
                      : <FormattedMessage id='componentOverview.body.tab.overview.not'/>}
                  </span>
                </h2>
                <div className={styles.buildCommitInfo}>
                  <ul className={styles.buildInfo}>
                    <li>
                      <a target="_blank">
                        <span
                          className={` ${styles.en_alcen}  `}
                        >
                          {globalUtil.fetchSvg('warehouse')}
                          {buildSource && buildSource === 'source_code'
                            ? <FormattedMessage id='componentOverview.body.tab.overview.codeVersion'/>
                            : buildSource === 'package_build'
                            ? <FormattedMessage id='componentOverview.body.tab.overview.file'/>
                            : <FormattedMessage id='componentOverview.body.tab.overview.warehouse.address'/>}
                        </span>
                        <Tooltip
                          title={
                            beanData &&
                            (beanData.kind && beanData.kind === '源码构建'
                              ? beanData.code_version && ''
                              : beanData.kind && beanData.kind === '本地文件'
                              ? beanData.code_version
                              : beanData.image_domain && beanData.image_domain)
                          }
                        >
                          <span className={styles.buildText}>
                            {beanData
                              ? beanData.kind &&
                                beanData.kind === '源码构建' && beanData.code_version && buildSource && buildSource === 'source_code'
                                ? beanData.code_version.substr(0, 8)
                                : beanData.kind && beanData.kind === '本地文件' && beanData.code_version && buildSource && buildSource === 'package_build'
                                ? beanData.code_version
                                : beanData.image_domain
                                ? beanData.image_domain
                                : <FormattedMessage id='componentOverview.body.tab.overview.not'/>
                              : <FormattedMessage id='componentOverview.body.tab.overview.not'/>}
                          </span>
                        </Tooltip>
                      </a>
                    </li>
                    <li>
                      <a target="_blank">
                        <span
                          className={` ${styles.en_alcen}  `}
                        >
                          {globalUtil.fetchSvg('basicInfo')}
                          {buildSource && buildSource === 'source_code'
                            ?  <FormattedMessage id='componentOverview.body.tab.overview.submit'/>
                            : buildSource === 'package_build'
                            ?  <FormattedMessage id='componentOverview.body.tab.overview.fileName'/>
                            :  <FormattedMessage id='componentOverview.body.tab.overview.imageName'/>}
                        </span>
                        <Tooltip
                          title={
                            beanData &&
                            (beanData.kind && beanData.kind === '源码构建'
                              ? beanData.code_commit_msg &&
                                beanData.code_commit_msg
                              : beanData.kind && beanData.kind === '本地文件'
                              ? beanData.code_commit_msg &&
                                beanData.code_commit_msg
                              : beanData.image_repo && beanData.image_repo)
                          }
                        >
                          <span className={styles.buildText}>
                            {beanData
                              ? beanData.kind && beanData.kind === '源码构建'
                                ? beanData.code_commit_msg &&
                                  beanData.code_commit_msg
                                : beanData.kind && beanData.kind === '本地文件'
                                ? beanData.code_commit_msg &&
                                  beanData.code_commit_msg
                                : beanData.image_repo
                                ? beanData.image_repo
                                : <FormattedMessage id='componentOverview.body.tab.overview.not'/>
                              : <FormattedMessage id='componentOverview.body.tab.overview.not'/>}
                          </span>
                        </Tooltip>
                      </a>
                    </li>
                    <li>
                      <a target="_blank">
                        <span
                          className={` ${styles.en_alcen}  `}
                        >
                          {globalUtil.fetchSvg('branch')}

                          {buildSource && buildSource === 'source_code'
                            ? <FormattedMessage id='componentOverview.body.tab.overview.codeBranch'/>
                            : buildSource === 'package_build'
                            ? <FormattedMessage id='componentOverview.body.tab.overview.uploadTime'/>
                            : <FormattedMessage id='componentOverview.body.tab.overview.image'/>}
                        </span>
                        <Tooltip
                          title={
                            beanData &&
                            (beanData.kind && beanData.kind === '源码构建'
                              ? beanData.code_branch && beanData.code_branch
                              : beanData.kind && beanData.kind === '本地文件'
                              ? beanData.code_branch && beanData.code_branch
                              : beanData.image_tag && beanData.image_tag)
                          }
                        >
                          <span className={styles.buildText}>
                            {beanData
                              ? beanData.kind && beanData.kind === '源码构建'
                                ? beanData.code_branch && beanData.code_branch
                                : beanData.kind && beanData.kind === '本地文件'
                                ? beanData.code_branch && beanData.code_branch
                                : beanData.image_tag
                                ? beanData.image_tag
                                : <FormattedMessage id='componentOverview.body.tab.overview.not'/>
                              : <FormattedMessage id='componentOverview.body.tab.overview.not'/>}
                          </span>
                        </Tooltip>
                      </a>
                    </li>
                  </ul>
                  <p className={styles.buildAuthor}>
                    {dataList && dataList.length > 0 && !more ? (
                      <a
                        onClick={() => {
                          this.handleMore(true);
                        }}
                      >
                        {/* 查看更多版本 */}
                        <FormattedMessage id='componentOverview.body.tab.overview.moreVersion'/>
                      </a>
                    ) : (
                      more === true && (
                        <a
                          onClick={() => {
                            this.handleMore(false);
                          }}
                        >
                          {/* 返回实例列表 */}
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
                ):(
                  !isThird && 
                  <Card style={{ margin: '0px 12px' ,height:170}} bodyStyle={{padding:'5px 20px 5px'}}>
                  <Skeleton active />
                  </Card>
                )
          }
      </Row>
    );
  }
}

export default Index;
