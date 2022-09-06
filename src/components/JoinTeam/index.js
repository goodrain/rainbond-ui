import { Button, Form, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect(({ user, loading }) => ({
  currUser: user.currentUser,
  Loading: loading.effects['global/joinTeam']
}))
export default class JoinTeam extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      teams: []
    };
  }
  componentDidMount() {
    this.loadTeams();
  }
  loadTeams = () => {
    const { enterpriseID } = this.props;
    this.props.dispatch({
      type: 'global/getUserCanJoinTeams',
      payload: {
        enterpriseID
      },
      callback: data => {
        if (data) {
          this.setState({ teams: data.list });
        }
      }
    });
  };

  handleSubmit = () => {
    const { form, onOk } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  render() {
    const { onCancel, form, Loading } = this.props;
    const { getFieldDecorator } = form;
    const { teams } = this.state;
    const teamList = teams && teams.length > 0 && teams;
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

    return (
      <Modal
        title={<FormattedMessage id='popover.enterpriseOverview.joinTeam.title'/>}
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}>  <FormattedMessage id='button.cancel'/></Button>,
          <Button type="primary" onClick={this.handleSubmit} loading={Loading}>
            <FormattedMessage id='button.confirm'/>
          </Button>
        ]}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <FormItem {...formItemLayout}  hasFeedback label={<FormattedMessage id='popover.enterpriseOverview.joinTeam.label'/> }extra={!teamList && <FormattedMessage id='popover.enterpriseOverview.joinTeam.hint'/>}>
            {getFieldDecorator('team_name', {
              initialValue: (teamList && teamList[0].team_name) || '',
              rules: [
                {
                  required: true,
                  message:formatMessage({id:'popover.enterpriseOverview.joinTeam.message'})
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                style={{ width: '100%' }}
                onChange={this.handleTeamChange}
                placeholder={formatMessage({id:'popover.enterpriseOverview.joinTeam.placeholder'})}
              >
                {teamList &&
                  teamList.map(team => (
                    <Option value={team.team_name}>{team.team_alias}</Option>
                  ))}
              </Select>
            )}
            {}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
