import React, { PureComponent } from "react";
import { Modal, Form, Select, Button, Checkbox, Row, Col } from "antd";
import { connect } from "dva";
import styles from "../../components/CreateTeam/index.less";

const FormItem = Form.Item;
const { Option } = Select;

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
          <Button onClick={onCancel}> 取消 </Button>,
          <Button type="primary" onClick={this.handleSubmit}>
            确定
          </Button>
        ]}
      >
        {seeTag ? (
          <Row style={{marginBottom:'20px'}}>
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
              {getFieldDecorator("tag", {
                initialValue: checkedValues || [],
                rules: [
                  {
                    required: false,
                    message: "请选择标签"
                  }
                ]
              })(
                <Checkbox.Group
                  style={{ width: "100%" }}
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
