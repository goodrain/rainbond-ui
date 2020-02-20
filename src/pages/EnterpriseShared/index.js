import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Card,
  Button,
  Col,
  Row,
  Menu,
  Dropdown,
  Icon,
  Spin,
  Tabs,
  Radio,
  Input,
  Checkbox,
  Pagination,
} from 'antd';
import { routerRedux } from 'dva/router';
import NoComponent from '../../../public/images/noComponent.png';
import userUtil from '../../utils/user';
import Lists from '../../components/Lists';

import PageHeaderLayout from '../../layouts/PageHeaderLayout';

import styles from './index.less';

const { Search } = Input;

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
}))
export default class EnterpriseShared extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      teamList: [],
      componentList: [],
      exitTeamName: '',
      userTeamsLoading: false,
      adminer,
      tagList: [],
      tags: [],
      scope: 'enterprise',
    };
  }
  componentDidMount() {
    const { user } = this.props;
    if (user) {
      this.load();
    }
  }

  load = () => {
    this.getComponent();
    this.getTags();
  };

  handleSearchTeam = name => {
    this.setState(
      {
        page: 1,
        name,
      },
      () => {
        this.getComponent();
      }
    );
  };

  getComponent = () => {
    const { dispatch, user } = this.props;
    const { page, page_size, name, scope, tags } = this.state;
    dispatch({
      type: 'global/fetchComponent',
      payload: {
        enterprise_id: user.enterprise_id,
        user_id: user.user_id,
        app_name: name,
        scope,
        page,
        page_size,
        tags,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            componentList: res.list,
            userTeamsLoading: false,
          });
        }
      },
    });
  };

  getTags = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchComponentTags',
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            tagList: res.list,
          });
        }
      },
    });
  };

  onChangeRadio = e => {
    this.setState({
      scope: e.target.value,
    });
  };

  onChangeCheckbox = checkedValues => {
    this.setState({
      tags: checkedValues,
    });
  };

  render() {
    const { componentList, adminer, userTeamsLoading, tagList } = this.state;

    const managementMenu = exitTeamName => {
      return (
        <Menu>
          <Menu.Item>
            <a href="javascript:;" onClick={() => {}}>
              导出应用
            </a>
          </Menu.Item>
          <Menu.Item>
            <a href="javascript:;" onClick={() => {}}>
              删除应用
            </a>
          </Menu.Item>
        </Menu>
      );
    };

    const operation = (
      <Col span={4} style={{ textAlign: 'right' }} className={styles.btns}>
        {adminer && (
          <Button
            type="primary"
            onClick={this.onAddTeam}
            style={{ marginRight: '22px' }}
          >
            云端同步
          </Button>
        )}
        <Button type="primary" onClick={this.onJoinTeam}>
          <Icon type="plus" />
        </Button>
      </Col>
    );
    const noShared = (
      <div className={styles.noShared}>
        <img src={NoComponent} />
        <p>当前无组件，请选择方式添加</p>
        <div className={styles.btns}>
          <Button type="primary" onClick={this.onJoinTeam}>
            云端同步
          </Button>
          <Button type="primary" onClick={this.onJoinTeam}>
            创建组件
          </Button>
          <Button type="primary" onClick={this.onJoinTeam}>
            离线导入
          </Button>
        </div>
      </div>
    );

    const sharedList = (
      <div>
        <Row
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Col span={20} style={{ textAlign: 'left', display: 'flex' }}>
            <Search
              style={{ width: '396px' }}
              placeholder="请输入名称进行搜索"
              onSearch={this.handleSearchTeam}
            />
            <div className={styles.serBox}>
              <div>
                <Radio.Group
                  onChange={this.onChangeRadio}
                  defaultValue="enterprise"
                >
                  <Radio.Button value="enterprise">企业</Radio.Button>
                  <Radio.Button value="team">团队</Radio.Button>
                </Radio.Group>
              </div>
              <div />
              <div>
                <Checkbox.Group
                  style={{ width: '100%' }}
                  onChange={this.onChangeCheckbox}
                >
                  {tagList &&
                    tagList.map(item => {
                      const { name, tag_id } = item;
                      return (
                        <Checkbox key={tag_id} value={tag_id}>
                          {name}
                        </Checkbox>
                      );
                    })}
                </Checkbox.Group>
              </div>
            </div>
          </Col>
          {operation}
        </Row>

        {componentList.map((item, index) => {
          const {
            app_id,
            pic,
            describe,
            app_name,
            tags,
            versions,
            dev_status,
          } = item;
          return (
            <Lists
              key={app_id}
              stylePro={{ marginBottom: '10px' }}
              Cols={
                <div className={styles.h70}>
                  <Col span={4} style={{ display: 'flex' }}>
                    <div className={styles.lt}>
                      <p>
                        <Icon type="arrow-down" />
                        {index+1}
                      </p>
                    </div>
                    <div className={styles.imgs}>
                      <img src={NoComponent} alt="" />
                    </div>
                  </Col>
                  <Col span={8} className={styles.tits}>
                    <div>
                      <p>{app_name}</p>
                      <p>{describe}</p>
                    </div>
                  </Col>
                  <Col span={4} className={styles.status}>
                    <div>
                      <p>{dev_status?dev_status:"release"}</p>
                      <p>{versions && versions.length > 0 && versions[0]}</p>
                    </div>
                  </Col>

                  <Col span={8} className={styles.tags}>
                    {tags.map(item => {
                      const { tag_id, name } = item;
                      return <div key={tag_id}>{name}</div>;
                    })}
                  </Col>
                </div>
              }
              overlay={managementMenu(app_name)}
            />
          );
        })}
      </div>
    );

    return (
      <PageHeaderLayout
        title="——"
        content="将当前平台和云应用市场进行互联，同步应用，插件，数据中心等资源应用下载完成后，方可在 从应用市场安装 直接安装"
      >
        {userTeamsLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <div>
            {sharedList}
            {/* {noShared} */}
          </div>
        )}
      </PageHeaderLayout>
    );
  }
}
