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
  fetchAllVersion = () => {
    const { dispatch, rainbondInfo } = this.props
    const { activeKey, isShowComplete } = this.state
    const currentVersion = rainbondInfo.version.value.split('-')[0]

    dispatch({
      type: 'global/fetchAllVersion',
      callback: res => {
        if (res && res.response_data) {
          let list = res.response_data
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
      }
    })
  }
  fetchVersionDetails = (version) => {
    const { dispatch } = this.props
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
      dispatch({
        type: 'global/fetchVersionDetails',
        payload: {
          version
        },
        callback: res => {
          this.setState({
            activeKey: version,
            isShowContent: true,
            details: res.response_data.body,
            submit_version: version.split('-')[0],
          })
        }
      })
    })
  }
  handleSumbit = () => {
    this.setState({
      isShowModal: true
    })
  }
  fetchVersionData = () => {
    const { dispatch } = this.props
    const { isShowComplete, activeKey } = this.state
    if (isShowComplete === 'not_start') {
      this.setState({
        isShowComplete: 'pending',
        isShowModalClose: false,
        isShowModalFooter: false,
      }, () => {
        dispatch({
          type: 'global/fetchVersionData',
          payload: {
            version: activeKey,
          },
          callback: res => {
            if (res && res.response_data) {
              this.UpdateVersion(res.response_data)
            }
          }
        })
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
  UpdateVersion = (data) => {
    const { dispatch, rainbondInfo, enterprise: {enterprise_id} } = this.props
    const { versionList } = this.state
    const currentVersion = rainbondInfo.version.value.split('-')[0]

    dispatch({
      type: 'global/updateVersion',
      payload: {
        data
      },
      callback: res => {
        if (res && res.response_data && res.response_data.code === 200) {
          this.setState({
            isShowComplete: 'complete',
            isShowModalClose: true,
            isShowModalFooter: true,
          })
        }
      }
    })
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
          <svg viewBox="0 0 1024 1024" width="14" height="14">
            <path d="M512 0a512 512 0 1 1 0 1024A512 512 0 0 1 512 0z m0 85.333333a426.666667 426.666667 0 1 0 0 853.333334A426.666667 426.666667 0 0 0 512 85.333333z m0 597.333334a85.333333 85.333333 0 1 1 0 170.666666 85.333333 85.333333 0 0 1 0-170.666666z m0-512a79.872 79.872 0 0 1 79.616 85.162666l-18.944 284.757334a60.842667 60.842667 0 0 1-121.344 0l-18.944-284.757334A79.872 79.872 0 0 1 512 170.666667z"
              fill={globalUtil.getPublicColor()}
              p-id="6210" />
          </svg>
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
