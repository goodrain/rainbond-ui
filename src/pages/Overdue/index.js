import React, { Component } from 'react';
import Result from '../../components/Result';

// eslint-disable-next-line react/prefer-stateless-function
export default class Overdue extends Component {
  render() {
    const { location, desc, title, currentUser } = this.props;
    const isLicense = location && location.query && location.query.isLicense;
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
        <Result
          type="warning"
          isGoBack={currentUser.is_enterprise_admin ? true : false}
          linkPath={`/enterprise/${currentUser.enterprise_id}/index`}
          title={title}
          description={currentUser.is_enterprise_admin ? '授权码已过期，点击下方按钮更新授权码' : desc}
        />
      </div>
    );
  }
}
