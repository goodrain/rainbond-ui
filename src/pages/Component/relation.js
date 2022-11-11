/* eslint-disable guard-for-in */
/* eslint-disable camelcase */
/* eslint-disable react/no-multi-comp */
import { Button, Card, Icon, Modal, notification, Table } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import AddRelation from '../../components/AddRelation';
import EnvironmentVariable from '../../components/EnvironmentVariable';
import NoPermTip from '../../components/NoPermTip';
import ScrollerX from '../../components/ScrollerX';
import {
  batchAddRelationedApp,
  getRelationedApp,
  removeRelationedApp
} from '../../services/app';
import globalUtil from '../../utils/global';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

// 查看连接信息
class ViewRelationInfo extends PureComponent {
  render() {
    const { appAlias, onCancel } = this.props;
    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.Relation.ViewRelationInfo.title'/>}
        width={1000}
        visible
        onCancel={onCancel}
        footer={[<Button onClick={onCancel}><FormattedMessage id='componentOverview.body.Relation.ViewRelationInfo.close'/></Button>]}
      >
        <EnvironmentVariable
          title=""
          type="OuterEnvs"
          autoQuery
          appAlias={appAlias}
        />
      </Modal>
    );
  }
}
// eslint-disable-next-line react/no-redundant-should-component-update
@connect(null, null, null, { withRef: true })
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddRelation: false,
      relationList: [],
      viewRelationInfo: null,
      showText: null,
      page: 1,
      pageSize: 8,
      total: 0
    };
  }
  componentDidMount() {
    this.loadRelationedApp();
  }
  shouldComponentUpdate() {
    return true;
  }

  onViewRelationInfo = data => {
    this.setState({ viewRelationInfo: data });
  };
  onPageChange = page => {
    this.setState({ page }, () => {
      this.loadRelationedApp();
    });
  };
  canView() {
    const {
      componentPermissions: { isRely }
    } = this.props;
    return isRely;
  }
  loadRelationedApp = () => {
    const { page, pageSize } = this.state;
    getRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      page,
      pageSize
    }).then(res => {
      if (res) {
        let arr = res.bean.port_list;
        if (res.list && res.list.length > 0) {
          res.list.map(item => {
            const { ports_list } = item;
            arr = arr.concat(ports_list);
            return item;
          });
        }
        arr = this.isRepeat(arr);
        this.setState({
          relationList: res.list || [],
          showText: arr,
          total: res.bean.total
        });
      }
    });
  };
  isRepeat = arr => {
    const hash = {};
    for (const i in arr) {
      if (hash[arr[i]])
        // hash 哈希
        return true;
      hash[arr[i]] = true;
    }
    return false;
  };
  showAddRelation = () => {
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
    this.setState({ showAddRelation: false });
  };
  handleSubmitAddRelation = ids => {
    batchAddRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      dep_service_ids: ids
    }).then(data => {
      if (data) {
        notification.info({ message: formatMessage({id:'notification.hint.toUpdata'}) });
        this.loadRelationedApp();
        this.handleCancelAddRelation();
      }
    });
  };

  handleRemoveRelationed = app => {
    removeRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      dep_service_id: app.service_id
    }).then(data => {
      if (data) {
        this.loadRelationedApp();
      }
    });
  };

  cancelViewRelationInfo = () => {
    this.setState({ viewRelationInfo: null });
  };

  render() {
    const { showText, relationList } = this.state;
    const { appAlias } = this.props;
    if (!this.canView()) return <NoPermTip />;

    return (
      <Fragment>
        <EnvironmentVariable
          // title="组件连接信息"
          title={<FormattedMessage id='componentOverview.body.Relation.EnvironmentVariable.title'/>}
          type="Outer"
          autoQuery
          appAlias={appAlias}
        />
        <Card
          style={{
            boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px', 
            borderRadius:5,
          }}
          title={[
            <span><FormattedMessage id='componentOverview.body.Relation.EnvironmentVariable.information'/></span>,
            <span style={{ color: 'red' }}>
              {showText && formatMessage({id:'componentOverview.body.Relation.EnvironmentVariable.conflict'})}
            </span>
          ]}
          extra={
            <Button onClick={this.showAddRelation}>
              <Icon type="plus" /> <FormattedMessage id='componentOverview.body.Relation.EnvironmentVariable.add'/>
            </Button>
          }
        >
          <ScrollerX sm={650}>
            <Table
              pagination={{
                current: this.state.page,
                pageSize: this.state.pageSize,
                total: this.state.total,
                onChange: this.onPageChange
              }}
              columns={[
                {
                  // title: '组件名',
                  title: formatMessage({id:'componentOverview.body.Relation.table.service_cname'}),
                  dataIndex: 'service_cname',
                  render: (val, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                        data.service_alias
                      }/overview`}
                    >
                      {val}
                    </Link>
                  )
                },
                {
                  title: formatMessage({id:'componentOverview.body.Relation.table.group_name'}),
                  // title: '所属应用',
                  dataIndex: 'group_name',
                  render: (val, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                        data.group_id
                      }`}
                    >
                      {val}
                    </Link>
                  )
                },
                {
                  title: formatMessage({id:'componentOverview.body.Relation.table.operation'}),
                  // title: '操作',
                  dataIndex: 'var',
                  render: (val, data) => (
                    <Fragment>
                      <a
                        onClick={() => this.onViewRelationInfo(data)}
                        href="javascript:;"
                        style={{ margintRight: 10 }}
                      >
                        {/* 连接信息 */}
                        <FormattedMessage id='componentOverview.body.Relation.table.connection'/>
                      </a>
                      <a
                        onClick={() => {
                          this.handleRemoveRelationed(data);
                        }}
                        href="javascript:;"
                        style={{ margintRight: 10 }}
                      >
                        {/* 取消依赖 */}
                        <FormattedMessage id='componentOverview.body.Relation.table.cancel'/>
                      </a>
                    </Fragment>
                  )
                }
              ]}
              dataSource={relationList}
            />
          </ScrollerX>
        </Card>

        {this.state.showAddRelation && (
          <AddRelation
            appAlias={this.props.appAlias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddRelation}
          />
        )}
        {this.state.viewRelationInfo && (
          <ViewRelationInfo
            appAlias={this.state.viewRelationInfo.service_alias}
            onCancel={this.cancelViewRelationInfo}
          />
        )}
      </Fragment>
    );
  }
}
