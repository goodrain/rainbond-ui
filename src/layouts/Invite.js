import React, { Component } from 'react';
import { Card, Row, Col, Button, Tag, notification } from 'antd';
import { connect } from 'dva';
import { TeamOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import globalUtil from '@/utils/global';
import moment from 'moment';
import styles from './Invite.less';

@connect()
export default class Invite extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inviteData: {}
    };
  }

  componentDidMount() {
    this.loadInviteData();
  }

  loadInviteData() {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/getInviteLink',
      payload: { invite_id: globalUtil.getInviteID() },
      callback: res => {
        this.setState({ inviteData: res.bean });
      }
    });
  }

  handleAcceptInvite = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/acceptInvite',
      payload: { action: 'accept', invite_id: globalUtil.getInviteID() },
      callback: (res) => {
        if (res && res.status_code === 200) {
          console.log(res, "res");
          notification.success({
            message: '邀请成功',
            description: '即将进入团队主页',
          });
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      }
    });
  }

  handleGoHome = () => {
    window.location.href = '/';
  }

  render() {
    const { inviteData } = this.state;

    const isExpired = inviteData.expired_time && moment().isAfter(moment(inviteData.expired_time));

    return (
      <div className={styles.inviteContainer}>
        <Card title="团队邀请" className={styles.inviteCard}>
          <div className={styles.teamHeader}>
            <TeamOutlined className={styles.teamIcon} />
            <h2>{inviteData.team_alias}</h2>
            <p className={styles.teamName}>({inviteData.team_name})</p>
          </div>

          <Row className={styles.infoRow}>
            <Col span={24}>
              <UserOutlined /> 邀请人：{inviteData.inviter}
            </Col>
          </Row>

          <Row className={styles.infoRow}>
            <Col span={24}>
              <ClockCircleOutlined /> 邀请时间：{moment(inviteData.invite_time).format('YYYY-MM-DD HH:mm:ss')}
            </Col>
          </Row>

          <Row className={styles.infoRow}>
            <Col span={24}>
              <ClockCircleOutlined /> 过期时间：{moment(inviteData.expired_time).format('YYYY-MM-DD HH:mm:ss')}
            </Col>
          </Row>
          <div className={styles.inviteActions}>
            {isExpired ? (
              <>
                <Button
                  type="primary"
                  disabled
                >
                  邀请链接已过期
                </Button>
                <Button
                  type="default"
                  onClick={this.handleGoHome}
                  style={{ marginLeft: 16 }}
                >
                  返回首页
                </Button>
              </>
            ) : inviteData.is_accepted ? (
              <>
                <Button
                  type="primary"
                  disabled
                >
                  邀请链接已使用
                </Button>
                <Button
                  type="default"
                  onClick={this.handleGoHome}
                  style={{ marginLeft: 16 }}
                >
                  返回首页
                </Button>
              </>
            ) : (!inviteData.is_member) ? (
              <Button
                type="primary"
                onClick={this.handleAcceptInvite}
              >
                接受邀请
              </Button>
            ) : (
              <>
                <Button
                  type="primary"
                  disabled
                >
                  已是团队成员
                </Button>
                <Button
                  type="default"
                  onClick={this.handleGoHome}
                  style={{ marginLeft: 16 }}
                >
                  返回首页
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  }
}