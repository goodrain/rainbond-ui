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
import { formatMessage } from '@/utils/intl';
  import styles from './index.less'
  
  @connect()
  class CommandModal extends PureComponent {
    constructor(arg) {
      super(arg);
      this.state = {
        loading: false,
        step2: `helm repo add rainbond https://chart.rainbond.com\nhelm repo update`,
        step3: `helm install rainbond rainbond/rainbond --create-namespace -n rbd-system -f values.yaml`,
      };
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
        const token = dataObj.operator.env[0].value
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
        message.success(formatMessage({ id: 'notification.success.copy' }));
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
          maskClosable={false}
          title={formatMessage({id: 'enterpriseColony.ACksterList.commandModal.title'})}
          onOk={this.handleSubmit}
          onCancel={onOk}
          footer={
            <div>
              <Button onClick={onOk}> {formatMessage({ id: 'button.cancel' })} </Button>
              <Button
                type="primary"
                onClick={this.handleSubmit}
              >
                {formatMessage({ id: 'button.next_step' })}
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
                            {formatMessage({id:'enterpriseColony.ACksterList.commandModal.step1'})}
                            </span>
                            <Button onClick={()=>this.handleCopy(copyData)}>{copySvg}{formatMessage({id:'button.copy'})}</Button>
                        </div>
                    </div>
                </li>
                <li className={styles.item}>
                    <div className={styles.desc}>
                        <span className={styles.number}>2</span>
                        <div className={styles.content}>
                            <span>
                            {formatMessage({id:'enterpriseColony.ACksterList.commandModal.step2'})}
                            <a href='https://helm.sh/docs/intro/install/' target='_blank'> Helm </a>
                            {formatMessage({id:'enterpriseColony.ACksterList.commandModal.step5'})}
                            </span>
                            <Button onClick={()=>this.handleCopy(step2)}>{copySvg}{formatMessage({id:'button.copy'})}</Button>
                        </div>
                    </div>
                    <div className={styles.code}>
                        <p>helm repo add rainbond https://chart.rainbond.com</p>
                        <p>helm repo update</p>
                    </div>
                </li>
                <li className={styles.item}>
                    <div className={styles.desc}>
                        <span className={styles.number}>3</span>
                        <div className={styles.content}>
                            <span>
                            {formatMessage({id:'enterpriseColony.ACksterList.commandModal.step3'})}
                            </span>
                            <Button onClick={()=>this.handleCopy(step3)}>{copySvg}{formatMessage({id:'button.copy'})}</Button>
                        </div>
                    </div>
                    <div className={styles.code}>
                        <p>
                          helm install rainbond rainbond/rainbond --create-namespace -n rbd-system -f values.yaml
                        </p>
                    </div>
                </li>
                <li className={styles.item}>
                    <div className={styles.desc}>
                        <span className={styles.number}>4</span>
                        <div className={styles.content}>
                            <span>
                            {formatMessage({id:'enterpriseColony.ACksterList.commandModal.step4'})}
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
  