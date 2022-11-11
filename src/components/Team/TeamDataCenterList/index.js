import { Card } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ConfirmModal from '../../../components/ConfirmModal';
import globalUtil from '../../../utils/global';
import OpenRegion from '../../OpenRegion';
import styles from './index.less';

@connect(({ teamControl, loading }) => ({
  regions: teamControl.regions,
  projectLoading: loading.effects['project/fetchNotice'],
  activitiesLoading: loading.effects['activities/fetchList']
}))
export default class DatacenterList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      openRegion: false,
      showUninstallCluster: false,
      closeRegionLoading: false
    };
  }
  componentDidMount() {
    this.fetchRegions();
  }
  onOpenRegion = () => {
    this.setState({ openRegion: true });
  };
  cancelOpenRegion = () => {
    this.setState({ openRegion: false });
  };
  handleOpenRegion = regions => {
    this.props.dispatch({
      type: 'teamControl/openRegion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_names: regions.join(',')
      },
      callback: () => {
        this.fetchRegions();
        this.props.dispatch({ type: 'user/fetchCurrent' });
        this.cancelOpenRegion();
      }
    });
  };
  handleCloseRegion = () => {
    const { regionName } = this.state;
    this.props.dispatch({
      type: 'teamControl/closeTeamRegion',
      payload: {
        teamName: globalUtil.getCurrTeamName(),
        regionName
      },
      callback: () => {
        this.fetchRegions();
        this.props.dispatch({ type: 'user/fetchCurrent' });
        this.cancelCloseRegion();
      }
    });
  };
  fetchRegions = () => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    dispatch({
      type: 'teamControl/fetchRegions',
      payload: {
        team_name: teamName
      }
    });
  };
  showCloseRegion = regionName => {
    this.setState({ showUninstallCluster: true, regionName });
  };
  cancelCloseRegion = () => {
    this.setState({ showUninstallCluster: false });
  };
  render() {
    const {
      regions,
      projectLoading,
      datecenterPermissions: { isInstall, isUninstall }
    } = this.props;
    const { openRegion, showUninstallCluster, closeRegionLoading } = this.state;

    return (
      <div>
        <Card
          className={styles.projectList}
          style={{
            marginBottom: 24,
            boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
            borderRadius: 5
          }}
          title={formatMessage({id: 'teamManage.tabs.cluster.openCluster'})}
          bordered={false}
          extra={isInstall && <a onClick={this.onOpenRegion}>
            {formatMessage({id: 'teamManage.tabs.cluster.open'})}
          </a>}
          loading={projectLoading}
          bodyStyle={{
            padding: 0
          }}
        >
          {(regions || []).map(item => (
            <Card.Grid className={styles.projectGrid} key={item.ID}>
              <Card
                bodyStyle={{
                  padding: 0
                }}
                bordered={false}
              >
                <Card.Meta
                  title={
                    <div className={styles.cardTitle}>
                      <svg
                        t="1597473134624"
                        className="icon"
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        p-id="1784"
                        width="24"
                        height="24"
                      >
                        <path
                          d="M513 564.538c-3.453 0-6.906-0.894-10-2.68L322.545 457.672a19.999 19.999 0 0 1-10-17.32V231.98a19.998 19.998 0 0 1 10-17.32L503 110.475a19.998 19.998 0 0 1 20 0L703.455 214.66a19.999 19.999 0 0 1 10 17.32v208.371a19.998 19.998 0 0 1-10 17.32L523 561.858a19.98 19.98 0 0 1-10 2.68zM352.545 428.805L513 521.444l160.455-92.64V243.527L513 150.889l-160.455 92.638v185.278z"
                          p-id="1785"
                        />
                        <path
                          d="M511.849 327.408a9.995 9.995 0 0 1-4.925-1.297l-110.393-62.465a9.998 9.998 0 0 1-0.098-17.35l111.561-64.802a10.002 10.002 0 0 1 10.017-0.017l110.395 63.634a10 10 0 0 1-0.04 17.351l-111.563 63.633a9.997 9.997 0 0 1-4.954 1.313z m-90.288-72.578l90.268 51.078 91.479-52.178-90.271-52.035-91.476 53.135z m-122.37 672.469c-3.453 0-6.906-0.894-10-2.68L108.736 820.433a19.999 19.999 0 0 1-10-17.32V594.741a19.998 19.998 0 0 1 10-17.32l180.455-104.186a19.998 19.998 0 0 1 20 0l180.456 104.186a19.999 19.999 0 0 1 10 17.32v208.371a19.998 19.998 0 0 1-10 17.32L309.191 924.619a19.991 19.991 0 0 1-10 2.68zM138.736 791.565l160.455 92.64 160.456-92.64V606.288l-160.456-92.639-160.455 92.639v185.277z"
                          p-id="1786"
                        />
                        <path
                          d="M298.039 690.169a9.995 9.995 0 0 1-4.925-1.297l-110.393-62.465a9.998 9.998 0 0 1-0.098-17.35l111.562-64.803a10.002 10.002 0 0 1 10.017-0.017l110.394 63.635a10.003 10.003 0 0 1-0.039 17.351l-111.563 63.633a10.014 10.014 0 0 1-4.955 1.313z m-90.288-72.578l90.268 51.077 91.479-52.178-90.271-52.035-91.476 53.136z m518.267 72.578a9.995 9.995 0 0 1-4.925-1.297L610.7 626.407a10 10 0 0 1-0.098-17.35l111.563-64.803a10.002 10.002 0 0 1 10.017-0.017l110.394 63.635a10.003 10.003 0 0 1-0.039 17.351l-111.563 63.633a10.02 10.02 0 0 1-4.956 1.313z m-90.288-72.578l90.268 51.077 91.479-52.178-90.271-52.035-91.476 53.136z"
                          p-id="1787"
                        />
                        <path
                          d="M725.408 927.299c-3.453 0-6.906-0.894-10-2.68L534.953 820.433a19.999 19.999 0 0 1-10-17.32V594.741a19.998 19.998 0 0 1 10-17.32l180.455-104.186a19.998 19.998 0 0 1 20 0l180.455 104.186a19.999 19.999 0 0 1 10 17.32v208.371a19.998 19.998 0 0 1-10 17.32L735.408 924.619a19.991 19.991 0 0 1-10 2.68zM564.953 791.565l160.455 92.64 160.455-92.64V606.288l-160.455-92.639-160.455 92.639v185.277z"
                          p-id="1788"
                        />
                      </svg>
                      <a>{item.region_alisa}</a>
                      {isUninstall && (
                        <a
                          onClick={() => this.showCloseRegion(item.region_name)}
                          style={{ float: 'right', color: '#1890ff' }}
                        >
                          {formatMessage({id: 'teamManage.tabs.cluster.unload'})}
                        </a>
                      )}
                    </div>
                  }
                  description={item.desc || '-'}
                />
                <div className={styles.projectItemContent}>
                  <span className={styles.datetime}>
                  {formatMessage({id: 'teamManage.tabs.cluster.opened'})}
                    {' '}
                    {moment(item.create_time)
                      .locale('zh-cn')
                      .format('YYYY年-MM月-DD日')}
                  </span>
                </div>
              </Card>
            </Card.Grid>
          ))}
          {!regions || !regions.length ? (
            <p
              style={{
                textAlign: 'center',
                paddingTop: 20
              }}
            >
            {formatMessage({id: 'teamManage.tabs.cluster.null'})}
            </p>
          ) : (
            ''
          )}
        </Card>
        {openRegion && (
          <OpenRegion
            onSubmit={this.handleOpenRegion}
            onCancel={this.cancelOpenRegion}
          />
        )}
        {showUninstallCluster && (
          <ConfirmModal
            onOk={this.handleCloseRegion}
            loading={closeRegionLoading}
            title={formatMessage({id: 'teamManage.tabs.cluster.unloadCluster'})}
            desc={formatMessage({id: 'teamManage.tabs.cluster.unloadCluster.desc'})}
            onCancel={this.cancelCloseRegion}
          />
        )}
      </div>
    );
  }
}
