import { Button, Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
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
      return callback(new Error('请输入团队英文名称'));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error('只支持小写字母、数字或“-”，并且必须以字母开始、以数字或字母结尾')
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error('不能大于32个字符'));
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
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };
    const isRegions = regions && regions.length;
    return (
      <Modal
        title={title || '创建团队'}
        visible
        maskClosable={false}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={
          <Fragment>
            <Button onClick={onCancel}> 取消 </Button>
            <Button
              type="primary"
              onClick={this.handleSubmit}
              loading={Loading}
            >
              确定
            </Button>
            {guideStep &&
              !regionLoading &&
              handleNewbieGuiding({
                tit: '创建团队',
                desc: isRegions ? '点击可以创建团队。' : '缺少集群、去创建',
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
          <FormItem {...formItemLayout} label="团队名称">
            {getFieldDecorator('team_name', {
              rules: [
                {
                  required: true,
                  message: '请输入团队名称'
                },
                {
                  max: 10,
                  message: '最大长度10位'
                }
              ]
            })(<Input placeholder="请输入团队名称" />)}
            <div className={styles.conformDesc}>
              请输入创建的团队名称，最大长度10位
            </div>
          </FormItem>
          {/* 团队的命名空间 */}
          <FormItem {...formItemLayout} label="团队英文名称">
            {getFieldDecorator('namespace', {
              rules: [
                {
                  required: true,
                  validator: this.handleValiateNameSpace
                }
              ]
            })(<Input placeholder="团队的英文名称" />)}
            <div className={styles.conformDesc}>
              对应该团队在集群使用的命名空间
            </div>
          </FormItem>
          <FormItem {...formItemLayout} label="集群">
            {getFieldDecorator('useable_regions', {
              rules: [
                {
                  required: true,
                  message: '请选择集群'
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="选择集群"
              >
                {(regions || []).map(item => {
                  return (
                    <Option key={item.region_name}>{item.region_alias}</Option>
                  );
                })}
              </Select>
            )}
            <div className={styles.conformDesc}>请选择使用的集群</div>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
export default CreateTeam;
