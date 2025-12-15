import React, { Component } from 'react'
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import { formatMessage } from '@/utils/intl';
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
           <>
            {formatMessage({ id: 'appBackups.desc' })}
           </>
        }
      >
        <EnterprisePluginsPage type='AppBackUp' key='AppBackUp'/>
      </PageHeaderLayout >
    )
  }
}
