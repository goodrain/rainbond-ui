import { Button, Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import { getAllRegion } from '../../services/api';
import styles from './index.less';

const FormItem = Form.Item;
const { Option } = Select;
@connect(({ loading }) => ({
  Loading: loading.effects['teamControl/createTeam']
}))
@Form.create()
class CreateTeam extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      regions: [],
      regionLoading: true
    };
  }
  componentDidMount() {
    const { enterprise_id: ID } = this.props;
    if (ID) {
      this.getUnRelationedApp(ID);
    }
  }
  getUnRelationedApp = ID => {
    getAllRegion({ enterprise_id: ID, status: '1' })
      .then(data => {
        this.setState({
          regions: (data && data.list) || [],
          regionLoading: false
        });
      })
      .catch(() => {
        this.setState({
          regionLoading: false
        });
      });
  };
  handleSubmit = () => {
    const { onOk, form, handleGuideStep } = this.props;
    if (handleGuideStep && handleGuideStep) {
      handleGuideStep(3);
    }
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  // 团队命名空间的检验
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(`${formatMessage({id:'popover.enterpriseOverview.setUpTeam.message.englishName'})}`));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(`${formatMessage({id:'placeholder.nameSpaceReg'})}`)
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(`${formatMessage({id:'placeholder.max32'})}`));
    }
  };
  render() {
    const {
      onCancel,
      form,
      Loading,
      title,
      guideStep,
      handleNewbieGuiding,
      enterprise_id
    } = this.props;
    const { getFieldDecorator } = form;
    const { regions, regionLoading } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };
    const isRegions = regions && regions.length;
    return (
      <Modal
        title={title || <FormattedMessage id='popover.enterpriseOverview.setUpTeam.title'/>}
        visible
        maskClosable={false}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={
          <Fragment>
            <Button onClick={onCancel}> <FormattedMessage id='button.cancel'/></Button>
            <Button
              type="primary"
              onClick={this.handleSubmit}
              loading={Loading}
            >
              <FormattedMessage id='button.confirm'/>
            </Button>
            {guideStep &&
              !regionLoading &&
              handleNewbieGuiding({
                tit: formatMessage({id:'popover.enterpriseOverview.setUpTeam.title'}),
                desc: isRegions ? formatMessage({id:'popover.enterpriseOverview.setUpTeam.creat_name'}) : formatMessage({id:'popover.enterpriseOverview.setUpTeam.creat_colony'}),
                isCoverScreen: false,
                prevStep: false,
                nextStep: 1,
                jumpUrl:
                  !isRegions &&
                  `/enterprise/${enterprise_id}/clusters?init=true`,
                isSuccess: isRegions,
                conPosition: { right: 0, bottom: '-136px' },
                svgPosition: { left: '65%', marginTop: '-19px' }
              })}
          </Fragment>
        }
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal">
          <FormItem {...formItemLayout}  label={<FormattedMessage id='popover.enterpriseOverview.setUpTeam.label.name'/>} 
          extra= {<div className={styles.conformDesc}>
                    <FormattedMessage id='popover.enterpriseOverview.setUpTeam.conformDesc.name'/>
                  </div>}
          >
            {getFieldDecorator('team_name', {
              rules: [
                {
                  required: true,
                  message:formatMessage({id:'popover.enterpriseOverview.setUpTeam.placeholder.name'})
                },
                {
                  max: 10,
                  message:formatMessage({id:'popover.enterpriseOverview.setUpTeam.placeholder.max'})
                }
              ]
            })(<Input  placeholder={formatMessage({id:'popover.enterpriseOverview.setUpTeam.placeholder.name'})}/>)}
            {/* <div className={styles.conformDesc}>
              <FormattedMessage id='popover.enterpriseOverview.setUpTeam.conformDesc.name'/>
            </div> */}
          </FormItem>
          {/* 团队的命名空间 */}
          <FormItem {...formItemLayout}  label={<FormattedMessage id='popover.enterpriseOverview.setUpTeam.label.englishName'/>}
          extra={
            <div className={styles.conformDesc}>
              <FormattedMessage id='popover.enterpriseOverview.setUpTeam.conformDesc.englishName'/>
            </div>
          }
          >
            {getFieldDecorator('namespace', {
              rules: [
                {
                  required: true,
                  validator: this.handleValiateNameSpace
                }
              ]
            })(<Input  placeholder={formatMessage({id:'popover.enterpriseOverview.setUpTeam.placeholder.englishName'})} />)}

          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='popover.enterpriseOverview.setUpTeam.label.colony'/>} extra={
            <div className={styles.conformDesc}> <FormattedMessage id='popover.enterpriseOverview.setUpTeam.conformDesc.colony'/></div>
          }>
            {getFieldDecorator('useable_regions', {
              rules: [
                {
                  required: true,
                  message:formatMessage({id:'popover.enterpriseOverview.setUpTeam.message.colony'})
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                mode="multiple"
                style={{ width: '100%' }}
                placeholder={formatMessage({id:'popover.enterpriseOverview.setUpTeam.message.colony'})}
              >
                {(regions || []).map(item => {
                  return (
                    <Option key={item.region_name}>{item.region_alias}</Option>
                  );
                })}
              </Select>
            )}

          </FormItem>
        </Form>
      </Modal>
    );
  }
}
export default CreateTeam;
