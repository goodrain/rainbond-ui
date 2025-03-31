import React, { Component } from 'react'
import { Table, Row, Button, Modal } from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { connect } from 'dva';
import moment from 'moment';
import GlobalUtil from '../../../utils/global';

@connect(({ gateWay, application }) => ({
  gateWay: gateWay,
  groupDetail: application.groupDetail || {}
}))
export default class AutomaticIssuance extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: [],
      isModalVisible: false,
      currentDetail: ''
    };
  }
  componentDidMount() {
    this.getAutomaticIssuanceCertList();
  }
  getAutomaticIssuanceCertList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'gateWay/getAutomaticIssuanceCertList',
      payload: {
        teamName: GlobalUtil.getCurrTeamName(),
        region_app_id: this.props?.groupDetail?.region_app_id
      },
      callback: res => {
        console.log(res, "res");
        if (res && res?.list.length > 0) {
          this.setState({
            dataSource: res.list
          });
        }
      }
    });
  }
  showModal = (detail) => {
    this.setState({
      isModalVisible: true,
      currentDetail: detail
    });
  };

  handleModalClose = () => {
    this.setState({
      isModalVisible: false,
      currentDetail: ''
    });
  };


  render() {
    const { dataSource, isModalVisible, currentDetail } = this.state;
    const columns = [
      {
        title: formatMessage({ id: 'teamNewGateway.NewGateway.AutomaticIssuance.domain' }),
        dataIndex: 'domains',
        render: (text, record) => {
          return text.map((item, index) => {
            return (
              <Row style={{ marginBottom: 4 }} key={index}>
                <a href={`http://${item}`} target="_blank">
                  {item}
                </a>
              </Row>
            )
          })
        }
      },
      {
        title: formatMessage({ id: 'teamNewGateway.NewGateway.AutomaticIssuance.expiredTime' }),
        dataIndex: 'expiry_date',
        render: (text, record) => {
          if (record.status == "True") {
            return record.expiry_date ? moment(record.expiry_date).format('YYYY-MM-DD HH:mm:ss') : '-';
          } else {
            return '-';
          }
        }
      },
      {
        title: formatMessage({ id: 'teamNewGateway.NewGateway.AutomaticIssuance.issueStatus' }),
        dataIndex: 'status',
        render: (text, record) => {
          return text == "True" ? formatMessage({ id: 'teamNewGateway.NewGateway.AutomaticIssuance.issued' }) : formatMessage({ id: 'teamNewGateway.NewGateway.AutomaticIssuance.notIssued' });
        }
      },
      {
        title: formatMessage({ id: 'teamNewGateway.NewGateway.AutomaticIssuance.autoRenew' }),
        dataIndex: 'auto_renew',
        render: (text, record) => {
          return text ? formatMessage({ id: 'teamNewGateway.NewGateway.AutomaticIssuance.yes' }) : formatMessage({ id: 'teamNewGateway.NewGateway.AutomaticIssuance.no' });
        }
      },
      {
        title: formatMessage({ id: 'teamNewGateway.NewGateway.AutomaticIssuance.issueDetail' }),
        dataIndex: 'issue_detail',
        render: (text, record) => {
          return <Button onClick={() => this.showModal(text)}>
          {formatMessage({id:'teamNewGateway.NewGateway.AutomaticIssuance.viewDetail'})}
        </Button>
        }
      },
    ]
    return (
      <div>
        <Table columns={columns} dataSource={dataSource} />
        <Modal
          title={formatMessage({ id: 'teamNewGateway.NewGateway.AutomaticIssuance.detail' })}
          visible={isModalVisible}
          onCancel={this.handleModalClose}
          footer={null}
        >
          <div>{currentDetail}</div>
        </Modal>
      </div>
    )
  }
}
