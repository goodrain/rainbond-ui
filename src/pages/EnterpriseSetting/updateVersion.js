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
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ConfirmModal from '../../components/ConfirmModal';
import globalUtil from '../../utils/global';
import ReactMarkdown from 'react-markdown';
import { fetchAllVersion, fetchVersionDetails, fetchVersionData, updateVersion } from '../../services/api'
import Result from '../../components/Result'
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
  componentDidMount() {
    this.fetchAllVersion()
  }
  // 获取全部主机版本
  fetchAllVersion = () => {
    const { rainbondInfo } = this.props
    const { activeKey, isShowComplete } = this.state
    const currentVersion = rainbondInfo.version.value.split('-')[0]
    // const currentVersion = 'v5.17.3'
    fetchAllVersion().then(res => {
      if (res) {
        let list = res
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
    }).catch(e => { console.log(e) })
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
            selsectValue: res,
            activeKey: version,
            isShowContent: true,
            details: res.body,
            submit_version: version.split('-')[0],
          })
        }
      }).catch(e => { console.log(e) })
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
        }).catch(e => { console.log(e) })
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
        }, () => {
          window.sessionStorage.removeItem('isShowUpdateVersion')
        })
      }
    }).catch(e => { console.log(e) })
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
    const { isShowVersionList, activeKey, loading, versionList, details, isShowContent, isShowModal, isShowComplete, submit_version, isShowModalClose, isShowModalFooter, selsectValue, toUpdata } = this.state
    const { rainbondInfo } = this.props
    const currentVersion = rainbondInfo.version.value.split('-')[0]
    const message = <p className={styles.noversion}>当前平台版本是：<span>{currentVersion}</span> 请仔细阅读版本详情确认是否更新。</p>
    const version = selsectValue?.tag_name.split('-')[0]
    const noversion = <p className={styles.noversion}>当前平台版本是：<span>{version}</span> 已经是最新版本，无需升级更新。</p>
    const updataVs = <p className={styles.noversion}>当前平台版本是：<span>{currentVersion}</span> 您将要更新到版本：<span>{version}</span></p>
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
      <div style={{ padding: '24px' }}>

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
                                      <Button onClick={this.handleSumbit} type='primary'>去更新</Button>
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
                    <Descriptions.Item label="当前版本号">{selsectValue?.tag_name}</Descriptions.Item>
                    <Descriptions.Item label="更新时间" span={2}>{selsectValue?.published_at}</Descriptions.Item>
                    <Descriptions.Item label="GitHub地址" span={3}>
                      <a href={selsectValue?.html_url} target="_blank">
                        {selsectValue?.html_url}
                      </a>
                    </Descriptions.Item>
                    <Descriptions.Item label="版本更新信息">
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
                <Card title='更新详情' >
                  <Descriptions bordered title={
                    <div className={styles.DescriptionsTitle}>
                      版本：
                      <span>{currentVersion}</span>
                      更新到版本：
                      <span>{version}</span>
                    </div>
                  }>
                    <Descriptions.Item label="新版本号">{selsectValue?.tag_name}</Descriptions.Item>
                    <Descriptions.Item label="新版本上传时间" span={2}>{selsectValue?.published_at}</Descriptions.Item>
                    <Descriptions.Item label="GitHub地址" span={3}>
                      <a href={selsectValue?.html_url} target="_blank">
                        {selsectValue?.html_url}
                      </a>
                    </Descriptions.Item>
                    <Descriptions.Item label="新版本更新信息">
                      <ReactMarkdown
                        source={details}
                        className={styles.markdown}
                      />
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
                <Row justify='center' type="flex" style={{ marginTop: 24 }}>
                  <Button type='primary' onClick={() => this.showToUpdata(true)} style={{ marginRight: 16 }}>更新</Button>
                  <Button onClick={this.handleCancel}>返回</Button>
                </Row>
              </>
            ) : (
              <Result
                type={isShowComplete === 'pending' ? 'ing' : 'success'}
                title={isShowComplete === 'pending' ? `平台升级进行中，请耐心等待...` : '平台升级成功'}
                description={isShowComplete === 'pending' && '请勿进行其他操作，请耐心等待平台升级完成。'}
                style={{
                  marginTop: 48,
                  marginBottom: 16
                }}
                actions={isShowComplete === 'pending' ? <></> : <Button type='primary' onClick={() => this.complete()} style={{ marginRight: 16 }}>返回</Button>}
              />
            )}

          </>
        }

        {toUpdata &&
          <ConfirmModal
            title='更新平台版本'
            subDesc={`为保障数据安全，请您在开始升级前做好数据备份工作。`}
            desc='请注意！点击确认按钮后，请勿做其他任何操作，一旦升级流程开始将不可取消。'
            onOk={this.handleSubmitUpdata}
            onCancel={() => this.showToUpdata(false)}
          />
        }
      </div>
    )
  }
}
