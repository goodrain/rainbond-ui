/* eslint-disable import/no-named-default */
/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/sort-comp */
/* eslint-disable camelcase */
import {
  Button,
  Card,
  Divider,
  Form,
  Icon,
  Modal,
  notification,
  Select,
  Spin
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import {
  default as AddGroup,
  default as EditGroupName
} from '../../components/AddOrEditGroup';
import configureGlobal from '../../utils/configureGlobal';
import globalUtil from '../../utils/global';
import guideUtil from '../../utils/guide';
import rainbondUtil from '../../utils/rainbond';
import { languageObj } from '../../utils/utils';
import styles from './index.less';

const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  groups: global.groups,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  overviewInfo: index.overviewInfo
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      current: 0,
      addApplication: false,
      ServiceVisible: false,
      GuideList: [],
      ServiceList: null,
      SpinState: true
    };
  }

  componentDidMount() {
    this.getGuideState();
  }
  next = () => {
    const current = this.state.current + 1;
    this.setState({ current });
  };

  prev = () => {
    const current = this.state.current - 1;
    this.setState({ current });
  };

  getGuideState = () => {
    this.props.dispatch({
      type: 'global/getGuideState',
      payload: {
        enterprise_id: this.props.user.enterprise_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            GuideList: res.list,
            SpinState: false,
            current:
              res.list && res.list.length > 0 && !res.list[0].status
                ? 0
                : !res.list[1].status
                ? 1
                : !res.list[2].status
                ? 2
                : !res.list[3].status
                ? 3
                : !res.list[4].status
                ? 4
                : !res.list[5].status
                ? 5
                : !res.list[6].status
                ? 6
                : 7
          });
        }
      }
    });
  };

  handleCancelApplication = () => [
    this.setState({
      addApplication: false
    })
  ];

  handleOkApplication = groupId => {
    const { dispatch } = this.props;
    notification.success({ message: formatMessage({id:'notification.success.add'}) });
    this.handleCancelApplication();
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${groupId}`
      )
    );
  };

  handleShare = group_id => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/ShareGroup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id
      },
      callback: data => {
        if (data && data.bean.step === 1) {
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/share/one/${
                data.bean.group_id
              }/${data.bean.ID}`
            )
          );
        }
        if (data && data.bean.step === 2) {
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/share/two/${
                data.bean.group_id
              }/${data.bean.ID}`
            )
          );
        }
      }
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err) {
        this.handleShare(fieldsValue.group_id);
        this.setState({ ServiceVisible: false });
      }
    });
  };

  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };

  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    this.cancelAddGroup();
  };

  handleOnchange = () => {
    const { dispatch, form } = this.props;
    const groupId = form.getFieldValue('group_id');
    dispatch({
      type: 'application/fetchApps',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        group_id: groupId,
        page: 1,
        page_size: 80
      },
      callback: data => {
        if (data && data.status_code === 200) {
          this.setState({
            ServiceList: data.list || []
          });
        }
      }
    });
  };

  completedShow = () => {
    return <span style={{ color: 'rgb(82, 196, 26)' }}>已完成</span>;
  };
  lineShow = () => {
    return <Divider>完成任务前请查阅以上内容</Divider>;
  };
  getGuide = guideKey => {
    let guide = { key: guideKey, status: false };
    this.state.GuideList.map(item => {
      if (item.key == guideKey) {
        guide = item;
      }
    });
    return guide;
  };

  CreateApp = () => {
    const grade = this.getGuide('app_create');
    const { rainbondInfo } = this.props;
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);
    if (!grade) {
      return '';
    }
    return (
      <div
        className={styles.connect}
        style={{ borderColor: grade.status ? '#1890ff' : '#A8A2A2' }}
      >
        <Icon
          className={styles.icono}
          type="caret-up"
          theme="filled"
          style={{ color: grade.status ? '#1890ff' : '#A8A2A2' }}
        />
        <p>
          应用是核心抽象，由N个组件构成，它类似于Maven或Dotnet中的Project，通常是指一个完整的业务系统。在应用级抽象中用户通常关注以下知识：
        </p>
        <p>
          1. 应用拓扑图可视化，便捷观察所有组件的运行状态{' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-manage/app-topology/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          2. 应用生命周期管理，涉及应用启停、升级和构建
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-manage/operation/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          3. 应用发布到企业应用市场{' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-manage/share-app/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          4. 应用整体的备份和恢复以及跨团队或集群迁移{' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-manage/app-backup/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        {this.lineShow()}
        <p style={{ textAlign: 'center' }}>
          {grade.status ? (
            this.completedShow()
          ) : (
            <Button
              type="primary"
              onClick={() => {
                this.setState({ addApplication: true });
              }}
            >
              新建应用，完成任务
            </Button>
          )}
        </p>
      </div>
    );
  };

  CreateSourceCode = () => {
    const grade = this.getGuide('source_code_service_create');
    const { rainbondInfo } = this.props;
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);

    if (!grade) {
      return '';
    }
    return (
      <div
        className={styles.connect}
        style={{ borderColor: grade.status ? '#1890ff' : '#A8A2A2' }}
      >
        <Icon
          className={styles.icont}
          type="caret-up"
          theme="filled"
          style={{ color: grade.status ? '#1890ff' : '#A8A2A2' }}
        />

        <p>
          基于源码创建并持续构建组件是面向开发者的最常用的功能，支持
          <a href={languageObj.Java} target="_blank">
            Java
          </a>
          /
          <a href={languageObj.PHP} target="_blank">
            PHP
          </a>
          /
          <a href={languageObj.Python} target="_blank">
            Python
          </a>
          /
          <a href={languageObj.Nodejs} target="_blank">
            NodeJS
          </a>
          /
          <a href={languageObj.Go} target="_blank">
            Golang
          </a>
          /
          <a href={languageObj.Netcore} target="_blank">
            .NetCore
          </a>
          等开发语言的持续构建。当前任务以
          <a href={languageObj.Java} target="_blank">
            Java
          </a>
          源码为例，用户通常关注以下知识：
        </p>
        <p>
          1. 如何支持各类型开发语言
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-creation/language-support/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          2. Maven私服仓库如何对接到平台
          {platform_url && (
            <a
              href={`${platform_url}docs/advanced-scenarios/devops/connection-maven-repository/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          3. 基于Git代码仓库的自动化持续构建
          {platform_url && (
            <a
              href={`${platform_url}docs/advanced-scenarios/devops/autobuild/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          4. 服务配置文件动态配置{' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-service-manage/service-volume/#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        {this.lineShow()}
        <p>
          完成任务说明: 使用你自己的源码或基于JavaDemo源码创建组件：
          <code style={{ color: '#000000' }}>
            https://github.com/goodrain/java-maven-demo.git
          </code>
        </p>
        <p style={{ textAlign: 'center' }}>
          {grade.status ? (
            this.completedShow()
          ) : (
            <div>
              {platform_url && (
                <Button style={{ marginRight: '10px' }}>
                  <a href={`${platform_url}video.html`} target="_blank">
                    查看视频教程
                  </a>
                </Button>
              )}
              <Button
                type="primary"
                onClick={() => {
                  this.props.dispatch(
                    routerRedux.push(
                      `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/code`
                    )
                  );
                }}
              >
                创建源码组件，完成任务
              </Button>
            </div>
          )}
        </p>
      </div>
    );
  };

  CreateByImageTaskShow = () => {
    const grade = this.getGuide('image_service_create');
    const { rainbondInfo } = this.props;
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);

    if (!grade) {
      return '';
    }
    return (
      <div
        className={styles.connect}
        style={{ borderColor: grade.status ? '#1890ff' : '#A8A2A2' }}
      >
        <Icon
          className={styles.icons}
          type="caret-up"
          theme="filled"
          style={{ color: grade.status ? '#1890ff' : '#A8A2A2' }}
        />
        <p>
          从镜像创建组件要求用户具备一定的容器化知识，本次任务我们将从镜像安装Mysql数据库，完成本次任务用户关注以下知识：
        </p>
        <p>
          1. 支持基于Docker镜像创建组件的规范{' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-creation/image-support/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          2. 支持基于DockerCompose便捷创建多个组件的规范
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-creation/image-support/docker-compose/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        {this.lineShow()}
        <p style={{ textAlign: 'center' }}>
          {grade.status ? (
            this.completedShow()
          ) : (
            <div>
              <p>
                复制以下DockerRun命令示例去创建组件：
                <code style={{ color: '#000000' }}>
                  docker run -it -e MYSQL_ROOT_PASSWORD=rootpassword mysql
                </code>
              </p>
              <Button
                type="primary"
                onClick={() => {
                  this.props.dispatch(
                    routerRedux.push(
                      `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/image/dockerrun`
                    )
                  );
                }}
              >
                去创建组件
              </Button>
            </div>
          )}
        </p>
      </div>
    );
  };

  MarketInstallation = () => {
    const { GuideList } = this.state;

    return (
      <div
        className={styles.connect}
        style={{
          borderColor:
            GuideList && GuideList.length > 0 && GuideList[2].status
              ? '#1890ff'
              : '#A8A2A2'
        }}
      >
        <Icon
          className={styles.icons}
          type="caret-up"
          theme="filled"
          style={{
            color:
              GuideList && GuideList.length > 0 && GuideList[2].status
                ? '#1890ff'
                : '#A8A2A2'
          }}
        />

        <p>
          从应用市场安装应用是最便捷的云应用安装交付方式，目前
          {/* {configureGlobal.rainbondTextShow && (
            <a href={languageObj.Rainbond} target="_blank">
              Rainbond
            </a>
          )} */}
          公有市场中提供了部分数据库类中间件和一些开源应用。完成当前任务用户会关注以下功能:
        </p>
        <p>1. 从公有应用市场同步应用</p>
        <p>2. 从应用市场一键安装数据库组件</p>
        <p>3. 初始化数据库数据</p>
        <p style={{ textAlign: 'center' }}>
          {/* <Button style={{ marginRight: "10px" }}>查看视频教程</Button> */}
          {GuideList && GuideList.length > 0 && !GuideList[2].status ? (
            this.completedShow()
          ) : (
            <Button
              type="primary"
              onClick={() => {
                this.props.dispatch(
                  routerRedux.push(
                    `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/market`
                  )
                );
              }}
            >
              去完成
            </Button>
          )}
        </p>
      </div>
    );
  };

  Service = () => {
    const grade = this.getGuide('service_connect_db');
    const { rainbondInfo } = this.props;
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);

    if (!grade) {
      return '';
    }
    return (
      <div
        className={styles.connect}
        style={{ borderColor: grade.status ? '#1890ff' : '#A8A2A2' }}
      >
        <Icon
          className={styles.iconf}
          type="caret-up"
          theme="filled"
          style={{ color: grade.status ? '#1890ff' : '#A8A2A2' }}
        />

        <p>
          当前任务以组件连接数据库为例学习组件之间内网通信机制，完成当前任务用户会关注以下知识：
        </p>
        <p>
          1. 组件建立依赖关系包含的通信原理（组件注册/组件发现){' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-service-manage/service-rely/#%E6%9C%8D%E5%8A%A1%E4%BE%9D%E8%B5%96%E7%AE%A1%E7%90%86`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          2. 组件公用连接信息变量如何设置
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-service-manage/service-rely/#%E6%9C%8D%E5%8A%A1%E8%BF%9E%E6%8E%A5%E4%BF%A1%E6%81%AF%E7%AE%A1%E7%90%86`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          3. 了解如何建立组件依赖关系{' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-service-manage/service-rely/#%E6%9C%8D%E5%8A%A1%E4%BE%9D%E8%B5%96%E7%AE%A1%E7%90%86`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        {this.lineShow()}
        <p>
          完成任务说明：设置上一个任务创建的数据库组件的连接信息(比如MYSQL_USER,MYSQL_PASSWORD等)，将源码创建的组件依赖数据库组件建立依赖关系，源码组件通过环境变量获取数据库连接信息即可连接数据库
        </p>
        <p style={{ textAlign: 'center' }}>
          {grade.status ? this.completedShow() : ''}
        </p>
      </div>
    );
  };
  ReleaseMarket = () => {
    const grade = this.getGuide('share_app');
    const { rainbondInfo } = this.props;
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);

    if (!grade) {
      return '';
    }

    return (
      <div
        className={styles.connect}
        style={{
          borderColor: grade.status ? '#1890ff' : '#A8A2A2'
        }}
      >
        <Icon
          className={styles.iconr}
          type="caret-up"
          theme="filled"
          style={{
            color: grade.status ? '#1890ff' : '#A8A2A2'
          }}
        />

        <p>
          将前置任务创建的应用发布到应用市场，从而让你的业务系统支持一键交付能力。完成当前任务用户会关注以下功能：
        </p>
        <p>
          1. 应用发布到企业应用市场{' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-manage/share-app/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          2. 应用支持基于应用市场一键安装的关键因素{' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/app-store/app-specification/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          3. SaaS化应用市场如何建立{' '}
          <a href="https://www.goodrain.com" target="_blank">
            [联系商业支持]
          </a>
        </p>
        {this.lineShow()}
        <p>
          完成任务说明：将上述任务建立的源码业务+数据库的完整应用发布到应用市场，并尝试一键安装出一个新的应用。
        </p>
        <p style={{ textAlign: 'center' }}>
          {grade.status ? this.completedShow() : ''}
        </p>
      </div>
    );
  };

  AccessStrategy = () => {
    const grade = this.getGuide('custom_gw_rule');
    const { rainbondInfo } = this.props;
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);

    if (!grade) {
      return '';
    }

    return (
      <div
        className={styles.connect}
        style={{
          borderColor: grade.status ? '#1890ff' : '#A8A2A2'
        }}
      >
        <Icon
          className={styles.icona}
          type="caret-up"
          theme="filled"
          style={{
            color: grade.status ? '#1890ff' : '#A8A2A2'
          }}
        />

        <p>
          需要被外网访问的组件需要配置网关访问策略，
          {/* <a href={languageObj.Rainbond} target="_blank">
            Rainbond
          </a> */}
          网关支持HTTP/WebSocket/TCP/UDP服务访问协议。HTTP类策略根据域名等信息进行路由匹配，TCP类策略通过IP+端口进行路由匹配。完成当前任务用户会关注以下功能：
        </p>
        <p>
          1. HTTP访问策略配置{' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/gateway/traffic-control/#%E6%B7%BB%E5%8A%A0-http-%E7%AD%96%E7%95%A5`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          2. HTTPs证书管理{' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/gateway/cert-management/`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        <p>
          3. TCP访问策略配置{' '}
          {platform_url && (
            <a
              href={`${platform_url}docs/user-manual/gateway/traffic-control/#tcp-%E8%AE%BF%E9%97%AE%E7%AD%96%E7%95%A5`}
              target="_blank"
            >
              [参考文档]
            </a>
          )}
        </p>
        {this.lineShow()}
        <p>
          完成任务说明：通过配置自定义的域名来访问上述任务创建的应用，或者配置IP+端口的TCP访问策略来访问应用。
        </p>
        <p style={{ textAlign: 'center' }}>
          {grade.status ? (
            this.completedShow()
          ) : (
            <Button
              type="primary"
              onClick={() => {
                this.props.dispatch(
                  routerRedux.push(
                    `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/gateway/control/http/true`
                  )
                );
              }}
            >
              去完成
            </Button>
          )}
        </p>
      </div>
    );
  };

  AnalysisPlugin = () => {
    const grade = this.getGuide('install_plugin');
    if (!grade) {
      return '';
    }

    return (
      <div
        className={styles.connect}
        style={{
          borderColor: grade.status ? '#1890ff' : '#A8A2A2'
        }}
      >
        <Icon
          className={styles.iconq}
          type="caret-up"
          theme="filled"
          style={{
            color: grade.status ? '#1890ff' : '#A8A2A2'
          }}
        />
        <p>
          组件插件体系是对组件治理功能的扩展方式，
          {/* <a href={languageObj.Rainbond} target="_blank">
            Rainbond
          </a> */}
          默认提供了性能分析插件和网络治理插件。当前任务为前置任务安装的Java组件安装性能分析插件为例。完成当前任务用户会关注以下知识：
        </p>
        <p>1. 性能分析插件的安装</p>
        <p>2. 组件开通性能分析插件</p>
        <p>3. 性能分析结果的实时展示,支持HTTP协议和Mysql协议的服务</p>
        {this.lineShow()}
        <p>
          完成任务说明：在插件管理中安装已集成的性能分析插件，确定插件构建成功后前往上述任务创建的具有HTTP协议或Mysql协议端口组件管理面板，插件栏目中开通性能分析插件并更新组件，
          访问组件并观看组件的监控栏目数据。
        </p>
        <p style={{ textAlign: 'center' }}>
          {grade.status ? (
            this.completedShow()
          ) : (
            <Button
              type="primary"
              onClick={() => {
                this.props.dispatch(
                  routerRedux.push(
                    `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns`
                  )
                );
              }}
            >
              去完成
            </Button>
          )}
        </p>
      </div>
    );
  };

  render() {
    const {
      current,
      GuideList,
      SpinState,
      ServiceVisible,
      addGroup,
      addApplication
    } = this.state;
    const { groups, form } = this.props;
    const { getFieldDecorator } = form;
    let num = 0;
    const steps = [
      {
        title: '创建应用',
        content: configureGlobal.rainbondTextShow && this.CreateApp(),
        status: guideUtil.getStatus('app_create', GuideList)
      },
      {
        title: '基于源码创建组件',
        content: this.CreateSourceCode(),
        status: guideUtil.getStatus('source_code_service_create', GuideList)
      },
      {
        title: '基于镜像安装数据库',
        content:
          configureGlobal.rainbondTextShow && this.CreateByImageTaskShow(),
        status: guideUtil.getStatus('image_service_create', GuideList)
      },
      {
        title: '组件连接数据库',
        content: this.Service(),
        status: guideUtil.getStatus('service_connect_db', GuideList)
      },
      {
        title: '发布应用到应用市场',
        content: this.ReleaseMarket(),
        status: guideUtil.getStatus('share_app', GuideList)
      },
      {
        title: '配置应用访问策略',
        content: configureGlobal.rainbondTextShow && this.AccessStrategy(),
        status: guideUtil.getStatus('custom_gw_rule', GuideList)
      },
      {
        title: '安装性能分析插件',
        content: this.AnalysisPlugin(),
        status: guideUtil.getStatus('install_plugin', GuideList)
      }
    ];
    if (steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        if (steps[i].status) {
          num++;
        }
      }
    }

    return (
      <Card
        style={{
          height: '600px',
          marginBottom: 24
        }}
        bodyStyle={{
          paddingTop: 12
        }}
        bordered={false}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>基础任务</span>
            {SpinState ? (
              ''
            ) : (
              <span>
                {num}/7
                <span
                  style={{
                    color: num == 7 ? 'rgb(82, 196, 26)' : 'red',
                    marginLeft: '10px'
                  }}
                >
                  {num == 7 ? '已完成' : '未完成'}
                </span>
              </span>
            )}
          </div>
        }
      >
        {SpinState ? (
          <div
            style={{
              textAlign: 'center',
              height: '400px',
              lineHeight: '400px'
            }}
          >
            <Spin size="large" />{' '}
          </div>
        ) : (
          <div>
            <div className={styles.stepsbox}>
              {steps.map((item, index) => {
                const { status } = item;
                return (
                  <div
                    className={status ? styles.stepssuccess : styles.stepsinfo}
                    key={index}
                    onClick={() => {
                      this.setState({ current: index });
                    }}
                  >
                    <div
                      className={
                        status
                          ? index == 0
                            ? styles.stepssuccesslux1
                            : index == 1
                            ? styles.stepssuccesslux2
                            : index == 2
                            ? styles.stepssuccesslux3
                            : index == 3
                            ? styles.stepssuccesslux4
                            : index == 4
                            ? styles.stepssuccesslux5
                            : index == 5
                            ? styles.stepssuccesslux6
                            : styles.stepssuccesslux7
                          : index == 0
                          ? styles.stepsinfolux1
                          : index == 1
                          ? styles.stepsinfolux2
                          : index == 2
                          ? styles.stepsinfolux3
                          : index == 3
                          ? styles.stepsinfolux4
                          : index == 4
                          ? styles.stepsinfolux5
                          : index == 5
                          ? styles.stepsinfolux6
                          : styles.stepsinfolux7
                      }
                    />
                    <div
                      className={
                        status ? styles.stepssuccessbj : styles.stepsinfobj
                      }
                    >
                      <span>
                        {status && (
                          <svg
                            viewBox="64 64 896 896"
                            data-icon="check"
                            width="1em"
                            height="1em"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z" />
                          </svg>
                        )}
                      </span>
                    </div>
                    <div
                      className={
                        status
                          ? styles.stepssuccesscontent
                          : styles.stepsinfocontent
                      }
                    >
                      <div>{item.title}</div>
                    </div>
                    <div />
                  </div>
                );
              })}
            </div>

            {ServiceVisible && (
              <Modal
                title="请选择或创建一个应用"
                visible
                onOk={this.handleSubmit}
                onCancel={() => {
                  this.setState({ ServiceVisible: false });
                }}
              >
                <Form onSubmit={this.handleSubmit} layout="horizontal">
                  <Form.Item {...formItemLayout} label="应用名称">
                    {getFieldDecorator('group_id', {
                      initialValue: '',
                      rules: [{ required: true, message: '请选择' }]
                    })(
                      <Select
                        getPopupContainer={triggerNode =>
                          triggerNode.parentNode
                        }
                        placeholder="请选择所属应用"
                        style={{
                          display: 'inline-block',
                          width: 270,
                          marginRight: 15
                        }}
                      >
                        {(groups || []).map(group => (
                          <Option key={group.group_id} value={group.group_id}>
                            {group.group_name}
                          </Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>
                </Form>
              </Modal>
            )}

            {addGroup && (
              <AddGroup
                onCancel={this.cancelAddGroup}
                onOk={this.handleAddGroup}
              />
            )}

            {addApplication && (
              <EditGroupName
                title={formatMessage({id:'popover.newApp.title'})}
                onCancel={this.handleCancelApplication}
                onOk={this.handleOkApplication}
              />
            )}
            <div>{steps[current > 6 ? 6 : current].content}</div>
          </div>
        )}
      </Card>
    );
  }
}
