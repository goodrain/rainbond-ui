import styles from '@/components/CreateTeam/index.less';
import { Button, Card, Form, Modal } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { getRollsBackRecordDetails } from '../../../services/app';
import handleAPIError from '../../../utils/error';
import infoUtil from '../UpgradeInfo/info-util';

@connect()
@Form.create()
export default class rollsBackRecordDetails extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      textState: '',
      upgradeLoading: false,
      recordLoading: false
    };
  }
  componentDidMount() {
    this.fetchRollsBackRecordDetails();
  }

  handleSubmit = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        onOk(vals);
      }
    });
  };
  handleLoading = recordLoading => {
    this.setState({
      recordLoading
    });
  };

  fetchRollsBackRecordDetails = () => {
    const { team_name, group_id, info } = this.props;
    this.handleLoading(true);
    getRollsBackRecordDetails({
      team_name,
      group_id,
      record_id: info.ID,
      noModels: true
    })
      .then(res => {
        const info = res.bean || {};
        this.setState(
          {
            list: info.service_record || [],
            textState: info.status,
            recordLoading: false
          },
          () => {
            if (info.status === 4) {
              setTimeout(() => {
                this.fetchRollsBackRecordDetails();
              }, 3000);
            }
          }
        );
      })
      .catch(err => {
        handleAPIError(err);
      });
  };

  handleRetry = () => {
    const { form, dispatch, team_name, group_id, info } = this.props;
    const { upgradeLoading } = this.state;
    form.validateFields(err => {
      if (!err && !upgradeLoading) {
        this.setState(
          {
            upgradeLoading: true
          },
          () => {
            dispatch({
              type: 'global/fetchAppRedeploy',
              payload: {
                team_name,
                group_id,
                record_id: info.ID
              },
              callback: res => {
                if (res && res.status_code === 200) {
                  this.setState(
                    {
                      upgradeLoading: false
                    },
                    () => {
                      this.fetchRollsBackRecordDetails();
                    }
                  );
                }
              },
              handleError: errs => {
                handleAPIError(errs);
                this.fetchRollsBackRecordDetails();
              }
            });
          }
        );
      }
    });
  };
  render() {
    const { onCancel, loading = false } = this.props;
    const { recordLoading, list, textState, upgradeLoading } = this.state;

    const gridStyle = {
      width: '50%',
      textAlign: 'center'
    };
    return (
      <Modal
        visible
        title="回滚详情"
        width={1000}
        confirmLoading={loading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        footer={[
          <Button style={{ marginTop: '20px' }} onClick={onCancel}>
            关闭
          </Button>
        ]}
      >
        <Card
          title="组件列表"
          loading={recordLoading}
          onClick={[7, 10].includes(textState) && this.handleRetry}
          extra={
            <Button type="primary" loading={upgradeLoading}>
              {[7, 10].includes(textState)
                ? '重试'
                : infoUtil.getStatusCNS(textState)}
            </Button>
          }
        >
          {list &&
            list.map(item => {
              const { ID, status, service_cname } = item;
              return (
                <Card.Grid key={ID} style={gridStyle}>
                  {service_cname} 状态：{infoUtil.getStatusCNS(status)}
                </Card.Grid>
              );
            })}
        </Card>
      </Modal>
    );
  }
}
