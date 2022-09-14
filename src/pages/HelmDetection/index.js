import { Button, Card, Steps} from 'antd';
import React, { Fragment, PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import globalUtil from '../../utils/global';
import Result from '../../components/Result';
import styles from './index.less'

const { Step } = Steps;

@connect(null, null, null, { withRef: true })
class HelmDetection extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            num: 1,
            resources: {},
            appType: {
                ChartReady: '拉取应用包',
                PreInstalled: '校验应用包',
                ChartParsed: '解析应用包'
              },
            currentSteps: 0,
            appStateMap: {
                initailing: 0,
                detecting: 1,
                configuring: 2,
                installing: 3,
                installed: 4
              },
            isScrollToBottom: true,
            versionInfoLoading: true,
            componentTimer: true,
            bool:true
        };
    }
    componentDidMount(){
        this.setState({
            bool:true
        })
        const { dispatch  } = this.props;
        const {
          appStateMap,
          currentSteps: oldSteps,
        } = this.state;
        dispatch({
          type: 'application/fetchAppDetailState',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            group_id: globalUtil.getAppID()
          },
          callback: res => {
            const info = res.list || {};
            const currentSteps = (info && info.phase && appStateMap[info.phase]) || 0;
            this.setState(
              {
                resources: info,
                currentSteps: currentSteps > oldSteps ? currentSteps : oldSteps,
                bool:false
              },
            );
            this.handleTimers(
                'timer',
                () => {
                  this.fetchAppDetailState();
                //   this.fetchAppDetail();
                  this.closeTimer();
                },
                10
              );
          },
        });
    }
    handleTimers = (timerName, callback, times) => {
        const { componentTimer } = this.state;
        if (!componentTimer) {
          return null;
        }
        this[timerName] = setTimeout(() => {
          callback();
        }, times);
      };
      closeTimer = () => {
        if (this.timer) {
          clearInterval(this.timer);
        }
      };
    jump = () => {
        window.history.back();
    }
    next = () => { 
        const { dispatch } =  this.props;
        dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}`
            )
        )
    }
    // 安装失败
    operationError = () => {
        const { currentSteps, resources, appType } = this.state
        return <Card>
                    <Result
                        type="error"
                        title={'应用包检验失败'}
                        description={'应用包检验失败,请重新安装或重新检测！'}
                        extra={
                            currentSteps < 2 &&
                            resources.conditions &&
                            resources.conditions.length > 0 && (
                              <div className={styles.process}>
                                <Steps direction="vertical" style={{ paddingLeft: '20%' }}>
                                  {resources.conditions.map(item => {
                                    const { status, message, type } = item;
                                    if (appType[type]) {
                                      return (
                                        <Step
                                          title={appType[type]}
                                          status={
                                            status ? 'finish' : message ? 'error' : 'wait'
                                          }
                                          description={
                                            <div style={{ color: '#ff4d4f' }}>{message}</div>
                                          }
                                        />
                                      );
                                    }
                                  })}
                                </Steps>
                              </div>
                            )}
                        actions={
                            <>
                            <Button onClick = { this.jump}>取消</Button>
                            <Button onClick = { this.jump}>重新检测</Button>
                            </>
                        }
                        style={{
                            marginTop: 48,
                            marginBottom: 16
                        }}
                    />,
            </Card>
    }
    // 安装成功
    operationSuccess = () =>{

        return <Card>
                    <Result
                        type="success"
                        title={'应用包检验成功'}
                        description={'应用包检验成功,点击下一步进行配置与安装。'}
                        actions={
                            <Button onClick={this.next}>下一步</Button>
                        }
                        style={{
                            marginTop: 48,
                            marginBottom: 16
                        }}
                    />,
              </Card>
    }
    operationInstall = () =>{
        return <Card>
                    <Result
                        type="ing"
                        title={'应用包检验中'}
                        description={'应用包检验中,请耐心等候...'}
                        style={{
                            marginTop: 48,
                            marginBottom: 16
                        }}
                    />,
              </Card>
    }

    fetchAppDetailState = () => {
        const { dispatch  } = this.props;
        const {
          appStateMap,
          currentSteps: oldSteps,
          appType
        } = this.state;
        dispatch({
          type: 'application/fetchAppDetailState',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            group_id: globalUtil.getAppID()
          },
          callback: res => {
            const info = res.list || {};
            const currentSteps = (info && info.phase && appStateMap[info.phase]) || 0;
            this.setState(
              {
                resources: info,
                currentSteps: currentSteps > oldSteps ? currentSteps : oldSteps
              }
            );
          },
        });
      };

render() {
    const { num } =  this.state 
    const { currentSteps, resources, bool } = this.state

    return (
        <Fragment>
            {bool && this.operationInstall()}
            {bool == false && currentSteps == 2 && this.operationSuccess()}
            {bool == false && currentSteps < 2 && this.operationError()}
        </Fragment>
    );
}
}

export default HelmDetection;
