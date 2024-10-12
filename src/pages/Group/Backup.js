import React, { Component } from 'react'
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import EnterprisePluginsPage from '../../components/EnterprisePluginsPage'

export default class Backup extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  componentDidMount() {
  }
  render() {
    return (
      <PageHeaderLayout
        title={formatMessage({ id: 'appBackups.title' })}
        titleSvg={pageheaderSvg.getSvg('backupSvg', 18)}
        content={
          <p>
            {formatMessage({ id: 'appBackups.desc' })}
          </p>
        }
      >
        <EnterprisePluginsPage type='AppBackUp'/>
      </PageHeaderLayout >
    )
  }
}
