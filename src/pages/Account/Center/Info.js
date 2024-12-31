import React, { Component } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import {formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import rainbondUtil from '../../../utils/rainbond';
import { Menu } from 'antd';
import styles from './Info.less';

const { Item } = Menu;

@connect(({ user, global }) => ({
  currentUser: user.currentUser,
  enterprise: global.enterprise,
}))
class Info extends Component {
  constructor(props) {
    super(props);
    const { match, location, enterprise, currentUser } = props;
    const menuMap = {};
    menuMap.personal = (
      <FormattedMessage
        id="app.settings.menuMap.personal"
        defaultMessage="Personal"
      />
    );
    menuMap.accesstoken = (
      <FormattedMessage
        id="app.settings.menuMap.access-token"
        defaultMessage="Access Token"
      />
    );
    menuMap.img = (
      <FormattedMessage
        id="app.settings.menuMap.img"
        defaultMessage="Private Image Repository"
      />
    );
    menuMap.binding = (
      <FormattedMessage
        id="app.settings.menuMap.binding"
        defaultMessage="Account Binding"
      />
    );
    const key = location.pathname.replace(`${match.path}/`, '');
    this.state = {
      mode: 'inline',
      menuMap,
      selectKey: menuMap[key] ? key : 'personal',
    };
  }

  static getDerivedStateFromProps(props, state) {
    const {
      match,
      location,
      match: {
        params: { eid },
      },
    } = props;
    const filterPath = match.path.replace(/:eid/g, eid);
    let selectKey = location.pathname.replace(`${filterPath}/`, '');
    selectKey = state.menuMap[selectKey] ? selectKey : 'personal';
    if (selectKey !== state.selectKey) {
      return { selectKey };
    }
    return null;
  }

  getmenu = () => {
    const { menuMap } = this.state;
    return Object.keys(menuMap).map(item => (
      <Item key={item}>{menuMap[item]}</Item>
    ));
  };

  getRightTitle = () => {
    const { selectKey, menuMap } = this.state;
    return menuMap[selectKey];
  };

  selectKey = ({ key }) => {
    router.push(`/account/center/${key}`);
    this.setState({
      selectKey: key,
    });
  };

  render() {
    const { children } = this.props;

    const { mode, selectKey } = this.state;
    return (
      <>
        <PageHeaderLayout
          title={formatMessage({ id: 'versionUpdata_6_1.center' })}
          content={formatMessage({ id: 'versionUpdata_6_1.center.content' })}
          titleSvg={pageheaderSvg.getPageHeaderSvg('center', 18)}
        >
          <div className={styles.main}>
            <div className={styles.leftmenu}>
              <Menu mode={mode} selectedKeys={[selectKey]} onClick={this.selectKey}>
                {this.getmenu()}
              </Menu>
            </div>
            <div className={styles.right}>
              {children}
            </div>
          </div>
        </PageHeaderLayout>
      </>
    );
  }
}

export default Info;
