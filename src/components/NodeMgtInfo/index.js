import React, { Component } from 'react';
import {
  Button,
  Badge,
  Tag,
  Skeleton,
  notification
} from 'antd';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import SVG from '../../utils/pageHeaderSvg'
import globalUtil from '../../utils/global'
import styles from "./index.less";

@connect()
class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
  }
  renderStatus = (text, colorKey) => {
    const color = globalUtil.getPublicColor(colorKey);
    return (
      <span className={styles.nodeStatusText} style={{ color }}>
        <Badge color={color} />
        {text}
      </span>
    );
  }
  //节点状态
  getStatus = (status) => {
    switch (status) {
      case "Ready":
        return this.renderStatus(status, 'rbd-success-status');
      case 'NotReady':
        return this.renderStatus(status, 'rbd-error-status');
        case 'Ready,SchedulingDisabled':
          return this.renderStatus(status, 'rbd-success-status');
      default:
        return this.renderStatus(<FormattedMessage id='enterpriseColony.table.state.unknown' />, 'rbd-content-color-secondary');
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
    const { nodeDetail, showInfo, titleIcon, titleText } = this.props
    const infoItems = [
      {
        label: formatMessage({id:"enterpriseColony.mgt.node.ip"}),
        value: nodeDetail && nodeDetail.ip || '-'
      },
      {
        label: formatMessage({id:"enterpriseColony.mgt.node.container"}),
        value: nodeDetail && nodeDetail.container_runtime || '-'
      },
      {
        label: formatMessage({id:"enterpriseColony.mgt.node.framework"}),
        value: nodeDetail && nodeDetail.architecture || '-'
      },
      {
        label: formatMessage({id:"enterpriseColony.mgt.node.type"}),
        value: nodeDetail && nodeDetail.roles && nodeDetail.roles.length > 0 ?
          nodeDetail.roles.map((item, index) => {
            return <Tag key={index}>{item}</Tag>
          }) : '-'
      },
      {
        label: formatMessage({id:"enterpriseColony.mgt.node.operatingVs"}),
        value: nodeDetail && nodeDetail.os_version || '-'
      },
      {
        label: formatMessage({id:"enterpriseColony.mgt.node.time"}),
        value: nodeDetail && nodeDetail.create_time || '-'
      },
      {
        label: formatMessage({id:"enterpriseColony.mgt.node.operatingType"}),
        value: nodeDetail && nodeDetail.os_type || '-'
      },
      {
        label: formatMessage({id:"enterpriseColony.mgt.node.coreVs"}),
        value: nodeDetail && nodeDetail.kernel || '-'
      }
    ];
    return (
      <>
        <div className={styles.cardContainer}>
          <div className={styles.cardHeader}>
            <div className={styles.titleStyle}>
              <span>{titleIcon}</span>
              <span>{titleText}</span>
            </div>
          </div>
          <div className={styles.cardBody}>
            {showInfo ?
              <>
                <div className={styles.infoHeader}>
                  <div className={styles.infoMain}>
                    <div className={styles.nodeIconBox}>
                      {SVG.getSvg('settingSvg', 36)}
                    </div>
                    <div className={styles.infoTitle}>
                      <div className={styles.nodeName}>{nodeDetail && nodeDetail.name}</div>
                      <div className={styles.nodeStatus}>{this.getStatus(nodeDetail && nodeDetail.status)}</div>
                    </div>
                  </div>
                  <div className={styles.infoExtra}>
                    {nodeDetail.unschedulable == false ?
                      <Button
                        onClick={() => {
                          this.handelActive('unschedulable', nodeDetail.name)
                        }}
                      >
                        {formatMessage({id:"enterpriseColony.mgt.cluster.banDispatch"})}
                      </Button>
                      :
                      <Button
                        onClick={() => {
                          this.handelActive('reschedulable', nodeDetail.name)
                        }}
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
                  </div>
                </div>
                <div className={styles.nodeInfoGrid}>
                  {infoItems.map((item, index) => (
                    <div className={styles.nodeInfoItem} key={index}>
                      <span className={styles.nodeInfoLabel}>{item.label}</span>
                      <span className={styles.nodeInfoValue}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
              :
              <Skeleton active />
            }
          </div>
        </div>
      </>
    );
  }
}

export default Index;
