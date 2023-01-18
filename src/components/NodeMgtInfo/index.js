import React, { Component } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Badge,
  Descriptions,
  Tag,
  Skeleton,
  notification
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import styles from "./index.less";

@connect()
class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
  }
  //节点状态
  getStatus = (status) => {
    switch (status) {
      case "Ready":
        return (
          <span style={{ color: '#52c41a', marginLeft: 20 }}>
            <Badge color="#52c41a" />
            {status}
          </span>
        );
      case 'NotReady':
        return (
          <span style={{ color: 'red', marginLeft: 20 }}>
            <Badge color="red" />
            {status}
          </span>
        );
        case 'Ready,SchedulingDisabled':
          return (
            <span style={{ color: '#52c41a', marginLeft: 20 }}>
              <Badge color="#52c41a" />
              {status}
            </span>
          );
      default:
        return (
          <span style={{ color: 'black', marginLeft: 20 }}>
            <Badge color="black" />
            {/* 未知 */}
            <FormattedMessage id='enterpriseColony.table.state.unknown' />
          </span>
        );
    }
  }
  handelActive = (active, name) => {
    const { nodeDetail } = this.props;
    if (active == 'evict') {
      if (nodeDetail.unschedulable == true) {
        this.props.active(active, name)
      } else {
        notification.warning({
          message: formatMessage({id:"enterpriseColony.mgt.cluster.placeseDispatch"})
        });
      }
    } else {
      this.props.active(active, name)
    }
  }
  render() {
    const { nodeDetail, showInfo } = this.props
    const titleContent = (
      <>
        <span>{nodeDetail && nodeDetail.name}</span>
        <span style={{ marginLeft: 10 }}>{this.getStatus(nodeDetail && nodeDetail.status)}</span>
      </>
    )
    const extraContent = (
      <>
        {nodeDetail.unschedulable == false ?
          <Button
            onClick={() => {
              this.handelActive('unschedulable', nodeDetail.name)
            }}
            style={{ marginRight: 20 }}
          >
            {formatMessage({id:"enterpriseColony.mgt.cluster.banDispatch"})}
          </Button>
          :
          <Button
            onClick={() => {
              this.handelActive('reschedulable', nodeDetail.name)
            }}
            style={{ marginRight: 20 }}
          >
            {formatMessage({id:"enterpriseColony.mgt.cluster.dispatch"})}
          </Button>
        }

        <Button
          onClick={() => {
            this.handelActive('evict', nodeDetail.name)
          }}
        >
          {formatMessage({id:"enterpriseColony.mgt.cluster.evacuation"})}
        </Button>
      </>
    )
    return (
      <>
        <Card
          title={showInfo && titleContent}
          extra={showInfo && extraContent}
          className={styles.description}
          style={
            { boxShadow: 'rgba(36, 46, 66, 0.16) 2px 4px 10px 0px' }
          }
          bodyStyle={{
            padding: '24px 24px 12px'
          }}
        >
          {showInfo ?
            <Descriptions >
              <Descriptions.Item label={formatMessage({id:"enterpriseColony.mgt.node.ip"})}>
                {nodeDetail && nodeDetail.ip || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={formatMessage({id:"enterpriseColony.mgt.node.container"})}>
                {nodeDetail && nodeDetail.container_runtime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={formatMessage({id:"enterpriseColony.mgt.node.framework"})}>
                {nodeDetail && nodeDetail.architecture || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={formatMessage({id:"enterpriseColony.mgt.node.type"})}>
                {nodeDetail && nodeDetail.roles && nodeDetail.roles.length > 0 ?
                  nodeDetail.roles.map((item, index) => {
                    return <Tag key={index}>
                      {item}
                    </Tag>
                  }) : '-'
                }
              </Descriptions.Item>
              <Descriptions.Item label={formatMessage({id:"enterpriseColony.mgt.node.operatingVs"})}>
                {nodeDetail && nodeDetail.os_version || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={formatMessage({id:"enterpriseColony.mgt.node.time"})}>
                {nodeDetail && nodeDetail.create_time || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={formatMessage({id:"enterpriseColony.mgt.node.operatingType"})}>
                {nodeDetail && nodeDetail.os_type || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={formatMessage({id:"enterpriseColony.mgt.node.coreVs"})}>
                {nodeDetail && nodeDetail.kernel || '-'}
              </Descriptions.Item>
            </Descriptions>
            :
            <Skeleton active />
          }

        </Card>
      </>
    );
  }
}

export default Index;
