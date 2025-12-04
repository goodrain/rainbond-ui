/* eslint-disable react/no-array-index-key */
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import ClusterProgressQuery from '../ClusterProgressQuery';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';


@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
class ShowKubernetesCreateDetail extends PureComponent {
  constructor(arg) {
    super(arg);
  }
  render() {
    const { title } = this.props;
    return (
      <ClusterProgressQuery
        isK8sProgress={true}
        title={title || <FormattedMessage id='enterpriseColony.ShowKubernetesCreateDetail.msg'/>}
        msg={formatMessage({id:'enterpriseColony.ShowKubernetesCreateDetail.msg'})}
        {...this.props}
      />
    );
  }
}

export default ShowKubernetesCreateDetail;
