import React, { PureComponent } from 'react';
import { Layout, Menu, Icon, Modal } from 'antd';
import { connect } from 'dva';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import { Link } from 'dva/router';
import styles from './index.less';
import CollectionView from './CollectionView';

const { Sider } = Layout;


@connect(({ loading, global }) => ({
  rainbondInfo: global.rainbondInfo,
}))
export default class SiderMenu extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      collectionVisible: false,
      collectionList: [],
    };
  }

  componentDidMount() {
    this.fetchCollectionViewInfo();
  }

  // conversion Path 转化路径
  conversionPath = path => {
    if (path && path.indexOf('http') === 0) {
      return path;
    }
    return `/${path || ''}`.replace(/\/+/g, '/');
  };

  handleOpenChange = openKeys => {
    // const lastOpenKey = openKeys[openKeys.length - 1]; const isMainMenu =
    // this.props.menuData.some(   item => lastOpenKey && (item.key === lastOpenKey
    // || item.path === lastOpenKey) );
    this.setState({
      openKeys: [...openKeys],
    });
  };

  handleOpenCollectionVisible = () => {
    this.setState({
      collectionVisible: true,
    });
  };
  handleCloseCollectionVisible = () => {
    this.setState({
      collectionVisible: false,
    });
  };

  fetchCollectionViewInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/fetchCollectionViewInfo',
      callback: res => {
        console.log('res', res);
        if (res) {
          this.setState({
            collectionList: res.list,
          });
        }
      },
    });
  };

  putCollectionViewInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/putCollectionViewInfo',
      callback: res => {
        console.log('res', res);
        if (res) {
        }
      },
    });
  };

  deleteCollectionViewInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/deleteCollectionViewInfo',
      callback: res => {
        if (res) {
        }
      },
    });
  };

  handleCollectionView = values => {
    const { dispatch, location } = this.props;
    const index = location.hash.indexOf('#');
    const result = location.hash.substr(index + 1, location.hash.length);
    dispatch({
      type: 'user/addCollectionView',
      payload: {
        name: values.name,
        url: result,
      },
      callback: res => {
        if (res) {
        }
      },
    });
  };
  render() {
    const {
      logo,
      collapsed,
      location: { pathname },
      onCollapse,
      enterpriseList,
      currentUser,
    } = this.props;
    const { collectionVisible, collectionList } = this.state;
    return (
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="md"
        onCollapse={onCollapse}
        width={0}
        collapsedWidth={300}
        className={styles.sider}
      >
        <CollectionView
          title={formatMessage({id: "sidecar.collection.add"})}
          visible={collectionVisible}
          onOk={this.handleCollectionView}
          onCancel={this.handleCloseCollectionVisible}
        />

        <div className={styles.logo} key="logo">
          <div className={styles.viewTit}><FormattedMessage id="sidecar.title" /></div>
        </div>
        <div className={styles.viewContent}>
          <div className={styles.tit}>
            <FormattedMessage id="sidecar.collection" />
            <Icon
              className={styles.addCollection}
              onClick={this.handleOpenCollectionVisible}
              type="plus"
            />
          </div>
          {collectionList.map(item => {
            return (
              <Link key={item.url} to={item.url}>
                <div className={styles.con}>{item.name}</div>
              </Link>
            );
          })}

          <div className={styles.tit}>企业</div>
          {enterpriseList.map(item => {
            return (
              <Link key={item.enterprise_id} to={`/enterprise/${item.enterprise_id}/index`}>
                <div className={styles.con}>{item.enterprise_alias}</div>
              </Link>
            );
          })}

          <div className={styles.tit}>团队</div>
          {currentUser &&
            currentUser.teams.map(item => {
              const currRegion = 'no-region';
              const { region, team_name, team_alias } = item;
              return (
                <Link
                  key={item.name}
                  to={`/team/${team_name}/region/${
                    region.length > 0 ? region[0].team_region_name : currRegion
                  }/index`}
                >
                  <div className={styles.con}>{team_alias}</div>
                </Link>
              );
            })}
        </div>
      </Sider>
    );
  }
}
