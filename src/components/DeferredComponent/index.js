import React, { PureComponent } from 'react';
import { dynamic } from 'umi';
import { Alert, Button, Modal, Spin } from 'antd';
import { formatMessage } from '@/utils/intl';

class ChunkLoading extends PureComponent {
  render() {
    const { error, retry, modal, visible, onCancel } = this.props;
    const content = error ? (
      <Alert
        type="error"
        showIcon
        message={formatMessage({ id: 'asyncChunk.loadFailed' })}
        description={
          <Button onClick={retry}>
            {formatMessage({ id: 'button.retry' })}
          </Button>
        }
      />
    ) : (
      <Spin tip={formatMessage({ id: 'status.loading' })} />
    );
    if (modal) {
      return (
        <Modal visible={visible} onCancel={onCancel} footer={null}>
          {content}
        </Modal>
      );
    }
    return (
      <div role={error ? 'alert' : 'status'}>
        {content}
        {onCancel && (
          <Button onClick={onCancel}>
            {formatMessage({ id: 'button.cancel' })}
          </Button>
        )}
      </div>
    );
  }
}

export default function deferredComponent(loader, { modal = false } = {}) {
  return class DeferredComponent extends PureComponent {
    constructor(props) {
      super(props);
      this.Loadable = dynamic({
        loader,
        loading: status => (
          <ChunkLoading
            {...status}
            modal={modal}
            visible={this.props.visible}
            onCancel={this.props.onLoadingCancel || this.props.onCancel || this.props.handleClose}
          />
        )
      });
    }

    render() {
      const Loaded = this.Loadable;
      const { onLoadingCancel, ...props } = this.props;
      return <Loaded {...props} />;
    }
  };
}
