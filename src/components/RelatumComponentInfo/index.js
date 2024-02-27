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
  getRelatumApp,
  removeRelationedApp
} from '../../services/app';
import globalUtil from '../../utils/global';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less'

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
      total: 0,
      serviceId: ''
    };
  }
  componentDidMount() {
    this.loadRelationedApp();
  }

  onPageChange = page => {
    this.setState({ page }, () => {
      this.loadRelationedApp();
    });
  };

  loadRelationedApp = () => {
    const { page, pageSize } = this.state;
    getRelatumApp({
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
          total: res.bean.total,
          serviceId: res.bean.service_id
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
  handleSubmitAddRelation = (ids) => {
    const { dispatch, appAlias } = this.props;
    const resultString = ids.join(',');
    dispatch({
      type: 'appControl/addReverseDependency',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        be_dep_service_ids: resultString
      },
      callback: data => {
        if (data) {
          notification.info({ message: formatMessage({ id: 'notification.hint.toUpdata' }) });
          this.loadRelationedApp();
          this.handleCancelAddRelation();
        }
      }   
    })
  };

  handleRemoveRelationed = app => {
    const { serviceId } = this.state
    removeRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: app.service_alias,
      dep_service_id: serviceId
    }).then(data => {
      if (data) {
        this.loadRelationedApp();
      }
    });
  };



  render() {
    const { showText, relationList } = this.state;
    const { appAlias, method } = this.props;

    return (
      <Fragment>
         <Card
          title={<>
            <span>{'被外部组件依赖'}</span>
            <span className={styles.desc}>表格列出了当前组件被其他外部组件所依赖的情况，它们是依赖于当前组件的外部组件。</span>
          </>}
          extra={
            <Button onClick={this.showAddRelation}>
              <Icon type="plus" /> <FormattedMessage id='componentOverview.body.Relation.EnvironmentVariable.add' />
            </Button>
          }
          style={{
            borderRadius: 5,
            marginTop: '20px'
          }}
        >
          <ScrollerX sm={650}>
            <Table
              rowKey={(record,index) => index}
              pagination={this.state.total > this.state.pageSize ? {
                current: this.state.page,
                pageSize: this.state.pageSize,
                total: this.state.total,
                onChange: this.onPageChange
              } : false}
              columns={[
                {
                  // title: '组件名',
                  title: formatMessage({ id: 'componentOverview.body.Relation.table.service_cname' }),
                  dataIndex: 'service_cname',
                  render: (val, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${data.service_alias
                        }/overview`}
                    >
                      {val}
                    </Link>
                  )
                },
                {
                  title: formatMessage({ id: 'componentOverview.body.Relation.table.group_name' }),
                  // title: '所属应用',
                  dataIndex: 'group_name',
                  render: (val, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${data.group_id
                        }`}
                    >
                      {val}
                    </Link>
                  )
                },
                {
                  title: formatMessage({ id: 'componentOverview.body.Relation.table.operation' }),
                  // title: '操作',
                  dataIndex: 'var',
                  render: (val, data) => (
                    <Fragment>
                      <a
                        onClick={() => {
                          this.handleRemoveRelationed(data);
                        }}
                        href="javascript:;"
                        style={{ margintRight: 10 }}
                      >
                        {/* 取消依赖 */}
                        <FormattedMessage id='componentOverview.body.Relation.table.cancel' />
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
            type='relatum'
            appAlias={this.props.appAlias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddRelation}
          />
        )}
      </Fragment>
    );
  }
}
