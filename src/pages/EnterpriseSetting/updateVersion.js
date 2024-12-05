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
  Descriptions,
  Card,
  Row
} from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ConfirmModal from '../../components/ConfirmModal';
import globalUtil from '../../utils/global';
import ReactMarkdown from 'react-markdown';
import EscalationState from '../../components/EscalationState'
import Result from '../../components/Result'
import styles from './index.less'

const { Panel } = Collapse;

@connect()

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
      handleError: false
    };
  }
  componentDidMount() {
    this.fetchAllVersion()
  }
  // 获取全部主机版本
  fetchAllVersion = () => {
    const { rainbondInfo, dispatch } = this.props
    const { activeKey, isShowComplete } = this.state
    const currentVersion = rainbondInfo.version.value.split('-')[0]
    dispatch({
      type: 'global/fetchAllVersion',
      callback: res => {
        if (res) {
          let list = res.response_data
          const filterList = list.filter(item => item.split('-')[0] === currentVersion)
          const isNewVs = list[0].split('-')[0] === currentVersion
          if (isShowComplete === 'complete') {
            this.setState({
              isShowComplete: 'not_start',
            })
          }
          if (isNewVs) {
            this.setState({
              activeKey: list[0],
              loading: false,
              versionList: filterList,
              isShowVersionList: false
            }, () => {
              this.fetchVersionDetails(list[0])
            })
          } else {
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
      },
      handleError: () => {
        this.setState({
          handleError: true
        })
      }
    })
  }
  // 获取主机版本详情
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
          version: version
        },
        callback: res => {
          if (res && res.response_data) {
            this.setState({
              selsectValue: res.response_data,
              activeKey: version,
              isShowContent: true,
              details: res.response_data.body,
              submit_version: version.split('-')[0],
            })
          }
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
      })
      dispatch({
        type: 'global/fetchVersionData',
        payload: {
          version: activeKey
        },
        callback: res => {
          this.updateVersion(res.response_data)
        }
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
    const { dispatch } = this.props
    dispatch({
      type: 'global/updateVersion',
      payload: {
        value: data
      },
      callback: res => {
        this.setState({
          isShowComplete: 'complete',
          isShowModalClose: true,
          isShowModalFooter: true,
        })
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
  showToUpdata = (bool) => {
    this.setState({
      toUpdata: bool
    })
  }
  handleSubmitUpdata = () => {
    this.setState({
      toUpdata: false
    })
    this.fetchVersionData()
  }
  complete = () => {
    this.setState({
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
    }, () => {
      this.fetchAllVersion()
    })
  }
  render() {
    const { isShowVersionList, activeKey, loading, versionList, details, isShowContent, isShowModal, isShowComplete, submit_version, isShowModalClose, isShowModalFooter, selsectValue, toUpdata, handleError } = this.state
    const { rainbondInfo } = this.props
    console.log(handleError, 'handleError');
    const currentVersion = rainbondInfo.version.value.split('-')[0]
    const message = <p className={styles.noversion}>{formatMessage({ id: 'platformUpgrade.EscalationState.nowVersionis' })}<span>{currentVersion}</span> {formatMessage({ id: 'platformUpgrade.EscalationState.read' })}</p>
    const version = selsectValue?.tag_name.split('-')[0]
    const noversion = <p className={styles.noversion}>{formatMessage({ id: 'platformUpgrade.EscalationState.nowVersionis' })}<span>{version}</span> {formatMessage({ id: 'platformUpgrade.EscalationState.newVersion' })}</p>
    const updataVs = <p className={styles.noversion}>{formatMessage({ id: 'platformUpgrade.EscalationState.nowVersionis' })}<span>{currentVersion}</span> {formatMessage({ id: 'platformUpgrade.EscalationState.beUpdataVs' })}<span>{version}</span></p>
    const antIcon = <Icon type="check-circle" style={{ fontSize: 50 }} />
    const handleVersionSvg = (item) => (
      <div className={styles.svg_style}>
        <Tooltip title={formatMessage({ id: 'enterpriseSetting.updateVersion.tooltip.title' })}>
          {globalUtil.fetchSvg('updateVersion')}
        </Tooltip>
        <span>{item}</span>
      </div>
    );

    return (
      <div style={{ padding: '0' }}>
        {handleError ?
          <Empty />
          :
          <>
            {!isShowModal &&
              <>
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
                                          <Button onClick={this.handleSumbit} type='primary'>{formatMessage({ id: 'platformUpgrade.EscalationState.goUpdata' })}</Button>
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
                    <>
                      <Alert className={styles.alert_style} message={noversion} type="success" />
                      <Descriptions bordered>
                        <Descriptions.Item label={formatMessage({ id: 'platformUpgrade.EscalationState.nowVs' })}>{selsectValue?.tag_name}</Descriptions.Item>
                        <Descriptions.Item label={formatMessage({ id: 'platformUpgrade.EscalationState.updatatime' })} span={2}>{selsectValue?.update_time}</Descriptions.Item>
                        <Descriptions.Item label={formatMessage({ id: 'platformUpgrade.EscalationState.githubadd' })} span={3}>
                          <a href={selsectValue?.html_url} target="_blank">
                            {selsectValue?.html_url}
                          </a>
                        </Descriptions.Item>
                        <Descriptions.Item label={formatMessage({ id: 'platformUpgrade.EscalationState.updatainfo' })}>
                          <ReactMarkdown
                            source={details}
                            className={styles.markdown}
                          />
                        </Descriptions.Item>
                      </Descriptions>
                    </>
                  )
                }
              </>
            }

            {isShowModal &&
              <>
                {isShowComplete === 'not_start' ? (
                  <>
                    <Card title={formatMessage({ id: 'platformUpgrade.EscalationState.updatadetails' })} >
                      <Descriptions bordered title={
                        <div className={styles.DescriptionsTitle}>
                          {formatMessage({ id: 'platformUpgrade.EscalationState.vs' })}
                          <span>{currentVersion}</span>
                          {formatMessage({ id: 'platformUpgrade.EscalationState.updatatovs' })}
                          <span>{version}</span>
                        </div>
                      }>
                        <Descriptions.Item label={formatMessage({ id: 'platformUpgrade.EscalationState.newvs' })}>{selsectValue?.tag_name}</Descriptions.Item>
                        <Descriptions.Item label={formatMessage({ id: 'platformUpgrade.EscalationState.newvsupload' })} span={2}>{selsectValue?.update_time}</Descriptions.Item>
                        <Descriptions.Item label={formatMessage({ id: 'platformUpgrade.EscalationState.githubadd' })} span={3}>
                          <a href={selsectValue?.html_url} target="_blank">
                            {selsectValue?.html_url}
                          </a>
                        </Descriptions.Item>
                        <Descriptions.Item label={formatMessage({ id: 'platformUpgrade.EscalationState.newvsinfo' })}>
                          <ReactMarkdown
                            source={details}
                            className={styles.markdown}
                          />
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                    <Row justify='center' type="flex" style={{ marginTop: 24 }}>
                      <Button type='primary' onClick={() => this.showToUpdata(true)} style={{ marginRight: 16 }}>{formatMessage({ id: 'platformUpgrade.EscalationState.updata' })}</Button>
                      <Button onClick={this.handleCancel}>{formatMessage({ id: 'platformUpgrade.EscalationState.back' })}</Button>
                    </Row>
                  </>
                ) : (
                  <>
                    <EscalationState isShowComplete={isShowComplete} complete={this.complete} />
                  </>
                )}
              </>
            }
          </>
        }
        {toUpdata &&
          <ConfirmModal
            title={formatMessage({ id: 'platformUpgrade.EscalationState.updataplatform' })}
            subDesc={formatMessage({ id: 'platformUpgrade.EscalationState.310' })}
            desc={formatMessage({ id: 'platformUpgrade.EscalationState.info' })}
            onOk={this.handleSubmitUpdata}
            onCancel={() => this.showToUpdata(false)}
          />
        }
      </div>
    )
  }
}
