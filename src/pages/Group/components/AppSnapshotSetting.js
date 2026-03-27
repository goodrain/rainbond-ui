import React from 'react';
import { Col, Form, Input, notification, Row } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
import {
  createAppVersionSnapshot,
  getAppVersionOverview
} from '../../../services/api';
import globalUtil from '../../../utils/global';
import AppShareBase from './AppShareBase';
import {
  appShareStateSelector,
  buildNextSnapshotVersion,
  DEFAULT_SNAPSHOT_VERSION
} from './appShareHelpers';
import styles from '../publish.less';

const { TextArea } = Input;

const verticalFormItemLayout = {
  labelCol: {
    span: 24
  },
  wrapperCol: {
    span: 24
  }
};

@connect(appShareStateSelector)
@Form.create()
class AppSnapshotSetting extends AppShareBase {
  getInitialState = () => ({
    snapshotNextVersion: DEFAULT_SNAPSHOT_VERSION
  });

  isSnapshotMode = () => true;

  afterCommonMount = () => {
    this.initSnapshotVersion();
  };

  onShareInfoLoaded = () => {
    this.applySnapshotVersionIfNeeded();
  };

  initSnapshotVersion = () => {
    const query = (this.props.location && this.props.location.query) || {};
    if (query.latest_snapshot_version) {
      this.updateSnapshotNextVersion(
        buildNextSnapshotVersion(query.latest_snapshot_version)
      );
      return;
    }
    const { teamName, appID } = this.props.match.params;
    getAppVersionOverview({
      team_name: teamName,
      group_id: appID
    })
      .then(res => {
        const overview = (res && res.bean) || {};
        this.updateSnapshotNextVersion(
          buildNextSnapshotVersion(overview.current_version)
        );
      })
      .catch(() => {
        this.updateSnapshotNextVersion(DEFAULT_SNAPSHOT_VERSION);
      });
  };

  updateSnapshotNextVersion = nextVersion => {
    const { form } = this.props;
    const previousAutoVersion =
      this.state.snapshotNextVersion || DEFAULT_SNAPSHOT_VERSION;
    this.setState(
      { snapshotNextVersion: nextVersion || DEFAULT_SNAPSHOT_VERSION },
      () => {
        if (!this.state.info) {
          return;
        }
        const currentVersion = form.getFieldValue('version');
        if (!currentVersion || currentVersion === previousAutoVersion) {
          form.setFieldsValue({
            version: this.state.snapshotNextVersion
          });
        }
      }
    );
  };

  applySnapshotVersionIfNeeded = () => {
    const { form } = this.props;
    const currentVersion = form.getFieldValue('version');
    if (!currentVersion) {
      form.setFieldsValue({
        version: this.state.snapshotNextVersion || DEFAULT_SNAPSHOT_VERSION
      });
    }
  };

  handleModeSubmit = values => {
    const { dispatch } = this.props;
    const submissionData = this.collectSubmissionData();
    if (!submissionData) {
      return;
    }
    const { selectedShareServices, plugin_list, share_k8s_resources } =
      submissionData;
    const teamName = globalUtil.getCurrTeamName();
    const { appID, shareId } = this.props.match.params;
    this.setState({ submitLoading: true });
    createAppVersionSnapshot({
      team_name: teamName,
      group_id: appID,
      version: values.version,
      version_alias: values.version_alias,
      app_version_info: values.describe,
      share_service_list: selectedShareServices,
      share_plugin_list: plugin_list,
      share_k8s_resources
    })
      .then(res => {
        this.setState({ submitLoading: false });
        const bean = (res && res.bean) || {};
        if (bean.created === false) {
          notification.warning({
            message: (res && res.msg_show) || '当前没有新的变更，无需创建快照'
          });
          return;
        }
        dispatch({
          type: 'application/giveupShare',
          payload: {
            team_name: teamName,
            share_id: shareId
          },
          callback: () => {
            dispatch(
              routerRedux.replace(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${appID}/version`
              )
            );
          }
        });
        notification.success({
          message: (res && res.msg_show) || '创建快照成功'
        });
      })
      .catch(errs => {
        this.setState({ submitLoading: false });
        const data = errs && errs.data;
        const msg = (data && data.msg_show) || '创建快照失败';
        notification.warning({ message: msg });
      });
  };

  handleGiveup = () => {
    const groupId = this.props.match.params.appID;
    const { dispatch } = this.props;
    dispatch({
      type: 'application/giveupShare',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        share_id: this.props.match.params.shareId
      },
      callback: () => {
        dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${groupId}/version`
          )
        );
      }
    });
  };

  renderBasicStage = ({
    getFieldDecorator,
    snapshotNextVersion
  }) => (
    <div className={styles.basicStage}>
      <Row gutter={20}>
        <Col xs={24} xl={14}>
          <Form.Item
            {...verticalFormItemLayout}
            label={formatMessage({
              id: 'appPublish.btn.record.list.label.version'
            })}
          >
            {getFieldDecorator('version', {
              initialValue: snapshotNextVersion,
              rules: [
                {
                  required: true,
                  validator: this.checkVersion
                }
              ]
            })(
              <Input
                style={{ width: '100%' }}
                placeholder={formatMessage({
                  id: 'placeholder.appShare.version'
                })}
              />
            )}
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            {...verticalFormItemLayout}
            className={styles.fullTextareaItem}
            label={formatMessage({
              id: 'appPublish.btn.record.list.label.describe'
            })}
          >
            {getFieldDecorator('describe', {
              initialValue: '',
              rules: [
                {
                  max: 255,
                  message: formatMessage({ id: 'placeholder.max255' })
                }
              ]
            })(
              <TextArea
                placeholder={formatMessage({
                  id: 'placeholder.appShare.describe'
                })}
                style={{ minHeight: '104px' }}
              />
            )}
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}

export default AppSnapshotSetting;
