/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-multi-assign */
/* eslint-disable no-undef */
/* eslint-disable jsx-a11y/iframe-has-title */
/* eslint-disable react/no-multi-comp */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  notification,
  Radio,
  Row,
  Select,
  Tabs
} from 'antd';
import axios from 'axios';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import PluginStyles from '../../pages/Create/Index.less';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import Ellipsis from '../Ellipsis';
import HelmForm from '../HelmForm';

const RadioGroup = Radio.Group;
const { TabPane } = Tabs;
const { Option } = Select;

@connect(({ user, global }) => ({
  currUser: user.currentUser,
  rainbondInfo: global.rainbondInfo
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(post) {
    super(post);
    this.state = {
      currStep: this.props.currStep || 0,
      loading: false,
      alertText: false,
      marketUrl: '',
      accessKey: '',
      activeKeyStore: 'rainbondStore',
      marketList: [],
      checkedValues: []
    };
  }
  componentWillMount() {
    // eslint-disable-next-line func-names
    window.addEventListener('message', res => {
      if (res.data && res.data.accessKey) {
        return this.handleNextStep(3, res.data.accessKey);
      }
    });

    const { currStep } = this.props;
    if (currStep === 2) {
      this.setState({ loading: true }, () => {
        this.getAppMarketInfo();
      });
    }
  }
  onChangeCheckbox = checkedValues => {
    this.setState({
      checkedValues
    });
  };
  getAppMarketInfo = () => {
    const { dispatch, eid, marketName } = this.props;
    const payload = Object.assign(
      {},
      {
        name: marketName,
        enterprise_id: eid
      }
    );
    dispatch({
      type: 'market/fetchAppMarketInfo',
      payload,
      callback: res => {
        if (res && res.status_code === 200) {
          if (res.list && res.list.url) {
            this.setState({
              marketUrl: res.list.url
            });
            this.handleCurrStep(2);
          } else {
            this.handleCurrStep(1);
          }
          this.handleClose();
        }
      }
    });
  };
  handleBindingMarketsList = accessKey => {
    const { dispatch, eid, marketName } = this.props;
    const { marketUrl } = this.state;
    const payload = Object.assign(
      {},
      {
        market_name: marketName,
        market_url: marketUrl,
        access_key: accessKey,
        enterprise_id: eid
      }
    );
    dispatch({
      type: 'market/fetchBindingMarketsList',
      payload,
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            marketList: res.list,
            accessKey
          });
          this.handleCurrStep(4);
          this.handleClose();
        }
      },
      handleError: () => {
        this.handleClose();
      }
    });
  };

  handleNextStep = (stpe, parameter) => {
    this.setState({ loading: true }, () => {
      if (stpe === 1) {
        this.getAppMarketInfo();
      } else if (stpe === 2) {
        this.handleMarketUrl();
      } else if (stpe === 3) {
        this.handleBindingMarketsList(parameter);
      }
    });
  };

  handleCurrStep = step => {
    this.setState({
      currStep: step
    });
  };
  handleMarketUrl = () => {
    const { form } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        this.handleIsCloudAppStoreUrl(values.url);
      }
    });
  };
  handleIsCloudAppStoreUrl = url => {
    const { dispatch } = this.props;
    axios
      .get(`${url}/app-server/openapi/healthz`)
      .then(res => {
        if (res && res.data && res.data.isRainstore) {
          this.setState({
            marketUrl: url,
            currStep: 2,
            loading: false,
            alertText: false
          });
        } else {
          this.handleNoCloudAppStoreUrl();
        }
      })
      .catch(() => {
        this.handleNoCloudAppStoreUrl();
      });
  };
  handleNoCloudAppStoreUrl = () => {
    this.setState({
      alertText: '应用市场不可用，请检查应用市场地址，或联系应用市场的管理员',
      loading: false
    });
  };
  handleOkMarkets = () => {
    const { form, marketName } = this.props;
    const { marketList, checkedValues, accessKey, marketUrl } = this.state;
    form.validateFields(err => {
      if (!err) {
        this.setState({ loading: true }, () => {
          const arr = [];
          checkedValues.map(items => {
            marketList.map(item => {
              if (item.domain === items && marketName) {
                item.name = marketName;
              } else {
                item.name = `a${this.uuid(16, 16)}`;
              }
              item.access_key = accessKey;
              item.type = 'rainstore';
              if (item.domain === items) {
                arr.push(item);
              }
            });
          });
          const { dispatch, eid, onCancel } = this.props;
          const payload = Object.assign(
            {},
            {
              markets: arr,
              enterprise_id: eid
            }
          );
          dispatch({
            type: 'market/addBindingMarkets',
            payload,
            callback: res => {
              if (res && res.status_code === 200) {
                if (onCancel) {
                  onCancel();
                } else {
                  this.hidden();
                }
                notification.success({
                  message: '绑定成功',
                  duration: 1
                });
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
              this.handleClose();
            },
            handleError: () => {
              this.handleClose();
            }
          });
        });
      }
    });
  };
  uuid = (len, radix) => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(
      ''
    );
    const uuid = [];
    const radixs = radix || chars.length;

    if (len) {
      // Compact form
      // eslint-disable-next-line no-bitwise
      for (let i = 0; i < len; i++)
        uuid[i] = chars[0 | (Math.random() * radixs)];
    } else {
      // rfc4122, version 4 form
      let r = '';

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (let i = 0; i < 36; i++) {
        if (!uuid[i]) {
          // eslint-disable-next-line no-bitwise
          r = 0 | (Math.random() * 16);
          // eslint-disable-next-line no-bitwise
          uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  };
  handleClose = () => {
    this.setState({
      loading: false
    });
  };
  hidden = () => {
    cookie.setGuide('appStore', 'true');
    this.props.dispatch({ type: 'global/hideAuthCompany' });
  };
  handleTabs = key => {
    this.setState({ activeKeyStore: key });
  };

  render() {
    const {
      title = '企业尚未绑定云端应用商店, 按以下步骤进行绑定认证',
      onCancel,
      onOk,
      rainbondInfo,
      form,
      eid,
      isHelm = false
    } = this.props;
    const {
      currStep: step,
      loading,
      marketList,
      marketUrl,
      alertText,
      activeKeyStore
    } = this.state;

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        span: 0
      },
      wrapperCol: {
        span: 24
      }
    };
    const defaultMarketUrl = rainbondInfo && rainbondInfo.default_market_url;
    const message = (
      <span>
        正在访问
        <a target="_blank" rel="noopener noreferrer" href={marketUrl}>
          云应用商店
        </a>
        进行用户授权，完成后可获取安装应用的权限。
      </span>
    );
    return (
      <Modal
        width={530}
        title={title}
        visible
        onCancel={onCancel || this.hidden}
        footer={null}
      >
        {isHelm && (
          <Tabs
            defaultActiveKey={activeKeyStore}
            style={{ marginTop: '-24px' }}
            onChange={this.handleTabs}
          >
            <TabPane
              tab={
                <span className={PluginStyles.verticalCen}>
                  {globalUtil.fetchSvg('cloudMarket')}
                  RainStore商店
                </span>
              }
              key="rainbondStore"
            />
            <TabPane
              tab={
                <span className={PluginStyles.verticalCen}>
                  {globalUtil.fetchSvg('HelmSvg')}
                  Helm商店
                </span>
              }
              key="helmStore"
            />
          </Tabs>
        )}

        {activeKeyStore === 'rainbondStore' ? (
          <div>
            {step === 2 && !loading && (
              <div>
                <Alert
                  message={message}
                  type="success"
                  style={{ marginBottom: '16px' }}
                />
                <iframe
                  src={`${marketUrl}/certification/login`}
                  style={{
                    width: '100%',
                    height: '400px'
                  }}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  scrolling="auto"
                  frameBorder="no"
                  border="0"
                  marginWidth="0"
                  marginHeight="0"
                />
              </div>
            )}
            {step !== 2 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <div
                  style={{
                    textAlign: 'center'
                  }}
                >
                  {step === 0 && (
                    <div>
                      <p style={{ fontSize: '18px', margin: '8px 0 20px' }}>
                        请先进行应用市场认证
                      </p>
                      <Button
                        onClick={() => {
                          this.handleNextStep(1);
                        }}
                        loading={loading}
                        type="primary"
                      >
                        去认证
                      </Button>
                    </div>
                  )}
                  {step === 1 && (
                    <div>
                      <p style={{ fontSize: '18px', margin: '8px 0 20px' }}>
                        请填写需要进行绑定的应用市场的URL
                      </p>
                      {alertText && (
                        <Alert
                          style={{ margin: '-20px 0 20px 0' }}
                          message={alertText}
                          type="info"
                        />
                      )}
                      <Form>
                        <Form.Item {...formItemLayout} label="">
                          {getFieldDecorator('url', {
                            initialValue: defaultMarketUrl || '',
                            rules: [
                              {
                                required: true,
                                message: '请填写需要进行绑定的应用市场的URL'
                              }
                            ]
                          })(
                            <Input
                              type="text"
                              placeholder="请填写需要进行绑定的应用市场的URL"
                            />
                          )}
                        </Form.Item>
                        <Button
                          onClick={() => {
                            this.handleNextStep(2);
                          }}
                          loading={loading}
                          type="primary"
                        >
                          下一步
                        </Button>
                      </Form>
                    </div>
                  )}
                  {step === 4 && (
                    <div>
                      <p style={{ fontSize: '18px', margin: '8px 0 20px' }}>
                        认证成功，选择需要绑定的商店
                      </p>
                      <Form className={PluginStyles.customGroup}>
                        <Form.Item {...formItemLayout} label="">
                          {getFieldDecorator('markets', {
                            initialValue: [],
                            rules: [
                              {
                                required: true,
                                message: '请选择需要绑定的商店'
                              }
                            ]
                          })(
                            <Checkbox.Group
                              onChange={this.onChangeCheckbox}
                              style={{ width: '450px' }}
                            >
                              <Row gutter={[24, 24]}>
                                {marketList.map(item => {
                                  const {
                                    name,
                                    url,
                                    logo,
                                    desc,
                                    domain
                                  } = item;
                                  return (
                                    <Col
                                      span={24}
                                      key={url}
                                      style={{
                                        position: 'relative',
                                        padding: 0
                                      }}
                                    >
                                      <Checkbox
                                        value={domain}
                                        style={{ width: '400px' }}
                                      >
                                        <Card className={PluginStyles.cards}>
                                          <Card.Meta
                                            className={PluginStyles.cardsMetas}
                                            avatar={
                                              <img
                                                style={{
                                                  width: 110,
                                                  height: 110,
                                                  margin: ' 0 auto'
                                                }}
                                                alt={name}
                                                src={
                                                  logo ||
                                                  require('../../../public/images/market.svg')
                                                }
                                                height={110}
                                              />
                                            }
                                            title={name}
                                            description={
                                              <Fragment>
                                                <Ellipsis
                                                  className={PluginStyles.item}
                                                  lines={3}
                                                >
                                                  <span title={desc}>
                                                    {desc}
                                                  </span>
                                                </Ellipsis>
                                              </Fragment>
                                            }
                                          />
                                        </Card>
                                      </Checkbox>
                                    </Col>
                                  );
                                })}
                              </Row>
                            </Checkbox.Group>
                          )}
                        </Form.Item>
                      </Form>
                      <Button
                        onClick={() => {
                          this.handleOkMarkets();
                        }}
                        loading={loading}
                        type="primary"
                      >
                        绑定
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <HelmForm onCancel={onCancel} data={false} eid={eid} onOk={onOk} />
        )}
      </Modal>
    );
  }
}
