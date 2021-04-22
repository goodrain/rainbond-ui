import { Button, Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
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
class CreateHelmAppModels extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isShared: window.location.href.indexOf('shared') > -1,
      previewImage: '',
      previewVisible: false,
      tagList: [],
      Checkboxvalue: !!(props.helmInfo && props.helmInfo.dev_status)
    };
  }
  onChangeCheckbox = () => {
    this.setState({
      Checkboxvalue: !this.state.Checkboxvalue
    });
  };

  handleSubmit = () => {
    const { form, helmInfo } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        if (helmInfo) {
          this.upAppModel(values);
        } else {
          this.createAppModel(values);
        }
      }
    });
  };

  handleCancel = () => this.setState({ previewVisible: false });
  upAppModel = values => {
    const { dispatch, eid, helmInfo, onOk, team_name } = this.props;
    const { imageUrl, tagList, isShared } = this.state;

    const arr = [];
    if (
      values.tag_ids &&
      values.tag_ids.length > 0 &&
      tagList &&
      tagList.length > 0
    ) {
      values.tag_ids.map(items => {
        tagList.map(item => {
          if (items === item.name) {
            arr.push(parseFloat(item.tag_id));
          }
        });
      });
    }

    const body = {
      enterprise_id: eid,
      name: values.name,
      pic: imageUrl,
      tag_ids: arr,
      app_id: helmInfo.app_id,
      dev_status: values.dev_status ? 'release' : '',
      describe: values.describe,
      scope: isShared && values.scope !== 'enterprise' ? 'team' : values.scope
    };
    if (team_name) {
      body.create_team = team_name;
    } else if (isShared && values.scope !== 'enterprise') {
      body.create_team = values.scope;
    }
    dispatch({
      type: 'market/upAppModel',
      payload: body,
      callback: res => {
        if (res && res.status_code === 200) {
          onOk && onOk(helmInfo);
        }
      }
    });
  };

  createAppModel = values => {
    const {
      dispatch,
      eid,
      onOk,
      currentTeam,
      market_id,
      team_name
    } = this.props;
    const { imageUrl, tagList, isShared } = this.state;
    const arr = [];
    const tags = [];
    if (
      values.tag_ids &&
      values.tag_ids.length > 0 &&
      tagList &&
      tagList.length > 0
    ) {
      values.tag_ids.map(items => {
        tagList.map(item => {
          if (items === item.name) {
            tags.push(item.name);
            arr.push(parseFloat(item.tag_id));
          }
        });
      });
    }

    let customBody = {};

    if (market_id) {
      customBody = {
        enterprise_id: eid,
        marketName: market_id,
        name: values.name,
        logo: imageUrl,
        introduction: '',
        app_classification_id: '',
        team_name: currentTeam && currentTeam.team_name,
        desc: values.describe,
        publish_type: 'private',
        tags
      };

      dispatch({
        type: 'market/createMarketAppModel',
        payload: customBody,
        callback: res => {
          if (res && res.status_code === 200) {
            if (onOk) {
              onOk();
            }
          }
        }
      });
      return null;
    }
    customBody = {
      enterprise_id: eid,
      name: values.name,
      pic: imageUrl,
      scope: isShared && values.scope !== 'enterprise' ? 'team' : values.scope,
      team_name: currentTeam && currentTeam.team_name,
      dev_status: values.dev_status,
      describe: values.describe,
      tag_ids: arr
    };

    // if (market_id) {
    //   customBody.scope_target = { market_id };
    //   customBody.scope = 'goodrain';
    //   customBody.source = 'local';
    // }
    if (isShared && values.scope !== 'enterprise') {
      customBody.create_team = values.scope;
    }

    dispatch({
      type: 'market/createAppModel',
      payload: customBody,
      callback: res => {
        if (res && res.status_code === 200) {
          if (onOk) {
            onOk();
          }
        }
      }
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { onCancel, title, helmInfo, appInfo } = this.props;
    const { previewImage, previewVisible, tagList } = this.state;
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
    const arr = [];

    if (
      helmInfo &&
      helmInfo.tags &&
      helmInfo.tags.length > 0 &&
      tagList &&
      tagList.length > 0
    ) {
      helmInfo.tags.map(items => {
        arr.push(items.name);
      });
    }

    const token = cookie.get('token');
    const myheaders = {};
    if (token) {
      myheaders.Authorization = `GRJWT ${token}`;
    }

    return (
      <div>
        <Modal
          visible={previewVisible}
          footer={null}
          onCancel={this.handleCancel}
        >
          <img alt="example" style={{ width: '100%' }} src={previewImage} />
        </Modal>
        <Modal
          title={title}
          visible
          width={500}
          className={styles.TelescopicModal}
          onOk={this.handleSubmit}
          onCancel={onCancel}
          footer={[
            <Button onClick={onCancel}> 取消 </Button>,
            <Button type="primary" onClick={this.handleSubmit}>
              确定
            </Button>
          ]}
        >
          <Form onSubmit={this.handleSubmit} layout="horizontal">
            <FormItem {...formItemLayout} label="LOGO">
              <img
                src={appInfo.versions && appInfo.versions[0].icon}
                alt="avatar"
                style={{
                  minWidth: '44px',
                  maxWidth: '60px',
                  minHeight: '44px',
                  maxHeight: '60px'
                }}
              />
            </FormItem>

            <FormItem {...formItemLayout} label="名称">
              {getFieldDecorator('name', {
                initialValue: helmInfo ? helmInfo.name : '',
                rules: [
                  {
                    required: true,
                    message: '请输入名称'
                  },
                  {
                    min: 4,
                    message: '应用名称最小长度4位'
                  },
                  {
                    max: 53,
                    message: '应用名称最大长度53位'
                  },
                  {
                    pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/,
                    message: '只支持字母和数字开头结尾'
                  }
                ]
              })(<Input style={{ width: '284px' }} placeholder="请输入名称" />)}
              <div className={styles.conformDesc}>
                请输入创建的应用模版名称，最多53字.
              </div>
            </FormItem>
            <FormItem {...formItemLayout} label="应用版本">
              {getFieldDecorator('version', {
                initialValue: appInfo.versions
                  ? appInfo.versions[0].version
                  : '',
                rules: [
                  {
                    required: true,
                    message: '请选择版本'
                  }
                ]
              })(
                <Select style={{ width: '284px' }}>
                  {appInfo.versions &&
                    appInfo.versions.map((item, indexs) => {
                      return (
                        <Option key={indexs} value={item.version}>
                          {item.version}
                        </Option>
                      );
                    })}
                </Select>
              )}
              <div className={styles.conformDesc}>请选择应用版本</div>
            </FormItem>
            <FormItem {...formItemLayout} label="应用备注">
              {getFieldDecorator('note', {
                initialValue: appInfo.versions
                  ? appInfo.versions[0].description
                  : '',
                rules: [
                  {
                    max: 255,
                    message: '最大长度255位'
                  }
                ]
              })(
                <Input.TextArea
                  placeholder="请填写应用备注信息"
                  style={{ width: '284px' }}
                />
              )}
              <div className={styles.conformDesc}>请输入创建的应用模版描述</div>
            </FormItem>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default CreateHelmAppModels;
