/* eslint-disable no-nested-ternary */
import { Col, Form, Row, Tooltip } from 'antd';
// eslint-disable-next-line import/first
import numeral from 'numeral';
import React, { Fragment, PureComponent } from 'react';
import globalUtil from '../../../../utils/global';
import styles from '../../Index.less';

@Form.create()
class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {};
  }
  componentDidMount() {}

  handleMore = state => {
    const { handleMore, onPageChange } = this.props;
    if (handleMore && onPageChange) {
      onPageChange(1);
      handleMore(state);
    }
  };
  render() {
    const {
      status,
      beanData,
      more,
      resourcesLoading,
      memory,
      disk,
      dataList,
      buildSource
    } = this.props;

    const setMemory = memory === 0 ? '不限制' : numeral(memory).format('0,0');
    return (
      <Row gutter={24}>
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
                  {(status && status.status_cn) || ''}
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
                            运行
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
                        分配
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
                            {memory !== 0 && 'MB 内存'}
                          </Fragment>
                        )}
                      </a>
                    </li>
                    <li>
                      <a>
                        {globalUtil.fetchSvg('useDisk')}
                        占用
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
                            MB 磁盘
                          </Fragment>
                        )}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className={styles.buildRightBox}>
                <h2 className={` ${styles.alcen} ${styles.buildState} `}>
                  <span className={` ${styles.alcen} ${styles.buildwidth} `}>
                    {globalUtil.fetchSvg('version')}

                    <span style={{ color: 'rgba(0,0,0,0.65)' }}>版本号</span>
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
                      : '暂无'}
                  </span>
                </h2>
                <div className={styles.buildCommitInfo}>
                  <ul className={styles.buildInfo}>
                    <li>
                      <a target="_blank">
                        <span
                          className={` ${styles.alcen} ${styles.buildwidth} `}
                        >
                          {globalUtil.fetchSvg('warehouse')}
                          {buildSource && buildSource === 'source_code'
                            ? '代码版本'
                            : buildSource === 'package_build'
                            ? '文件MD5'
                            : '仓库地址'}
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
                                : '暂无'
                              : '暂无'}
                          </span>
                        </Tooltip>
                      </a>
                    </li>
                    <li>
                      <a target="_blank">
                        <span
                          className={` ${styles.alcen} ${styles.buildwidth} `}
                        >
                          {globalUtil.fetchSvg('basicInfo')}
                          {buildSource && buildSource === 'source_code'
                            ? '提交信息' 
                            : buildSource === 'package_build'
                            ? '文件名称'
                            : '镜像名称'}
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
                                : '暂无'
                              : '暂无'}
                          </span>
                        </Tooltip>
                      </a>
                    </li>
                    <li>
                      <a target="_blank">
                        <span
                          className={` ${styles.alcen} ${styles.buildwidth} `}
                        >
                          {globalUtil.fetchSvg('branch')}

                          {buildSource && buildSource === 'source_code'
                            ? '代码分支'
                            : buildSource === 'package_build'
                            ? '上传时间'
                            : '镜像tag'}
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
                                : '暂无'
                              : '暂无'}
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
                        查看更多版本
                      </a>
                    ) : (
                      more === true && (
                        <a
                          onClick={() => {
                            this.handleMore(false);
                          }}
                        >
                          返回实例列表
                        </a>
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    );
  }
}

export default Index;
