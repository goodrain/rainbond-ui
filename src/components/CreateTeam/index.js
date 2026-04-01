import { Button, Form, Input, Modal, Select, Table, Tabs, Upload, Icon } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { getAllRegion } from '../../services/api';
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';
import { pinyin } from 'pinyin-pro';
import styles from './index.less';

const FormItem = Form.Item;
const { Option } = Select;
const { TabPane } = Tabs;

@connect(({ loading, teamControl }) => ({
  loading: loading.effects['teamControl/createTeam'],
  clusterNamespaces: teamControl.clusterNamespaces
}))
@Form.create()
class CreateTeam extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      regions: [],
      regionLoading: true,
      imageBase64: '',
      imageUrl: '',
      teamNames: [],
      activeTab: 'new',
      selectedRegion: null,
      selectedNamespace: null,
      namespaceLoading: false
    };
  }
  componentDidMount() {
    const { enterprise_id: ID } = this.props;
    if (ID) {
      this.getUnRelationedApp(ID);
      this.getTeamName();
    }
  }
  // 获取集群下所有的团队英文名称
  getTeamName = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchTeamNames',
      payload: {
        eid: this.props.enterprise_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            teamNames: res.bean && res.bean.tenant_names && res.bean.tenant_names.length > 0 ? res.bean.tenant_names : []
          });
        }
      }
    });
  };
  // 生成英文名
  generateEnglishName = name => {
    if (name != undefined) {
      const { teamNames } = this.state;
      const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
      const cleanedPinyinName = pinyinName.toLowerCase();
      if (teamNames && teamNames.length > 0) {
        const isExist = teamNames.some(item => item === cleanedPinyinName);
        if (isExist) {
          const random = Math.floor(Math.random() * 10000);
          return `${cleanedPinyinName}${random}`;
        }
        return cleanedPinyinName;
      }
      return cleanedPinyinName;
    }
    return '';
  };

  getUnRelationedApp = ID => {
    getAllRegion({ enterprise_id: ID, status: '1' })
      .then(data => {
        const regions = (data && data.list) || [];
        this.setState({ regions, regionLoading: false }, () => {
          // 如果只有一个集群，在 bind tab 下自动选中
          if (regions.length === 1 && this.state.activeTab === 'bind') {
            this.loadNamespaces(regions[0].region_name);
          }
        });
      })
      .catch(() => {
        this.setState({ regionLoading: false });
      });
  };

  handleTabChange = key => {
    const { dispatch, form } = this.props;
    this.setState({ activeTab: key, selectedNamespace: null, selectedRegion: null });
    form.setFieldsValue({ namespace: '' });
    dispatch({ type: 'teamControl/saveClusterNamespaces', payload: [] });

    // 切换到 bind tab 时，如果只有一个集群，自动选中并加载
    if (key === 'bind') {
      const { regions } = this.state;
      if (regions.length === 1) {
        this.loadNamespaces(regions[0].region_name);
      }
    }
  };

  loadNamespaces = region => {
    const { dispatch, form } = this.props;
    this.setState({ selectedRegion: region, selectedNamespace: null, namespaceLoading: true });
    form.setFieldsValue({ namespace: '' });
    dispatch({
      type: 'teamControl/getClusterNamespaces',
      payload: { region },
      callback: () => this.setState({ namespaceLoading: false })
    });
  };

  handleNamespaceSelect = record => {
    const { form } = this.props;
    this.setState({ selectedNamespace: record.name });
    form.setFieldsValue({ namespace: record.name });
  };

  handleSubmit = () => {
    const { onOk, form, handleGuideStep } = this.props;
    const { activeTab, selectedNamespace, selectedRegion } = this.state;
    const { imageUrl } = this.state;

    if (handleGuideStep) {
      handleGuideStep(3);
    }

    if (activeTab === 'bind') {
      if (!selectedNamespace) {
        return;
      }
      if (onOk) {
        onOk({
          namespace: selectedNamespace,
          useable_regions: [selectedRegion],
          bind_existing_namespace: true,
          team_name: form.getFieldValue('team_name_bind')
        });
      }
      return;
    }

    form.validateFields((err, values) => {
      if (!err && onOk) {
        if (values.logo) {
          values.logo = imageUrl;
        }
        onOk(values);
      }
    });
  };

  // 团队命名空间的检验
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(`${formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.message.englishName' })}`));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(new Error(`${formatMessage({ id: 'placeholder.nameSpaceReg' })}`));
      }
      callback();
    }
    if (value.length > 24) {
      return callback(new Error(`${formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.max' })}`));
    }
  };

  handleLogoChange = info => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      this.setState({
        imageUrl:
          info.file && info.file.response && info.file.response.data && info.file.response.data.bean && info.file.response.data.bean.file_url,
        loading: false
      });
      this.getLogoBase64(info.file.originFileObj, imageBase64 => this.setState({ imageBase64 }));
    }
  };

  handleLogoRemove = () => {
    this.setState({ imageUrl: '', imageBase64: '' });
  };

  getLogoBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  render() {
    const { onCancel, form, loading, title, guideStep, handleNewbieGuiding, enterprise_id, clusterNamespaces } = this.props;
    const token = cookie.get('token');
    const { getFieldDecorator } = form;
    const { regions, regionLoading, imageBase64, imageUrl, activeTab, selectedRegion, selectedNamespace, namespaceLoading } = this.state;
    const myheaders = {};
    if (token) {
      myheaders.Authorization = `GRJWT ${token}`;
    }
    const formItemLayout = {
      labelCol: { xs: { span: 24 }, sm: { span: 8 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 14 } }
    };
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">{formatMessage({ id: 'teamOverview.uploadIcon' })}</div>
      </div>
    );
    const isRegions = regions && regions.length;
    const isConfirmDisabled = activeTab === 'bind' && !selectedNamespace;

    const namespaceColumns = [
      { title: 'Namespace', dataIndex: 'name', key: 'name' },
      { title: '创建时间', dataIndex: 'creation_timestamp', key: 'creation_timestamp' }
    ];

    const rowSelection = {
      type: 'radio',
      selectedRowKeys: selectedNamespace ? [selectedNamespace] : [],
      onChange: (_, rows) => {
        if (rows && rows[0]) {
          this.handleNamespaceSelect(rows[0]);
        }
      }
    };

    return (
      <Modal
        title={title || <FormattedMessage id="popover.enterpriseOverview.setUpTeam.title" />}
        visible
        maskClosable={false}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={
          <Fragment>
            <Button onClick={onCancel}>
              <FormattedMessage id="button.cancel" />
            </Button>
            <Button type="primary" onClick={this.handleSubmit} loading={loading} disabled={isConfirmDisabled}>
              <FormattedMessage id="button.confirm" />
            </Button>
            {guideStep &&
              !regionLoading &&
              handleNewbieGuiding({
                tit: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.title' }),
                desc: isRegions
                  ? formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.creat_name' })
                  : formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.creat_colony' }),
                isCoverScreen: false,
                prevStep: false,
                nextStep: 1,
                jumpUrl: !isRegions && `/enterprise/${enterprise_id}/clusters?init=true`,
                isSuccess: isRegions,
                conPosition: { right: 0, bottom: '-136px' },
                svgPosition: { left: '65%', marginTop: '-19px' }
              })}
          </Fragment>
        }
      >
        <Tabs activeKey={activeTab} onChange={this.handleTabChange}>
          <TabPane tab="新建团队" key="new">
            <Form onSubmit={this.handleSubmit} layout="horizontal">
              <FormItem
                {...formItemLayout}
                label={<FormattedMessage id="popover.enterpriseOverview.setUpTeam.label.name" />}
                extra={
                  <div className={styles.conformDesc}>
                    <FormattedMessage id="popover.enterpriseOverview.setUpTeam.conformDesc.name" />
                  </div>
                }
              >
                {getFieldDecorator('team_name', {
                  rules: [
                    { required: true, message: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.name' }) },
                    { max: 24, message: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.max' }) }
                  ]
                })(<Input placeholder={formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.name' })} />)}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label={<FormattedMessage id="popover.enterpriseOverview.setUpTeam.label.englishName" />}
                extra={
                  <div className={styles.conformDesc}>
                    <FormattedMessage id="popover.enterpriseOverview.setUpTeam.conformDesc.englishName" />
                  </div>
                }
              >
                {getFieldDecorator('namespace', {
                  initialValue: this.generateEnglishName(form.getFieldValue('team_name')),
                  rules: [{ required: true, validator: this.handleValiateNameSpace }]
                })(<Input placeholder={formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.englishName' })} />)}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label={<FormattedMessage id="popover.enterpriseOverview.setUpTeam.label.colony" />}
                extra={
                  <div className={styles.conformDesc}>
                    <FormattedMessage id="popover.enterpriseOverview.setUpTeam.conformDesc.colony" />
                  </div>
                }
              >
                {getFieldDecorator('useable_regions', {
                  rules: [{ required: true, message: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.message.colony' }) }]
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder={formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.message.colony' })}
                  >
                    {(regions || []).map(item => (
                      <Option key={item.region_name}>{item.region_alias}</Option>
                    ))}
                  </Select>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="LOGO"
                extra={
                  <div className={styles.conformDesc}>
                    <FormattedMessage id="popover.enterpriseOverview.setUpTeam.label.logo" />
                  </div>
                }
              >
                {getFieldDecorator('logo', {
                  rules: [{ required: false, message: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.input_logo' }) }]
                })(
                  <Upload
                    className="logo-uploader"
                    name="file"
                    accept="image/jpg,image/jpeg,image/png"
                    action={apiconfig.imageUploadUrl}
                    listType="picture-card"
                    headers={myheaders}
                    showUploadList={false}
                    onChange={this.handleLogoChange}
                    onRemove={this.handleLogoRemove}
                  >
                    {imageUrl ? <img src={imageBase64 || imageUrl} alt="LOGO" style={{ width: '100%' }} /> : uploadButton}
                  </Upload>
                )}
              </FormItem>
            </Form>
          </TabPane>
          <TabPane tab="对接已有 Namespace" key="bind">
            <FormItem {...formItemLayout} label="团队名称">
              {getFieldDecorator('team_name_bind', {
                rules: [
                  { required: true, message: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.name' }) },
                  { max: 24, message: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.max' }) }
                ]
              })(<Input placeholder={formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.name' })} />)}
            </FormItem>
            <FormItem {...formItemLayout} label="集群">
              <Select
                style={{ width: '100%' }}
                placeholder="请选择集群"
                value={selectedRegion}
                onChange={this.loadNamespaces}
                getPopupContainer={triggerNode => triggerNode.parentNode}
              >
                {(regions || []).map(item => (
                  <Option key={item.region_name} value={item.region_name}>
                    {item.region_alias}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem {...formItemLayout} label="Namespace">
              <Input disabled value={selectedNamespace || ''} placeholder="选择下方 Namespace 后自动填充" />
            </FormItem>
            <Table
              rowKey="name"
              rowSelection={rowSelection}
              columns={namespaceColumns}
              dataSource={clusterNamespaces}
              loading={namespaceLoading}
              size="small"
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: selectedRegion ? '该集群下无未管理的 Namespace' : '请先选择集群' }}
            />
          </TabPane>
        </Tabs>
      </Modal>
    );
  }
}
export default CreateTeam;
