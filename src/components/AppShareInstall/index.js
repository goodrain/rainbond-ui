/* eslint-disable array-callback-return */
import { Button, Checkbox, Form, Input, Modal, Select, Tag, notification, Radio } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import CreateTeam from '../../components/CreateTeam';
import globalUtil from '../../utils/global';
import { pinyin } from 'pinyin-pro';
import cookie from '../../utils/cookie';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect(({ user, global, teamControl }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  currentTeam: teamControl.currentTeam
}))
class AppShareInstall extends PureComponent {
  constructor(props) {
    super(props);
    const { appInfo } = this.props;
    this.state = {
      userTeamList: [],
      appName: '',
      groups: [],
      addGroup: false,
      showAddTeam: false,
      region_name: '',
      installType: 'new',
      currentVersionInfo: appInfo?.versions && appInfo?.versions[0] || {},
    };
  }
  componentDidMount() {
    const { regionName, teamName } = this.props;
    this.fetchPrices();
    if(teamName && regionName){
      this.fetchGroup(teamName, regionName);
    }
  }

  fetchPrices = () => {
    const { dispatch, regionName } = this.props;
    dispatch({
      type: 'global/getPricingConfig',
      payload: {
        region_name: regionName
      },
      callback: (res) => {
        if (res.status_code == 200) {
          this.setState({
            cpuPrice: res.response_data?.cpu_price_per_core / 1000000 || 0,
            memoryPrice: res.response_data?.memory_price_per_gb / 1000000 || 0
          });
        }
      }
    });
  };

  /**
   * 触发添加团队操作。
   * 验证表单中的'团队名'与'区域名'字段，验证无误后设置`addGroup`状态为true。
   */
  onAddGroup = () => {
    const { form } = this.props;
    const { validateFields } = form;
    validateFields(['team_name', 'region_name'], err => {
      if (!err) {
        this.setState({ addGroup: true });
      }
    });
  };

