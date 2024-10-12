import React, { Component } from 'react';
import Result from '../../components/Result';

// eslint-disable-next-line react/prefer-stateless-function
export default class Overdue extends Component {
  render() {
    const { location, desc, title } = this.props;
    const isLicense = location && location.query && location.query.isLicense;
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
        <Result
          type="warning"
          isGoBack={true}
          title={title}
          description={desc}
        />
      </div>
    );
  }
}
