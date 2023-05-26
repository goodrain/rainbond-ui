import {
  Affix,
  Button,
  Card,
  Col,
  Form,
  Icon,
  Input,
  notification,
  Radio,
  Row,
  Table,
  Tooltip,
  Select,
  AutoComplete
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddOrEditVolume from '../../components/AddOrEditVolume';
import AddPort from '../../components/AddPort';
import AddStorage from '../../components/AddStorage';
import AddRelation from '../../components/AddRelation';
import ScrollerX from '../../components/ScrollerX';
import AddRelationMnt from '../../components/AddRelationMnt';
import ConfirmModal from '../../components/ConfirmModal';
import EditPortAlias from '../../components/EditPortAlias';
import EnvironmentVariable from '../../components/EnvironmentVariable';
import NoPermTip from '../../components/NoPermTip';
import Port from '../../components/Port';
import ViewRelationInfo from '../../components/ViewRelationInfo';
import CustomFooter from "../../layouts/CustomFooter";
import {
  addMnt,
  batchAddRelationedApp,
  getMnt,
  getRelationedApp,
  removeRelationedApp
} from '../../services/app';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import cookie from '@/utils/cookie';
import { getVolumeTypeShowName } from '../../utils/utils';
import CodeBuildConfig from '../CodeBuildConfig';
import styles from './setting.less';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Option, OptGroup } = Select;
@connect(null, null, null, { withRef: true })
@Form.create()
class BaseInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      memoryList: [
        {
          text: '64M',
          value: 64
        },
        {
          text: '128M',
          value: 128
        },
        {
          text: '256M',
          value: 256
        },
        {
          text: '512M',
          value: 512
        },
        {
          text: '1G',
          value: 1024
        },
        {
          text: '2G',
          value: 1024 * 2
        },
        {
          text: '4G',
          value: 1024 * 4
        },
        {
          text: '8G',
          value: 1024 * 8
        },
        {
          text: '16G',
          value: 1024 * 16
        }
      ],
      is_flag: false,
      method: false,
      memory: false,
      cpu: false
    };
  }
  handleSubmit = () => {
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        onSubmit(fieldsValue);
      }
    });
  };
  handleChange = (value) => {
  }
  onChecks = (e) => {
    const { appDetail, form, handleBuildSwitch } = this.props;
    const { method, memory, cpu } = this.state;
    const {
      extend_method: extendMethod,
    } = appDetail.service;
    if(e.target.value != extendMethod){
      this.setState({
        method: true
      },()=>{
        this.handleSwitch()
      })
      
    }else{
      this.setState({
        method: false
      },()=>{
        this.handleSwitch()
      })
    }
    if(e.target.value === 'cronjob'){
      this.setState({
        is_flag:true
      })
    }else{
      this.setState({
        is_flag:false
      })
    }
  }
  RadioGroupChange = (e) =>{
    const { appDetail, handleBuildSwitch } = this.props;
    const {
      min_memory: minMemory,
    } = appDetail.service;
    if(e.target.value != minMemory){
      this.setState({
        memory: true
      },()=>{
        this.handleSwitch()
      })
    }else{
      this.setState({
        memory: false
      },()=>{
        this.handleSwitch()
      })
    }
  }
  inputChange =(e)=>{
    const { appDetail, handleBuildSwitch } = this.props;
    const {
      min_cpu: minCpu
    } = appDetail.service;
    if(e.target.value != minCpu){
      this.setState({
        cpu: true
      },()=>{
        this.handleSwitch()
      })
    }else{
      this.setState({
        cpu: false
      },()=>{
        this.handleSwitch()
      })
    }
  }
  handleSwitch = ()=>{
    const { handleBuildSwitch } = this.props
    const { method, memory, cpu } = this.state;
    handleBuildSwitch((method || memory || cpu))
  }
  render() {
    const { appDetail, form } = this.props;
    const { is_flag } = this.state
    const { getFieldDecorator } = form;
    const {
      extend_method: extendMethod,
      min_memory: minMemory,
      min_cpu: minCpu
    } = appDetail.service;
    const list = this.state.memoryList;
    const arrOption = ['0 * * * *','0 0 * * *','0 0 * * 0','0 0 1 * *','0 0 1 1 *']
    const radioStyle = {
      display: 'block',
      height: '30px',
      lineHeight: '30px'
    };
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 21
        }
      }
    };
    return (
      <Card
        title='资源设置'
        style={{
          marginBottom: 16
        }}
      >
        <Form.Item {...formItemLayout} label={formatMessage({id:'componentCheck.advanced.setup.basic_info.label.min_memory'})}>
          {getFieldDecorator('min_memory', {
            initialValue: minMemory || 0,
            rules: [
              {
                required: true,
                message: formatMessage({id:'placeholder.setting.min_memory'})
              }
            ]
          })(
            <RadioGroup onChange={this.RadioGroupChange}>
              <RadioButton key={0} value={0}>
                {formatMessage({id:'componentCheck.advanced.setup.basic_info.label.noLimit'})}
              </RadioButton>
              {minMemory < list[0].value && minMemory != 0 ? (
                <RadioButton value={minMemory}>{minMemory}M</RadioButton>
              ) : null}
              {list.map((item, index) => {
                return (
                  <RadioButton key={index} value={item.value}>
                    {item.text}
                  </RadioButton>
                );
              })}
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label={formatMessage({id:'componentCheck.advanced.setup.basic_info.label.min_cpu'})}>
          {getFieldDecorator('min_cpu', {
            initialValue: minCpu || 0,
            rules: [
              {
                required: true,
                message: formatMessage({id:'placeholder.plugin.min_cpu'})
              },
              {
                pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                message: formatMessage({id:'placeholder.plugin.min_cpuMsg'})
              }
            ]
          })(
            <Input
              style={{ width: '200px' }}
              type="number"
              min={0}
              addonAfter="m"
              placeholder={formatMessage({id:'placeholder.plugin.min_cpu'})}
              onChange={this.inputChange}
            />
          )}
          <div style={{ color: '#999999', fontSize: '12px' }}>
            {formatMessage({id:'appPublish.shop.pages.form.quota1000.desc'})}
          </div>
        </Form.Item>
        {/* <Row>
          <Col span="5" />
          <Col span="19">
            <Button onClick={this.handleSubmit} type="primary">
              {formatMessage({id:'button.confirm_update'})}
            </Button>
          </Col>
        </Row> */}
      </Card>
    );
  }
}
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class RenderDeploy extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      runtimeInfo: '',
      volumes: [],
      showAddVars: null,
      editor: null,
      toDeleteMnt: null,
      toDeleteVolume: null,
    };
  }
  componentDidMount() {
    this.getRuntimeInfo();
    this.fetchVolumes()
    this.fetchBaseInfo();
  }

  getRuntimeInfo = () => {
    this.props.dispatch({
      type: 'appControl/getRuntimeBuildInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias
      },
      callback: data => {
        if (data) {
          this.setState({ runtimeInfo: data.bean ? data.bean : {} });
        }
      }
    });
  };
  
  fetchVolumes = () => {
    this.props.dispatch({
      type: 'appControl/fetchVolumes',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        is_config: false
      },
      callback: data => {
        if (data) {
          this.setState({
            volumes: data.list || []
          });
        }
      }
    });
  };
  fetchBaseInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchBaseInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias
      }
    });
  };
  onDeleteVolume = data => {
    this.setState({ toDeleteVolume: data });
  };
  onCancelDeleteVolume = () => {
    this.setState({ toDeleteVolume: null });
  };
  onEditVolume = data => {
    this.setState({ showAddVars: data, editor: data });
  };
  handleAddVars = () => {
    this.setState({
      showAddVars: {
        new: true
      }
    });
  };
  handleCancelAddVars = () => {
    this.setState({ showAddVars: null, editor: null });
  };
  handleSubmitAddVars = vals => {
    const { editor } = this.state;
    if (editor) {
      this.props.dispatch({
        type: 'appControl/editorVolume',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appDetail.service.service_alias,
          new_volume_path: vals.volume_path,
          new_file_content: vals.file_content,
          mode: vals.mode,
          ID: editor.ID
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.fetchVolumes();
            this.handleCancelAddVars();
            notification.success({ message:  formatMessage({id:'notification.success.edit'})});
          }
        }
      });
    } else {
      this.props.dispatch({
        type: 'appControl/addVolume',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appDetail.service.service_alias,
          ...vals
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.fetchVolumes();
            this.handleCancelAddVars();
            notification.success({ message: formatMessage({id:'notification.success.add'}) });
          }
        }
      });
    }
  };
  render() {
    const {
      visible,
      appDetail,
      componentPermissions: { isDeploytype, isSource },
      handleBuildSwitch,
      handleEditInfo,
      handleEditRuntime
    } = this.props;
    const { runtimeInfo, volumes } = this.state;
    if (!runtimeInfo) return null;
    const language = appUtil.getLanguage(appDetail);
    return (
      <div>
        {!isDeploytype && !isSource && <NoPermTip />}
        {isDeploytype && (
          <BaseInfo appDetail={appDetail} onSubmit={handleEditInfo} handleBuildSwitch={handleBuildSwitch}/>
        )}
         <Card
          style={{
            marginBottom: 24,
            borderRadius:5,
          }}
          title={<span> <FormattedMessage id='componentOverview.body.tab.env.setting.title'/> </span>}
          extra={
            <Button onClick={this.handleAddVars}>
              <Icon type="plus" />
              <FormattedMessage id='componentOverview.body.tab.env.setting.add'/>
            </Button>
          }
        >
          <ScrollerX sm={650}>
            <Table
              pagination={false}
              columns={[
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.setting.volume_name'}),
                  dataIndex: 'volume_name'
                },
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.setting.volume_path'}),
                  dataIndex: 'volume_path'
                },
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.setting.mode'}),
                  dataIndex: 'mode'
                },
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.setting.action'}),
                  dataIndex: 'action',
                  render: (v, data) => (
                    <div>
                      <a
                        onClick={() => {
                          this.onDeleteVolume(data);
                        }}
                        href="javascript:;"
                      >
                        <FormattedMessage id='componentOverview.body.tab.env.setting.delete'/>
                      </a>
                      <a
                        onClick={() => {
                          this.onEditVolume(data);
                        }}
                        href="javascript:;"
                      >
                        <FormattedMessage id='componentOverview.body.tab.env.setting.edit'/>
                      </a>
                    </div>
                  )
                }
              ]}
              dataSource={volumes}
            />
          </ScrollerX>
        </Card>
        {language && runtimeInfo && isSource && (
          <CodeBuildConfig
            appDetail={this.props.appDetail}
            onSubmit={handleEditRuntime}
            isBtn={false}
            language={language}
            runtimeInfo={this.state.runtimeInfo}
          />
        )}
        {this.state.showAddVars && (
          <AddStorage
            appBaseInfo={this.props.appBaseInfo}
            onCancel={this.handleCancelAddVars}
            onSubmit={this.handleSubmitAddVars}
            data={this.state.showAddVars}
            editor={this.state.editor}
            {...this.props}
          />
        )}
      </div>
    );
  }
}
// eslint-disable-next-line react/no-multi-comp
@connect(
  ({ teamControl }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
  }),
  null,
  null,
  {
    withRef: true
  }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      componentPermissions: this.handlePermissions('queryComponentInfo'),
      type: 'deploy',
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  getAppAlias() {
    return this.props.match.params.appAlias;
  }
  handleType = type => {
    if (this.state.type !== type) {
      this.setState({ type });
    }
  };
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  
  render() {
    const { appDetail, handleBuildSwitch, handleEditInfo, handleEditRuntime } = this.props;
    const { type, componentPermissions, language } = this.state;

    return (
      <div>
        <div
          style={{
            overflow: 'hidden'
          }}
        >
          <div
            className={styles.content}
            style={{
              overflow: 'hidden',
              marginBottom: 90
            }}
          >
            <RenderDeploy
              updateDetail={this.props.updateDetail}
              handleEditInfo={handleEditInfo}
              appDetail={appDetail}
              componentPermissions={componentPermissions}
              handleBuildSwitch={handleBuildSwitch}
              handleEditRuntime={handleEditRuntime}
            />
          </div>
        </div>
      <CustomFooter />
      </div>
    );
  }
}
