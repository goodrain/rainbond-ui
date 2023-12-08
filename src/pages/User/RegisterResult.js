import React, { Component } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { Button } from 'antd';
import Result from '../../components/Result';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import styles from './RegisterResult.less';
@connect(({ user, global }) => ({
  register: user.register,
  rainbondInfo: global.rainbondInfo,
}))

export default class Register extends Component {
  constructor(props) {
    super(props)
    this.state = {
      eid:'',
      is_admin: 0,
      regionName: null
    }
  }
  componentDidMount(){
    const { dispatch, rainbondInfo } = this.props
    const firstRegist = !rainbondUtil.fetchIsFirstRegist(rainbondInfo);
    if(firstRegist){
      dispatch({
        type: 'global/fetchInitCluster',
        payload: {},
        callback: res => {
          if(res && res.bean && res.bean.default_region){
            globalUtil.putClusterSizeLog(res.bean.enterprise_id);
            this.setState({
              regionName: res.bean.default_region.region_name
            })
          }
        },
        handleError: res => {
          console.log(res,'error')
        }
      })
    }
    this.getEnterpriseList()
  }
   // 获取企业列表
  getEnterpriseList = () => {
    const { dispatch } = this.props;
    
    dispatch({
      type: 'global/fetchEnterpriseList',
      callback: res => {
        if(res.list.length > 0){
          this.setState({
            eid:res.list[0].enterprise_id
          },()=>{
            const { eid } = this.state
          })
        }
      },
      handleError: () => {
      }
    });
  };
  loadUser = (eid) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseUsers',
      payload: {
        enterprise_id: eid,
        page: 1,
        page_size: 10,
        name: ''
      },
      callback: res => {
        if (res) {
          const is_admin = res.list.length
          this.setState({
            is_admin
          })
        }
      }
    });
  };
  onRouterLink = (eid, firstRegist, regionName)=>{
    const { dispatch } = this.props;
    if(firstRegist){
      if(regionName){
        dispatch(routerRedux.replace(`/team/default/region/${regionName}/index`))
      }else{
        dispatch(routerRedux.replace(`/enterprise/${eid}/index`))
      }
    }else{
      dispatch(routerRedux.replace(`/enterprise/${eid}/personal`))
    }
  }
  render() {
    const { location, user, rainbondInfo } = this.props
    const { eid, is_admin, regionName } = this.state
    const firstRegist = !rainbondUtil.fetchIsFirstRegist(rainbondInfo);
    const actions = (
      <div className={styles.actions}>
        <Button size="large" onClick={()=>{this.onRouterLink(eid, firstRegist, regionName)}}><FormattedMessage id="login.RegisterResult.back" /></Button>
      </div>
    );
    return (
      <Result
        className={styles.registerResult}
        type="success"
        title={
          <div className={styles.title}>
            <FormattedMessage id="login.RegisterResult.your" />{location.state ? location.state.account : 'xxx'} <FormattedMessage id="login.RegisterResult.success" />
          </div>
        }
        description=""
        actions={actions}
        style={{ margin: '50px 0' }}
      />
    )
  }

}
