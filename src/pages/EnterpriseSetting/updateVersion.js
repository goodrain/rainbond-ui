import React, { PureComponent } from 'react';
import {
    Button,
    Collapse,
    Skeleton,
    Modal,
    Spin,
    Icon,
    Empty,
    Alert,
    Tooltip,
} from 'antd';
import { routerRedux } from 'dva/router';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import ReactMarkdown from 'react-markdown';
import { fetchAllVersion, fetchVersionDetails, fetchVersionData, updateVersion } from '../../services/api'
import styles from './index.less'

const { Panel } = Collapse;

export default class UpdateVersion extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
        versionList: [],
        details: '',
        submit_version: '',
        activeKey: '',
        isShowVersionList: true,
        loading: true,
        isShowModal: false,
        isShowContent: false,
        isShowModalClose: true,
        isShowModalFooter: true,
        isShowComplete: 'not_start',
    };
  }
  componentDidMount () {
    this.fetchAllVersion()
  }
  // 获取全部主机版本
  fetchAllVersion = () => {
    const { rainbondInfo } = this.props
    const { activeKey, isShowComplete } = this.state
    const currentVersion = rainbondInfo.version.value.split('-')[0]

    fetchAllVersion().then(res => {
      if (res) {
        let list = res
        const filterList = list.filter(item => item.split('-')[0] === currentVersion)
        if (isShowComplete === 'complete') {
          this.setState({
            isShowComplete: 'not_start',
          })
        }
        if (list[0].split('-')[0] === currentVersion || filterList.length === 0) {
          this.setState({
            isShowVersionList: false
          })
        } else {
          this.setState({
            activeKey: list[0]
          }, () => {
            this.fetchVersionDetails(list[0])
          })
          list.forEach((item, index) => {
            if (item.split('-')[0] === currentVersion && index !== 0) {
              this.setState({
                loading: false,
                versionList: list.slice(0, index)
              })
            }
          })
        }
      }
    }).catch(e => {console.log(e)})
  }
  // 获取主机版本详情
  fetchVersionDetails = (version) => {
    const { activeKey } = this.state

    if (version === undefined) {
      this.setState({
        activeKey: '',
      })
      return
    }
    this.setState({
      activeKey: '',
      isShowContent: false
    }, () => {
      fetchVersionDetails(version).then(res => {
        if (res && res.body) {
          this.setState({
            activeKey: version,
            isShowContent: true,
            details: res.body,
            submit_version: version.split('-')[0],
          })
        }
      }).catch(e => {console.log(e)})
    })
  }
  handleSumbit = () => {
    this.setState({
      isShowModal: true
    })
  }
  fetchVersionData = () => {
    const { isShowComplete, activeKey } = this.state
    if (isShowComplete === 'not_start') {
      this.setState({
        isShowComplete: 'pending',
        isShowModalClose: false,
        isShowModalFooter: false,
      }, () => {
        fetchVersionData(activeKey).then(res => {
          if (res) {
            this.updateVersion(res)
          }
        }).catch(e => {console.log(e)})
      })
    }
    if (isShowComplete === 'complete') {
      this.setState({
        isShowModal: false,
      }, () => {
        this.fetchAllVersion()
      })
    }
  }
  // 更新主机版本
  updateVersion = (data) => {
    updateVersion(data).then(res => {
      if (res && res.code === 200) {
        this.setState({
          isShowComplete: 'complete',
          isShowModalClose: true,
          isShowModalFooter: true,
        })
      }
    }).catch(e => {console.log(e)})
  }
  handleCancel = () => {
    this.setState({
      isShowModal: false
    }, () => {
      if (this.state.isShowComplete === 'complete') {
        this.fetchAllVersion()
      }
    })
  }

  render () {
    const { isShowVersionList, activeKey, loading, versionList, details, isShowContent, isShowModal, isShowComplete, submit_version, isShowModalClose, isShowModalFooter } = this.state
    const { rainbondInfo } = this.props
    const currentVersion = rainbondInfo.version.value.split('-')[0]
    const message = formatMessage({ id: 'enterpriseSetting.updateVersion.alert.title' }, { title: currentVersion })
    const antIcon = <Icon type="check-circle" style={{ fontSize: 50 }}/>
    const handleVersionSvg = (item) => (
      <div className={styles.svg_style}>
        <Tooltip title={formatMessage({ id: 'enterpriseSetting.updateVersion.tooltip.title' })}>
          {globalUtil.fetchSvg('updateVersion')}
        </Tooltip>
        <span>{item}</span>
      </div>
    );

    return (
      <div style={{ padding: '10px 0' }}>
        {
          isShowVersionList ? (
            <Skeleton loading={loading} active>
              <Alert className={styles.alert_style} message={message} type="info" />
              <Collapse className={styles.panel_style} activeKey={activeKey} expandIconPosition='right' accordion onChange={this.fetchVersionDetails}>
                {
                  versionList && versionList.length > 0 && (
                    versionList.map((item, index) => {
                      return (
                        <Panel header={handleVersionSvg(item)} key={item} extra={formatMessage({ id: 'enterpriseSetting.updateVersion.collapse.panel.title' })}>
                          {
                            isShowContent ? (
                              <>
                                <ReactMarkdown
                                  source={details}
                                  className={styles.markdown}
                                />
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end'
                                }}>
                                  <Button onClick={this.handleSumbit} type='primary'><FormattedMessage id='button.update' /></Button>
                                </div>
                              </>
                            ) : (
                              <Spin className={styles.spin_style}></Spin>
                            )
                          }
                        </Panel>
                      )
                    })
                  )
                }
              </Collapse>
            </Skeleton>
          ) : (
            <Empty />
          )
        }
        <Modal
          title={formatMessage({ id: 'enterpriseSetting.updateVersion.modal.title' })}
          visible={isShowModal}
          className={styles.modal_style}
          closable={isShowModalClose}
          // footer={null}
          maskClosable={false}
          onOk={this.fetchVersionData}
          onCancel={this.handleCancel}
          footer={
            isShowModalFooter && (
              <div className={styles.modal_footer}>
                <Button onClick={this.handleCancel}><FormattedMessage id='button.cancel' /></Button>
                <Button type='primary' onClick={this.fetchVersionData}><FormattedMessage id='button.confirm' /></Button>
              </div>
            )
          }
        >
          {
            isShowComplete === 'not_start' ? (
              <>
                <p className={styles.p_style}>{formatMessage({ id: 'enterpriseSetting.updateVersion.modal.content_title' }, {title: submit_version})}</p>
                <p style={{
                  textAlign: 'center',
                  color: '#A8A8A8',
                  fontSize: 12,
                }}>{formatMessage({ id: 'enterpriseSetting.updateVersion.modal.content_desc' })}</p>
              </>
            ) : (
              isShowComplete === 'pending' ? (
                <div className={styles.spin_box}>
                  <Spin size="large" tip={formatMessage({ id: 'enterpriseSetting.updateVersion.result.update_title' })}></Spin>
                </div>
              ) : (
                <div className={styles.spin_box_success} style={{height: isShowComplete === 'complete' && 80}}>
                  <Spin indicator={antIcon} size="large" tip={formatMessage({ id: 'enterpriseSetting.updateVersion.result.update_success' })}/>
                </div>
              )
            )
          }
        </Modal>
      </div>
    )
  }
}
