import React, { PureComponent, Fragment } from "react";
import { Row, Col, Card, Form, Button, Icon, Select, Modal, Input, message } from "antd";
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';

const FormItem = Form.Item;
const Option = Select.Option;
const { TextArea } = Input;

@Form.create()
export default class SubDomain extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields(
      {
        force: true
      },
      (err, values) => {
        if (!err) {
          this.props.onOk && this.props.onOk(values);
        }
      }
    );
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 18
        }
      }
    };

    return (
      <Modal
        title={ <FormattedMessage id="omponentOverview.body.SubDomain.title"/> }
        onOk={this.handleSubmit}
        visible
        onCancel={this.handleCancel}
      >
        <Row gutter={24}>
          <Col className="gutter-row" span={12}>
            <Form onSubmit={this.handleSubmit}>
              <FormItem {...formItemLayout} l label={ <FormattedMessage id="omponentOverview.body.SubDomain.domain"/> }>
                {getFieldDecorator("domain", {
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id:'componentOverview.body.SubDomain.required'})
                    },
                    {
                      pattern: /^[0-9a-zA-Z.]*$/,
                      message: formatMessage({id:'componentOverview.body.SubDomain.pattern'})
                    }
                  ]
                })(<Input  placeholder={formatMessage({id:'componentOverview.body.SubDomain.placeholder'})}/>)}
              </FormItem>
            </Form>
          </Col>
          <Col className="gutter-row" span={12} style={{ lineHeight: "36px" }}>
            .{this.props.sld_suffix}
          </Col>
        </Row>
      </Modal>
    );
  }
}
