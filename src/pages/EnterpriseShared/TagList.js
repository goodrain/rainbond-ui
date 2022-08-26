/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */
import { Button, Checkbox, Col, Form, Modal, Row } from "antd";
import { connect } from "dva";
import React, { PureComponent } from "react";
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styles from "../../components/CreateTeam/index.less";

const FormItem = Form.Item;

@Form.create()
@connect(({ user }) => ({
  currUser: user.currentUser
}))
export default class TagList extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      tags: []
    };
  }

  onChangeCheckbox = checkedValues => {
    this.setState({
      tags: checkedValues
    });
  };

  handleSubmit = () => {
    const { onChangeCheckbox, onOk, form, seeTag } = this.props;
    seeTag && onOk && onOk();
    form.validateFields((err, values) => {
      if (!err) {
        onOk && onOk(values);
        onChangeCheckbox && onChangeCheckbox(this.state.tags);
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { seeTag, onCancel, title, tagLists, checkedValues } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 0 },
        sm: { span: 0 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      }
    };

    return (
      <Modal
        title={title}
        width={600}
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={this.handleSubmit}
        footer={[
          <Button onClick={onCancel}>  <FormattedMessage id='button.cancel'/></Button>,
          <Button type="primary" onClick={this.handleSubmit}>
            <FormattedMessage id='button.confirm'/>
          </Button>
        ]}
      >
        {seeTag ? (
          <Row style={{ marginBottom: '20px' }}>
            {seeTag.map(item => {
              return (
                <Col key={item} span={8}>
                  {item}
                </Col>
              );
            })}
          </Row>
        ) : (
          <Form
            onSubmit={this.handleSubmit}
            layout="horizontal"
            hideRequiredMark
          >
            <FormItem {...formItemLayout} label="">
              {getFieldDecorator('tag', {
                  initialValue: checkedValues || [],
                  rules: [
                    {
                      required: false,
                      message: formatMessage({id:'applicationMarket.TagList.select_label'}),

                    },
                  ],
                })(
                  <Checkbox.Group
                    style={{ width: '100%' }}
                    onChange={this.onChangeCheckbox}
                  >
                    <Row>
                      {tagLists &&
                        tagLists.map(item => {
                          const { name, tag_id } = item;
                          return (
                            <Col key={tag_id} span={8}>
                              <Checkbox value={name}>{name}</Checkbox>
                            </Col>
                          );
                        })}
                    </Row>
                  </Checkbox.Group>
                )}
            </FormItem>
          </Form>
          )}
      </Modal>
    );
  }
}
