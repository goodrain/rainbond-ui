import React, { Component } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { FormattedMessage } from 'umi-plugin-locale';
import rainbondUtil from '../../../utils/rainbond';
import CustomFooter from "../../../layouts/CustomFooter";
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
    const isOauth = rainbondUtil.OauthEnterpriseEnable(enterprise);
    const oauth_services =
      currentUser.oauth_services &&
      currentUser.oauth_services.length > 0 &&
      currentUser.oauth_services;
    console.log(isOauth,"isOauth");
    console.log(isOpenOauth,"isOpenOauth");
    // const isOpenOauth = isOauth && oauth_services;
    const isOpenOauth = true
    const menuMap = {};
    menuMap.personal = (
      <FormattedMessage
        id="app.settings.menuMap.personal"
        defaultMessage="Personal"
      />
    );
    if (isOpenOauth) {
      menuMap.binding = (
        <FormattedMessage
          id="app.settings.menuMap.binding"
          defaultMessage="Account Binding"
        />
      );
    }
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
      <div className={styles.main}>
        <div className={styles.leftmenu}>
          <Menu mode={mode} selectedKeys={[selectKey]} onClick={this.selectKey}>
            {this.getmenu()}
          </Menu>
        </div>
        <div className={styles.right}>
          <div className={styles.title}>{this.getRightTitle()}</div>
          {children}
        </div>
      </div>
      <CustomFooter/>
      </>
    );
  }
}

export default Info;
