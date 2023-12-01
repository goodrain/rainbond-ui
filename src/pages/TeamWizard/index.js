/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
/* eslint-disable eqeqeq */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/sort-comp */
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import CustomFooter from "../../layouts/CustomFooter"
import globalUtil from '../../utils/global';
import cookie from '../../utils/cookie';
import styles from './index.less';

@connect(({ enterprise, user }) => ({
    currentEnterprise: enterprise.currentEnterprise,
    user: user.currentUser,
}))
  
export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            rainStoreTab: '',
            language: cookie.get('language') === 'zh-CN' ? true : false,
            scope: 'enterprise',
            vmShow: false,
        };
    }
    componentDidMount(){
        this.getMarketsTab()
        this.getCloudRecommendApps()
        this.fetchPipePipeline()
    }
    getCloudRecommendApps = v => {
        const {scope} = this.state;
        const { dispatch, currentEnterprise, user } = this.props;
        dispatch({
          type: 'market/fetchAppModels',
          payload: {
            enterprise_id: currentEnterprise.enterprise_id,
            user_id: user.user_id,
            app_name: '',
            scope: scope,
            page_size: 9,
            page: 1,
          },
          callback: data => {
            this.setState({
                localist: data.list
            })
          }
        });
      };
    // 获取插件列表
  fetchPipePipeline = (eid) => {
    const { dispatch, currentEnterprise } = this.props;
    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (res && res.list) {
          res.list.map(item => {
            if (item.name == "rainbond-vm") {
              this.setState({
                vmShow: true,
              })
            }
          }
          )
        }
      }
    })
  }
    getMarketsTab = () => {
        const { dispatch, currentEnterprise } = this.props;
        dispatch({
          type: 'market/fetchMarketsTab',
          payload: {
            enterprise_id: currentEnterprise.enterprise_id
          },
          callback: res => {
            const list = (res && res.list) || [];
            let rainStores = '';
            if (list && list.length > 0) {
              list.map(item => {
                if (item.domain == 'rainbond') {
                  return rainStores = item.name
                }
              });
            }
            this.setState({
              rainStoreTab: rainStores
            })
          }
        });
      };
    onClickLinkCreate = (type, link) => {
        const { dispatch } = this.props
        const teamName = globalUtil.getCurrTeamName();
        const regionName = globalUtil.getCurrRegionName();

        dispatch(
            routerRedux.push({ pathname: `/team/${teamName}/region/${regionName}/create/${type}/${link}` })
        );
    }

    render() {
        const teamCode = globalUtil.fetchSvg('teamCode');
        const teamMarket = globalUtil.fetchSvg('teamMarket');
        const teamImage = globalUtil.fetchSvg('teamImage');
        const teamUpload = globalUtil.fetchSvg('teamUpload');
        const { rainStoreTab, language, localist, vmShow } = this.state
        return (
            <Fragment>
                <div className={styles.overviewBox}>
                    <div style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                        <div className={styles.topContent} style={{ height: language ? '230px' : '260px' }}>
                            <div className={styles.initIcon}>
                                <div>
                                    {teamMarket}
                                </div>
                            </div>
                            <div className={styles.initTitle}>
                                {formatMessage({ id: 'menu.team.create.market' })}
                            </div>
                            <div className={styles.initDesc}>
                                <p>
                                    {formatMessage({ id: 'teamAdd.create.market.desc' })}
                                </p>
                            </div>
                        </div>
                        <div className={styles.bottomContent}>
                            <p onClick={() => this.onClickLinkCreate('market', rainStoreTab)}>{formatMessage({id:'teamAdd.create.market.market'})}</p>
                            <p onClick={() => this.onClickLinkCreate('market', '')}>{formatMessage({ id: 'popover.applicationMarket.local' })} {localist && localist.length > 0 ? (<> ({localist.length}) </>): (<span>(0)</span>)}</p>
                            <p onClick={() => this.onClickLinkCreate('market', 'command')}>{formatMessage({id:'teamAdd.create.market.command'})}</p>
                        </div>
                    </div>
                    <div style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                        <div className={styles.topContent} style={{ height: language ? '230px' : '260px' }}>
                            <div className={styles.initIcon}>
                                <div>
                                    {teamImage}
                                </div>
                            </div>
                            <div className={styles.initTitle}>
                                {formatMessage({ id: 'menu.team.create.image' })}
                            </div>
                            <div className={styles.initDesc}>
                                <p>
                                    {formatMessage({ id: 'teamAdd.create.image.desc' })}
                                </p>
                            </div>
                        </div>
                        <div className={styles.bottomContent}>

                            <p onClick={() => this.onClickLinkCreate('image', 'custom')}>容器</p>
                            {vmShow && 
                                <p onClick={() => this.onClickLinkCreate('vm', 'VirtualMachine')}>虚拟机</p>
                            }
                        </div>
                    </div>
                    <div style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                        <div className={styles.topContent} style={{ height: language ? '230px' : '260px' }}>
                            <div className={styles.initIcon}>
                                <div>
                                    {teamCode}
                                </div>
                            </div>
                            <div className={styles.initTitle}>
                                {formatMessage({ id: 'menu.team.create.code' })}
                            </div>
                            <div className={styles.initDesc}>
                                <p>
                                    {formatMessage({ id: 'teamAdd.create.code.desc' })}
                                </p>
                            </div>
                        </div>
                        <div className={styles.bottomContent}>
                            <p onClick={() => this.onClickLinkCreate('code', 'custom')}>{formatMessage({ id: 'teamAdd.create.code.customSource' })}</p>
                            <p onClick={() => this.onClickLinkCreate('code', 'jwar')}>{formatMessage({ id: 'teamAdd.create.code.package' })}</p>
                            <p onClick={() => this.onClickLinkCreate('code', 'demo')}>{formatMessage({ id: 'teamAdd.create.code.demo' })}</p>
                        </div>
                    </div>
                    <div style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                        <div className={styles.topContent} style={{ height: language ? '230px' : '260px' }}>
                            <div className={styles.initIcon}>
                                <div>
                                    {teamUpload}
                                </div>
                            </div>
                            <div className={styles.initTitle}>
                                {formatMessage({ id: 'menu.team.create.upload' })}
                            </div>
                            <div className={styles.initDesc}>
                                <p>
                                    {formatMessage({ id: 'teamAdd.create.upload.desc' })}
                                </p>
                            </div>
                        </div>
                        <div className={styles.bottomContent}>
                            <p onClick={() => this.onClickLinkCreate('yaml', 'yaml')}>{formatMessage({ id: 'teamAdd.create.upload.TeamWizard.yaml' })}</p>
                            <p onClick={() => this.onClickLinkCreate('yaml', 'helm')}>{formatMessage({ id: 'teamAdd.create.upload.TeamWizard.helm' })}</p>
                            <p onClick={() => this.onClickLinkCreate('yaml', 'importCluster')}>{formatMessage({ id: 'teamAdd.create.upload.uploadFiles.k8s.text' })}</p>
                        </div>
                    </div>
                </div>
                <CustomFooter />
            </Fragment>
        );
    }
}