  /**
   * 提交表单处理函数。
   * 验证表单字段，通过回调`onOk`传递验证后的表单值及当前区域名称。
   */
  handleSubmit = () => {
    const { form, appInfo, onOk } = this.props;
    const { region_name } = this.state

    form.validateFields((err, fieldsValue) => {
      onOk(fieldsValue, region_name)
    });
  };
  /**
   * 处理团队变更事件。
   * 根据选定的团队名称更新相关状态，获取该团队下的分组信息，并更新默认的区域名称。
   * 
   * @param {string} teamName - 变更后的团队名称。
   */
  handleTeamChange = teamName => {
    const { form, appInfo } = this.props;
    const { setFieldsValue, getFieldValue } = form;
    const { userTeamList } = this.state;
    userTeamList.forEach(item => {
      if (item.team_name === teamName) {
        this.fetchGroup(teamName, item.region);
        this.setState({
          region_name: item.region
        })
      }
    });

  };
  /**
   * 获取指定团队和区域的分组列表。
   * 根据团队名和区域名获取分组信息，更新表单的默认分组ID，并关闭添加团队的界面。
   * 
   * @param {string} teamName - 团队名称。
   * @param {string} regionName - 区域名称。
   */
  fetchGroup = () => {
    const { setFieldsValue } = this.props.form;
    const { dispatch, teamName, regionName } = this.props;
    dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: teamName,
        region_name: regionName
      },
      callback: res => {
        setFieldsValue({
          group_id: res && res.length > 0 ? res[0].group_id : ''
        });
        this.setState({ groups: res, group_id: res && res.length > 0 ? res[0].group_id : '' });
      }
    });
  };

  /**
   * 确认添加团队和分组操作。
   * 设置所选分组ID至表单，并关闭添加团队的界面。
   * 
   * @param {string} groupId - 分组ID。
   * @param {Array} groups - （可选）分组列表，用于更新界面展示。
   */
  handleAddGroup = (groupId, groups) => {
    const { form } = this.props;
    const { setFieldsValue } = form;
    this.setState({ groups: groups || [] });
    setFieldsValue({ group_id: groupId });
  };

  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({ id: 'placeholder.appEngName' })));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(
            formatMessage({ id: 'placeholder.nameSpaceReg' })
          )
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({ id: 'placeholder.max32' })));
    }
  };

  // 生成英文名
  generateEnglishName = (name) => {
    if (name != undefined && name != '') {
      const { appNames } = this.props;
      const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
      const cleanedPinyinName = pinyinName.toLowerCase();
      if (appNames && appNames.length > 0) {
        const isExist = appNames.some(item => item === cleanedPinyinName);
        if (isExist) {
          const random = Math.floor(Math.random() * 10000);
          return `${cleanedPinyinName}${random}`;
        }
        return cleanedPinyinName;
      }
      return cleanedPinyinName;
    }
    return ''
  }

  // 返回首页
  handleBackHome = () => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push('/'));
  }

  onChangeVersion = value => {
    const { appInfo } = this.props;
    if (appInfo) {
      const versions = appInfo.versions_info || appInfo.versions;
      const currentVersionInfo = versions.find(
        item => item.version === value || item.app_version === value
      ) || {};
      this.setState({
        currentVersionInfo
      });
    }
  };

  render() {
    const { eid, title, appInfo, form, teaName, regionName, isShare } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const {
      userTeamList,
      appName,
      groups,
      addGroup,
      showAddTeam,
      region_name,
      installType,
      currentVersionInfo,
      cpuPrice,
      memoryPrice,
      group_id
    } = this.state;
    const userTeams = userTeamList && userTeamList.length > 0 && userTeamList;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 19 }
      }
    };
    return (
      <div>
        <Modal
          centered
          title={title}
          maskClosable={false}
          visible
          width={480}
          className={styles.TelescopicModal}
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
              <div>
                <span style={{ color: '#8C8C8C', fontSize: '14px' }}>
                  预估(每天)
                  <span style={{ color: '#F5A623', fontSize: '16px', fontWeight: 500, marginLeft: '4px' }}>
                    ¥{(
                      // CPU费用：毫核转核心 * 每小时价格 * 24小时
                      ((this.state.currentVersionInfo?.cpu || 0) / 1000 * cpuPrice * 24) +
                      // 内存费用：MB转换为GB * 每小时价格 * 24小时
                      ((this.state.currentVersionInfo?.memory || 0) / 1024 * memoryPrice * 24)
                    ).toFixed(2)}
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={() => { this.handleBackHome() }}>返回首页</Button>
                <Button loading={isShare} type="primary" onClick={this.handleSubmit}>安装</Button>
              </div>
            </div>
          }
        >
          {appInfo?.describe && (
            <p
              style={{
                background: 'rgba(22, 184, 248, 0.1)',
                padding: '8px'
              }}
            >
              {appInfo.describe}
            </p>
          )}
          <Form onSubmit={this.handleSubmit} layout="horizontal">
            <FormItem {...formItemLayout} label={'版本'}>
              {getFieldDecorator('version', {
                initialValue: appInfo?.versions && appInfo?.versions[0]?.app_version || '',
                rules: [
                  {
                    required: true,
                    message: '请选择版本'
                  }
                ]
              })(
                <Select onChange={this.onChangeVersion} placeholder={'请选择版本'}>
                  {appInfo?.versions?.map((item) => {
                    return <Option value={item.app_version}>{item.app_version}</Option>
                  })}
                </Select>
              )}
              <div style={{ fontSize: '14px', color: '#8C8C8C', marginBottom: '-10px' }}>
                {`资源占用:  CPU ${this.state.currentVersionInfo?.cpu}m / 内存 ${this.state.currentVersionInfo?.memory}MB`}
              </div>
            </FormItem>

            <FormItem {...formItemLayout} label={'类型'}>
              {getFieldDecorator('install_type', {
                initialValue: 'new',
                rules: [
                  {
                    required: true,
                    message: '请选择类型'
                  }
                ]
              })(
                <Radio.Group onChange={(value) => this.setState({ installType: value.target.value })} buttonStyle="solid">
                  <Radio.Button value="new">新建应用</Radio.Button>
                  <Radio.Button value="existing">已有应用</Radio.Button>
                </Radio.Group>
              )}
            </FormItem>
            {installType === 'new' && (
              <>
                <FormItem {...formItemLayout} label={formatMessage({ id: 'popover.newApp.appName' })}>
                  {getFieldDecorator('group_name', {
                    initialValue: '',
                    rules: [
                      { required: true, message: formatMessage({ id: 'popover.newApp.appName.placeholder' }) },
                      {
                        max: 24,
                        message: formatMessage({ id: 'placeholder.max24' })
                      }
                    ]
                  })(<Input placeholder={formatMessage({ id: 'popover.newApp.appName.placeholder' })} />)}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label={'英文名称'}
                >
                  {getFieldDecorator('k8s_app', {
                    initialValue: this.generateEnglishName(form.getFieldValue('group_name')),
                    rules: [
                      {
                        required: true,
                        validator: this.handleValiateNameSpace
                      }
                    ]
                  })(<Input placeholder={formatMessage({ id: 'popover.newApp.appEngName.placeholder' })} />)}
                </FormItem>
              </>
            )}
            {installType === 'existing' && (
              <Form.Item {...formItemLayout} label={<FormattedMessage id='applicationMarket.CreateHelmAppModels.select_app' />}>
                {getFieldDecorator('group_id', {
                  initialValue: Number(group_id),
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'applicationMarket.CreateHelmAppModels.input_app' })
                    }
                  ]
                })(
                  <Select
                    placeholder={formatMessage({ id: 'applicationMarket.CreateHelmAppModels.input_name' })}
                    style={{
                      display: 'inline-block'
                    }}
                  >
                    {(groups || []).map(group => (
                      <Option key={group.group_id} value={group.group_id}>
                        {group.group_name}
                      </Option>
                    ))}
                  </Select>
                )}
                <div className={styles.conformDesc}>
                  <FormattedMessage id='applicationMarket.CreateHelmAppModels.input_install' />
                </div>
              </Form.Item>
            )}

          </Form>
        </Modal >
      </div >
    );
  }
}

export default AppShareInstall;
