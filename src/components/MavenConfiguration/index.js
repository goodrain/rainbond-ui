/* eslint-disable import/extensions */
import globalUtil from '@/utils/global';
import {
  Button,
  Col,
  Form,
  Icon,
  Input,
  Layout,
  Menu,
  Modal,
  notification,
  Row,
  Skeleton,
  Spin
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import CodeMirrorForm from '../CodeMirrorForm';
import ConfirmModal from '../ConfirmModal';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Sider, Content } = Layout;

@Form.create()
@connect(
  ({ enterprise, loading }) => ({
    currentEnterprise: enterprise.currentEnterprise,
    AddMavensettingsLoading: loading.effects['appControl/AddMavensettings'],
    EditMavensettingsLoading: loading.effects['appControl/EditMavensettings'],
    DeleteMavensettingsLoading:
      loading.effects['appControl/DeleteMavensettings']
  }),
  null,
  null,
  { withRef: true }
)
export default class AddAdmin extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isEditor: false,
      mavenList: [],
      loading: true,
      contentLoading: true,
      toDelete: false,
      mavenInfo: {},
      isDefaultMaven: false
    };
  }
  componentDidMount() {
    const { activeMaven } = this.props;
    this.fetchMavensettings(true, activeMaven);
  }
  onCancelDelete = () => {
    this.setState({
      toDelete: false
    });
  };

  handleEditorConfiguration = () => {
    this.setState({
      isEditor: true
    });
  };

  fetchMavensettings = (Initialize, activeMaven) => {
    const { dispatch, currentEnterprise, form } = this.props;
    const { setFieldsValue } = form;
    dispatch({
      type: 'appControl/fetchMavensettings',
      payload: {
        region_name: globalUtil.getCurrRegionName(),
        enterprise_id: currentEnterprise.enterprise_id,
        onlyname: false
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res.list && res.list.length === 0) {
            this.setState({ isEditor: false, mavenInfo: {} });
          } else {
            this.handleEditorConfiguration();
          }
          if (Initialize && res.list && res.list.length > 0) {
            if (activeMaven) {
              const list = res.list.filter(item => item.name === activeMaven);
              if (list && list.length > 0) {
                this.setState({ mavenInfo: list[0] });
              } else {
                this.setState({ isEditor: false });
              }
            } else {
              setFieldsValue({ content: res.list[0].content });
              setFieldsValue({ name: res.list[0].name });
              this.setState({ mavenInfo: res.list[0] });
            }
          }

          this.setState({
            mavenList: res.list,
            loading: false,
            contentLoading: false
          });
        }
      }
    });
  };

  handleSubmitConfiguration = () => {
    const { onOk, form } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  beforeUpload = (file, isMessage) => {
    const fileArr = file.name.split('.');
    const { length } = fileArr;
    const isRightType = fileArr[length - 1] === 'xml';
    if (!isRightType) {
      if (isMessage) {
        notification.warning({
          message: formatMessage({id:'notification.warn.update_xml'})
        });
      }
      return false;
    }
    return true;
  };

  handleClick = e => {
    this.handleEditorConfiguration();
    this.setState(
      {
        contentLoading: true
      },
      () => {
        const { mavenList } = this.state;
        const { setFieldsValue } = this.props.form;
        const list = mavenList.filter(item => item.name === e.key);
        if (list && list.length > 0) {
          this.setState({ mavenInfo: list[0], contentLoading: false });
          setFieldsValue({ content: list[0].content });
          setFieldsValue({ name: list[0].name });
        }
      }
    );
  };
  handleAddSubmit = () => {
    const { form } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        const { dispatch, currentEnterprise } = this.props;
        dispatch({
          type: 'appControl/AddMavensettings',
          payload: {
            region_name: globalUtil.getCurrRegionName(),
            enterprise_id: currentEnterprise.enterprise_id,
            ...values
          },
          callback: res => {
            if (res && res.status_code === 200) {
              this.setState({
                mavenInfo: res.bean,
                loading: true,
                contentLoading: true
              });
              this.fetchMavensettings();
              notification.success({ message: formatMessage({id:'notification.success.add'}) });
            }
          }
        });
      }
    });
  };
  handleDelete = () => {
    const { mavenInfo } = this.state;
    const { dispatch, currentEnterprise, form } = this.props;
    dispatch({
      type: 'appControl/DeleteMavensettings',
      payload: {
        region_name: globalUtil.getCurrRegionName(),
        enterprise_id: currentEnterprise.enterprise_id,
        name: mavenInfo.name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const { setFieldsValue } = form;
          setFieldsValue({ content: '' });
          setFieldsValue({ name: '' });
          this.setState(
            {
              contentLoading: true
            },
            () => {
              this.onCancelDelete();
              this.fetchMavensettings(true);
              notification.success({ message:  formatMessage({id:'notification.success.delete'})});
            }
          );
        }
      }
    });
  };
  handleEditSubmit = () => {
    const { form } = this.props;
    const { mavenInfo } = this.state;
    form.validateFields((err, values) => {
      if (!err) {
        const { dispatch, currentEnterprise } = this.props;
        dispatch({
          type: 'appControl/EditMavensettings',
          payload: {
            region_name: globalUtil.getCurrRegionName(),
            enterprise_id: currentEnterprise.enterprise_id,
            name: mavenInfo.name,
            content: values.content
          },
          callback: res => {
            if (res && res.status_code === 200) {
              this.setState({
                mavenInfo: res.bean,
                loading: true,
                contentLoading: true
              });
              this.fetchMavensettings();
              notification.success({ message:  formatMessage({id:'notification.success.save'})});
            }
          }
        });
      }
    });
  };
  handleAddClick = () => {
    this.setState({ contentLoading: true }, () => {
      const { setFieldsValue } = this.props.form;
      setFieldsValue({ content: '' });
      setFieldsValue({ name: '' });
      this.setState({
        mavenInfo: {},
        isEditor: false,
        contentLoading: false
      });
    });
  };
  handleDeleteClick = isDefaultMaven => {
    this.setState({
      isDefaultMaven,
      toDelete: true
    });
  };

  render() {
    const {
      // eslint-disable-next-line no-shadow
      form,
      onCancel,
      AddMavensettingsLoading,
      EditMavensettingsLoading,
      DeleteMavensettingsLoading
    } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;
    const {
      isEditor,
      mavenList,
      loading,
      mavenInfo,
      toDelete,
      contentLoading,
      isDefaultMaven
    } = this.state;
    const footer = [
      <Button
        onClick={() => {
          onCancel(mavenInfo && mavenInfo.name);
        }}
      >
        <FormattedMessage id='button.cancel'/>
      </Button>
    ];

    if (isEditor) {
      footer.unshift(
        <Button
          type="primary"
          loading={EditMavensettingsLoading}
          onClick={this.handleEditSubmit}
        >
          <FormattedMessage id='button.save'/>
        </Button>
      );
    } else {
      footer.unshift(
        <Button
          type="primary"
          loading={AddMavensettingsLoading}
          onClick={this.handleAddSubmit}
        >
          <FormattedMessage id='button.add'/>
        </Button>
      );
    }

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 23, offset: 1 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 23, offset: 1 }
      }
    };

    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.AddAdmin.title'/>}
        visible
        width={800}
        className={styles.TelescopicModal}
        onCancel={() => {
          onCancel(mavenInfo && mavenInfo.name);
        }}
        footer={footer}
      >
        {toDelete && (
          <ConfirmModal
            loading={DeleteMavensettingsLoading}
            desc={
              isDefaultMaven
                ? <FormattedMessage id='confirmModal.deldete.Maven.desc'/>
                : <FormattedMessage id='confirmModal.deldete.Maven.desc_delete'/>
            }
            title={<FormattedMessage id='confirmModal.deldete.Maven.title'/>}
            subDesc={<FormattedMessage id='confirmModal.deldete.Maven.subDesc'/>}

            onCancel={this.onCancelDelete}
            onOk={this.handleDelete}
          />
        )}
        <Spin spinning={loading} delay={0}>
          <Layout>
            <Sider width={200} style={{ background: '#fff' }}>
              <Row
                style={{
                  background: '#eceef1',
                  height: '40px',
                  lineHeight: '40px',
                  padding: '0 16px 0 24px '
                }}
              >
                <Col span={22}> <FormattedMessage id='componentOverview.body.AddAdmin.list'/></Col>
                <Col span={2}>
                  <Icon
                    type="plus"
                    onClick={this.handleAddClick}
                    style={{ cursor: 'pointer' }}
                  />
                </Col>
              </Row>

              {mavenList && mavenList.length > 0 && (
                <Menu
                  onClick={this.handleClick}
                  mode="inline"
                  selectedKeys={[`${mavenInfo.name}`]}
                  style={{ height: '100%' }}
                >
                  {mavenList.map(item => {
                    const { is_default = false, name } = item;
                    return (
                      <Menu.Item key={name}>
                        <Row>
                          <Col
                            span={22}
                            style={{
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden'
                            }}
                          >
                            {is_default ? `默认(${name})` : name}
                          </Col>
                          <Col span={2}>
                            <Icon
                              type="delete"
                              onClick={() => {
                                this.handleDeleteClick(is_default);
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                          </Col>
                        </Row>
                      </Menu.Item>
                    );
                  })}
                </Menu>
              )}
            </Sider>
            <Content>
              <Form onSubmit={this.handleSubmit} labelAlign="left">
                <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.AddAdmin.name'/>}>
                  {getFieldDecorator('name', {
                    initialValue: mavenInfo.name || '',
                    rules: [
                      {
                        required: true,
                        message:formatMessage({id:'componentOverview.body.AddAdmin.input_name'})
                      },
                      {
                        min: 2,
                        message:formatMessage({id:'componentOverview.body.AddAdmin.min'})
                      },
                      {
                        max: 32,
                        message:formatMessage({id:'componentOverview.body.AddAdmin.max'})
                      },
                      {
                        pattern: /^[a-z]+$/g,
                        message:formatMessage({id:'componentOverview.body.AddAdmin.only'})
                      }
                    ]
                  })(
                    <Input
                      disabled={mavenInfo.name}
                      placeholder={formatMessage({id:'componentOverview.body.AddAdmin.input_name'})}
                    />
                  )}
                </FormItem>
                <Skeleton
                  className={styles.mavenSkeleton}
                  loading={contentLoading}
                >
                  <CodeMirrorForm
                    name="content"
                    mode="application/xml"
                    label={<FormattedMessage id='componentOverview.body.AddAdmin.profile'/>}
                    message={<FormattedMessage id='componentOverview.body.AddAdmin.content'/>}
                    width="529px"
                    Form={Form}
                    setFieldsValue={setFieldsValue}
                    formItemLayout={formItemLayout}
                    getFieldDecorator={getFieldDecorator}
                    beforeUpload={this.beforeUpload}
                    data={mavenInfo.content || ''}
                  />
                </Skeleton>
              </Form>
            </Content>
          </Layout>
        </Spin>
      </Modal>
    );
  }
}
