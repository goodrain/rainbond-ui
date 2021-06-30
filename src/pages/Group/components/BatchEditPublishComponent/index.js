/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/sort-comp */
import { Button, Checkbox, Divider, Form, message, Modal } from 'antd';
import { PureComponent } from 'react';

@Form.create()
class BatchEditPublishComponent extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      indeterminate: true,
      checkAll: false,
      checkedList: [],
      allOptions: []
    };
  }

  componentDidMount() {
    this.setOptions();
  }
  setOptions = () => {
    const { components, allcomponents } = this.props;
    if (components) {
      const options = components.map(item => item.service_share_uuid);
      const alloptions = allcomponents.map(item => item.service_share_uuid);
      this.setState({
        allOptions: alloptions,
        checkedList: options,
        checkAll: alloptions.length === options.length,
        indeterminate: !!options.length && options.length < alloptions.length
      });
    }
  };
  batchEdit = () => {
    const { checkedList } = this.state;
    if (checkedList.length < 1) {
      message.info('请至少发布一个组件');
      return;
    }
    const { onOk } = this.props;
    if (onOk) {
      onOk(checkedList);
    }
  };
  onChange = checkedList => {
    if (checkedList.length < 1) {
      message.info('请至少保留一个组件');
      return;
    }
    const { allOptions } = this.state;
    this.setState({
      checkedList,
      indeterminate:
        !!checkedList.length && checkedList.length < allOptions.length,
      checkAll: checkedList.length === allOptions.length
    });
  };

  onCheckAllChange = e => {
    const { allOptions } = this.state;
    this.setState({
      checkedList: e.target.checked ? allOptions : [],
      indeterminate: false,
      checkAll: e.target.checked
    });
  };
  render() {
    const { indeterminate, checkAll, checkedList } = this.state;
    const { allcomponents, onCancel } = this.props;
    return (
      <Modal
        title="批量编辑待发布组件"
        visible
        maskClosable={false}
        onOk={this.batchEdit}
        onCancel={onCancel}
        okText="确定"
        cancelText="取消"
      >
        <Checkbox
          indeterminate={indeterminate}
          onChange={this.onCheckAllChange}
          checked={checkAll}
        >
          选择全部
        </Checkbox>
        <Divider />
        <Checkbox.Group
          style={{
            width: '100%',
            display: 'flex',
            flexFlow: 'row wrap'
          }}
          onChange={this.onChange}
          value={checkedList}
        >
          {allcomponents.map(apptit => {
            return (
              <div style={{ padding: '8px', flex: '0 0 50%' }}>
                <Button
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    overflow: 'hidden',
                    padding: 0
                  }}
                >
                  <Checkbox
                    checked
                    value={apptit.service_share_uuid}
                    style={{
                      width: '100%',
                      marginRight: '10px',
                      padding: '5px 15px'
                    }}
                  >
                    {apptit.service_cname}
                  </Checkbox>
                </Button>
              </div>
            );
          })}
        </Checkbox.Group>
      </Modal>
    );
  }
}

export default BatchEditPublishComponent;
