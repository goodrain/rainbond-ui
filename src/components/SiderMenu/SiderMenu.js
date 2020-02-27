import React, { PureComponent } from 'react';
import { Layout, Menu, Icon, Modal, Input } from 'antd';
import { connect } from 'dva';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import { Link } from 'dva/router';
import styles from './index.less';
import CollectionView from './CollectionView';
import ConfirmModal from '../ConfirmModal';

const { Sider } = Layout;
const { Search } = Input;

@connect(({ loading, global }) => ({
  rainbondInfo: global.rainbondInfo,
}))
export default class SiderMenu extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      collectionVisible: false,
      delcollectionVisible: false,
      collectionInfo: false,
      collectionList: [],
      page: 1,
      page_size: 10,
      name: '',
      userTeamList: [],
      isSearch: false,
    };
  }

  componentDidMount() {
    this.fetchCollectionViewInfo();
    this.getUserTeams();
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

  handleOpenDelCollectionVisible = collectionInfo => {
    this.setState({
      delcollectionVisible: true,
      collectionInfo,
    });
  };
  handleCloseDelCollectionVisible = () => {
    this.setState({
      delcollectionVisible: false,
      collectionInfo: false,
    });
  };

  fetchCollectionViewInfo = () => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'user/fetchCollectionViewInfo',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res) {
          this.setState({
            collectionList: res.list,
          });
        }
      },
    });
  };

  putCollectionViewInfo = () => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'user/putCollectionViewInfo',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        console.log('res', res);
        if (res) {
        }
      },
    });
  };

  deleteCollectionViewInfo = () => {
    const { dispatch, eid } = this.props;
    const { collectionInfo } = this.state;
    dispatch({
      type: 'user/deleteCollectionViewInfo',
      payload: {
        favorite_id: collectionInfo && collectionInfo.favorite_id,
        enterprise_id: eid,
      },
      callback: res => {
        if (res) {
          this.fetchCollectionViewInfo();
          this.handleCloseDelCollectionVisible();
        }
      },
    });
  };

  handleCollectionView = values => {
    const { dispatch, location, eid } = this.props;
    const index = location.hash.indexOf('#');
    const result = location.hash.substr(index + 1, location.hash.length);
    dispatch({
      type: 'user/addCollectionView',
      payload: {
        enterprise_id: eid,
        name: values.name,
        url: result,
      },
      callback: res => {
        if (res) {
          this.fetchCollectionViewInfo();
          this.handleCloseCollectionVisible();
        }
      },
    });
  };

  handleOnSearchTeam = name => {
    this.setState(
      {
        name,
      },
      () => {
        this.getUserTeams();
      }
    );
  };

  getUserTeams = () => {
    const { dispatch, currentUser, eid } = this.props;
    const { page, page_size, name } = this.state;
    dispatch({
      type: 'global/fetchUserTeams',
      payload: {
        enterprise_id: eid,
        user_id: currentUser.user_id,
        page,
        page_size,
        name,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            userTeamList: res.list,
            userTeamsLoading: false,
          });
        }
      },
    });
  };
  handleIsShowSearch = () => {
    this.setState({
      isSearch: !this.state.isSearch,
    });
  };

  render() {
    const { collapsed, onCollapse, enterpriseList } = this.props;
    const {
      collectionVisible,
      collectionList,
      delcollectionVisible,
      userTeamList,
      isSearch,
    } = this.state;

    const userTeam = userTeamList && userTeamList.length > 0 && userTeamList;

    const addSvg = () => (
      <svg
        t="1582706180987"
        viewBox="0 0 1024 1024"
        version="1.1"
        p-id="2095"
        width="14"
        height="14"
      >
        <path
          d="M512.09 959.26c-247.18 0-447.52-200.38-447.52-447.52 0-247.18 200.35-447.52 447.52-447.52 247.14 0 447.55 200.35 447.55 447.52 0 247.18-200.41 447.52-447.55 447.52zM735.88 467H556.86V287.98h-89.49V467H288.32v89.49h179.01V735.5h89.49V556.49h179.01V467h0.05z m0 0"
          p-id="2096"
          fill="#8C92A4"
        />
      </svg>
    );
    const delSvg = () => (
      <svg
        t="1582706679762"
        viewBox="0 0 1024 1024"
        version="1.1"
        p-id="2972"
        width="14"
        height="14"
      >
        <path
          d="M382.320274 405.357714v384a20.626286 20.626286 0 0 1-21.577143 21.284572H317.44256a20.626286 20.626286 0 0 1-21.577143-21.357715v-384a20.626286 20.626286 0 0 1 21.577143-21.284571h43.154286a20.626286 20.626286 0 0 1 21.577143 21.357714h0.073142z m172.909715 0v384a20.626286 20.626286 0 0 1-21.650286 21.284572h-43.154286a20.626286 20.626286 0 0 1-21.577143-21.357715v-384a20.626286 20.626286 0 0 1 21.577143-21.284571h43.154286a20.626286 20.626286 0 0 1 21.577143 21.357714z m172.909714 0v384a20.626286 20.626286 0 0 1-21.650286 21.284572h-43.154286a20.626286 20.626286 0 0 1-21.577142-21.357715l-0.073143-384a20.626286 20.626286 0 0 1 21.577143-21.284571h43.227428a20.626286 20.626286 0 0 1 21.577143 21.357714z m86.381714 482.669715V256H209.483703v631.954286a74.825143 74.825143 0 0 0 14.482286 45.056c3.364571 3.803429 5.778286 5.632 7.094857 5.632h561.883428c1.316571 0 3.657143-1.828571 7.094857-5.632a74.825143 74.825143 0 0 0 14.555429-44.982857zM360.743131 170.642286h302.518858l-32.402286-77.970286a19.017143 19.017143 0 0 0-11.483429-7.314286H405.287131a19.017143 19.017143 0 0 0-11.483428 7.314286l-33.060572 77.970286zM987.431131 192v42.642286a20.626286 20.626286 0 0 1-21.577142 21.357714h-64.877715v631.954286c0 36.937143-10.532571 68.754286-31.744 95.744-21.211429 26.843429-46.592 40.301714-76.288 40.301714H231.060846c-29.696 0-55.149714-13.019429-76.288-38.985143-21.211429-26.038857-31.744-57.490286-31.744-94.354286V256H58.151131A20.626286 20.626286 0 0 1 36.573989 234.642286v-42.642286a20.626286 20.626286 0 0 1 21.577142-21.357714h208.676572L314.151131 59.318857c6.729143-16.457143 18.870857-30.427429 36.425143-41.984 17.554286-11.556571 35.401143-17.334857 53.394286-17.334857h216.064c17.993143 0 35.84 5.778286 53.394286 17.334857 17.554286 11.556571 29.696 25.6 36.425143 41.984l47.323428 111.323429h208.676572a20.626286 20.626286 0 0 1 21.577142 21.357714z"
          p-id="2973"
          fill="#8C92A4"
        />
      </svg>
    );

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
          title={formatMessage({ id: 'sidecar.collection.add' })}
          visible={collectionVisible}
          onOk={this.handleCollectionView}
          onCancel={this.handleCloseCollectionVisible}
        />

        {delcollectionVisible && (
          <ConfirmModal
            title="删除收藏视图"
            subDesc="此操作不可恢复"
            desc="确定要删除此视图吗？"
            onOk={this.deleteCollectionViewInfo}
            onCancel={this.handleCloseDelCollectionVisible}
          />
        )}

        <div className={styles.logo} key="logo">
          <div className={styles.viewTit}>
            <FormattedMessage id="sidecar.title" />
          </div>
        </div>
        <div className={styles.viewContent}>
          <div className={styles.tit}>
            <FormattedMessage id="sidecar.collection" />
            <Icon
              className={styles.addCollection}
              component={addSvg}
              onClick={this.handleOpenCollectionVisible}
            />
          </div>
          {collectionList.map(item => {
            return (
              <Link key={item.url} to={item.url}>
                <div className={styles.con}>
                  {item.name}
                  <Icon
                    className={styles.addCollection}
                    component={delSvg}
                    onClick={() => {
                      this.handleOpenDelCollectionVisible(item);
                    }}
                  />
                </div>
              </Link>
            );
          })}

          <div className={styles.tit}>企业</div>
          {enterpriseList.map(item => {
            return (
              <Link
                key={item.enterprise_id}
                to={`/enterprise/${item.enterprise_id}/index`}
              >
                <div className={styles.con}>{item.enterprise_alias}</div>
              </Link>
            );
          })}

          <div className={styles.tit}>
            团队
            <Icon type="search" onClick={this.handleIsShowSearch} />
          </div>
          {isSearch && (
            <Search
              placeholder="搜索团队名称"
              onSearch={this.handleOnSearchTeam}
              className={styles.searchTeam}
              style={{ width: 200 }}
            />
          )}
          {userTeam &&
            userTeam.map(item => {
              const currRegion = 'no-region';
              const { region, team_name, team_alias } = item;
              return (
                <Link
                  key={item.team_name}
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
