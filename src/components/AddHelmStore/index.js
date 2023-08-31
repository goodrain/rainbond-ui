import React, { Component } from 'react'
import { Button, Modal, Form, Input, notification } from 'antd';
import globalUtil from '../../utils/global';
import { connect } from 'dva';
import { formatMessage } from 'umi-plugin-locale';

@connect(({ user }) => ({
    currUser: user.currentUser,
}))

@Form.create()
export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }
    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const { currUser } = this.props;
                const eid = currUser.enterprise_id;
                this.props.dispatch({
                    type: 'market/HelmwaRehouseAddStore',
                    payload: {
                        team_name : globalUtil.getCurrTeamName(), 
                        command: values.command,
                        app_id: 1,
                    },
                    callback: res => {
                        if(res && res.status_code == 200){
                            if(res.bean.status){
                                this.addAppStore(res.bean.repo_url,res.bean.repo_name, eid);
                            }else{
                                notification.success({
                                    message: formatMessage({id:"notification.success.add"})
                                  });
                            }
                            this.handleCancel()
                            this.props.onOk && this.props.onOk(false)
                        }
                    },
                    handleError: err => {
                        notification.error({
                            message: formatMessage({id:"teamAdd.create.helm.error"}),
                          });
                    }
                });
            }

        });
    };
    addAppStore = (url, name, eid) => {
        const { dispatch } = this.props;
        dispatch({
          type: 'market/addHelmAppStore',
          payload: { 
            enterprise_id: eid,
            url: url,
            name: name
           },
          callback: res => {
            notification.success({
              message: formatMessage({id:"notification.success.add"})
            });
            this.props.RefreshList && this.props.RefreshList();
          },
          handleError: res => {
          }
        });
        dispatch({
          type: 'market/HelmwaRehouseAdd',
          payload: {
            repo_name: name,
            repo_url: url,
          },
          callback: res => {
          }
        });
      };
    handleCancel = () => {
        const { handleCancel } = this.props;
        if (handleCancel) {
            handleCancel();
        }
    };
    render() {
        const { visible } = this.props
        const { getFieldDecorator } = this.props.form;
        return (
            <Modal
                style={{ zIndex: 9999 }}
                title={formatMessage({id:'teamAdd.create.helm.addstore'})}
                visible={visible}
                onOk={this.handleSubmit}
                onCancel={this.handleCancel}
            >
                <Form onSubmit={this.handleSubmit}>
                    <Form.Item label={formatMessage({id:'teamAdd.create.helm.comadd'})}>
                        {getFieldDecorator('command', {
                            rules: [{ required: true, message: formatMessage({id:'teamAdd.create.helm.com_null'}) }],
                        })(
                            <Input
                                placeholder={formatMessage({id:'teamAdd.create.helm.input_com'})}
                            />,
                        )}
                    </Form.Item>
                </Form>
            </Modal>
        )
    }
}
