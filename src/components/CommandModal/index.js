import {
    Modal,
    Button,
    message
  } from 'antd';
  import { connect } from 'dva';
  import { routerRedux } from 'dva/router';
  import moment from 'moment';
  import copy from 'copy-to-clipboard';
  import React, { Fragment, PureComponent } from 'react';
  import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
  import styles from './index.less'
  
  @connect()
  class CommandModal extends PureComponent {
    constructor(arg) {
      super(arg);
      this.state = {
        loading: false,
        step2: `helm repo add rainbond https://openchart.goodrain.com/goodrain/rainbond\nhelm repo update\nkubectl create namespace rbd-system`,
        step3: `helm install rainbond rainbond/rainbond-cluster -n rbd-system -f values.yaml`,
      };
    }
  
    componentDidMount() {
      
    }
    handleSubmit = () => {
        const {
          dispatch,
          match: {
            params: { eid }
          },
          dataObj,
          onOk
        } = this.props;
        const token = dataObj.operator.env.HELM_TOKEN
        const host = dataObj.Cluster.gatewayIngressIPs;
        dispatch({
          type: 'region/createHelmEvents',
          payload: { 
            eid,
            token: token,
            api_host: host
          },
          callback: res => {
           onOk();
           dispatch(routerRedux.push(`/enterprise/${eid}/provider/ACksterList/result?token=${token}&host=${host}`))
          }
        });
    }

    handleCopy = (copyValue) => {
        copy(copyValue);
        message.success('复制成功');
    }
    

    
    render() {
      const { form, onOk, copyData } = this.props;
      const { step3, step2 } = this.state;
      const copySvg = (
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><g fill="#0080FF" fill-rule="evenodd"><rect opacity="0.4" x="7.5" y="4.5" width="8" height="8" rx="1"></rect><rect x="4.5" y="7.5" width="8" height="8" rx="1"></rect></g></svg>
      )
      return (
        <Modal
          visible
          width={700}
        //   confirmLoading={loading}
          maskClosable={false}
        //   className={styles.TelescopicModal}
          title={'按照下面的指南配置'}
          onOk={this.handleSubmit}
          onCancel={onOk}
          footer={
            <div>
              <Button onClick={onOk}> {formatMessage({ id: 'button.cancel' })} </Button>
              <Button
                type="primary"
                onClick={this.handleSubmit}
              >
                下一步
              </Button>
            </div>
          }
        >
          <div className={styles.mdoalBox}>
            <ul className={styles.list}>
                <li className={styles.item}>
                    <div className={styles.desc}>
                        <span className={styles.number}>1</span>
                        <div className={styles.content}>
                            <span>
                            点击右侧复制按钮，复制 yaml 文件内容，并在集群中创建 values.yaml 文件
                            </span>
                            <Button onClick={()=>this.handleCopy(copyData)}>{copySvg}复制</Button>
                        </div>
                    </div>
                </li>
                <li className={styles.item}>
                    <div className={styles.desc}>
                        <span className={styles.number}>2</span>
                        <div className={styles.content}>
                            <span>
                                使用如下命令添加和更新 Helm 仓库
                            </span>
                            <Button onClick={()=>this.handleCopy(step2)}>{copySvg}复制</Button>
                        </div>
                    </div>
                    <div className={styles.code}>
                        <p>
                            helm repo add rainbond https://openchart.goodrain.com/goodrain/rainbond
                        </p>
                        <p>helm repo update</p>
                        <p>kubectl create namespace rbd-system</p>
                    </div>
                </li>
                <li className={styles.item}>
                    <div className={styles.desc}>
                        <span className={styles.number}>3</span>
                        <div className={styles.content}>
                            <span>
                            使用如下命令安装Rainbond，需要指定第一步中创建的 values.yaml 文件
                            </span>
                            <Button onClick={()=>this.handleCopy(step3)}>{copySvg}复制</Button>
                        </div>
                    </div>
                    <div className={styles.code}>
                        <p>
                            helm install rainbond rainbond/rainbond-cluster -n rbd-system -f values.yaml
                        </p>
                    </div>
                </li>
                <li className={styles.item}>
                    <div className={styles.desc}>
                        <span className={styles.number}>4</span>
                        <div className={styles.content}>
                            <span>
                                执行完上述命令后，可点击“下一步”等待集群对接完成。
                            </span>
                        </div>
                    </div>
                </li>
            </ul>
          </div>
        </Modal>
      );
    }
  }
  
  export default CommandModal;
  