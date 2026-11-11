import React, { PureComponent } from 'react';
import { Alert, Checkbox, Form, Input, InputNumber, Modal, Select } from 'antd';
import { t } from './messages';
import styles from './index.less';
import HelpLabel from './HelpLabel';
const Item = Form.Item;
const Option = Select.Option;
class ActionModal extends PureComponent {
  submit = () => {
    this.props.form.validateFields((error, values) => {
      if (!error)
        this.props.onSubmit({
          ...this.props.action.values,
          ...values
        });
    });
  };
  render() {
    const { action, vm = {}, data, form, onCancel } = this.props;
    const { getFieldDecorator: field, getFieldValue: value } = form;
    const kind = action.type;
    const required = (message) => [
      {
        required: true,
        whitespace: true,
        message: t(message)
      }
    ];
    const confirm = (label) => (
      <Item>
        {field('confirm', {
          valuePropName: 'checked',
          rules: [
            {
              validator: (_, checked, callback) =>
                callback(checked ? undefined : t('confirmRequired'))
            }
          ]
        })(<Checkbox>{label}</Checkbox>)}
      </Item>
    );
    let content;
    if (kind === 'hardware')
      content = (
        <>
          <div className={styles.formGrid}>
            <Item label={<HelpLabel label={t('cpu')} help="help.cpu" />}>
              {field('cpu', {
                initialValue: vm.pending?.cpu || vm.cpu,
                rules: [
                  {
                    required: true,
                    type: 'number',
                    min: 1,
                    max: 64,
                    message: t('invalidSize')
                  }
                ]
              })(<InputNumber min={1} max={64} precision={0} />)}
            </Item>
            <Item label={<HelpLabel label={t('memory')} help="help.memory" />}>
              {field('memory', {
                initialValue: vm.pending?.memory || vm.memory,
                rules: [
                  {
                    required: true,
                    type: 'number',
                    min: 1,
                    max: 256,
                    message: t('invalidSize')
                  }
                ]
              })(<InputNumber min={1} max={256} precision={0} />)}
            </Item>
          </div>
          <Alert
            showIcon
            type="info"
            message={t(
              vm.status === 'stopped' ? 'nextStart' : 'restartRequired'
            )}
          />
          {vm.scenario === 'capacity' && (
            <Alert
              className={styles.spaced}
              type="warning"
              showIcon
              message={t('capacityUnavailable')}
              description={`${t('available')}: 2 CPU / 4 GiB`}
            />
          )}
        </>
      );
    else if (kind === 'power')
      content = (
        <Alert
          showIcon
          type="warning"
          message={t(
            action.values.operation === 'stop' ? 'stopHelp' : 'restartHelp'
          )}
        />
      );
    else if (kind === 'finish')
      content = (
        <>
          <Alert showIcon type="info" message={t('finishHelp')} />
          <p className={styles.hint}>{t('finishEffects')}</p>
          {confirm(t('installedConfirm'))}
        </>
      );
    else if (kind === 'addDisk')
      content = (
        <>
          <Item label={t('name')}>
            {field('name', {
              initialValue: `${t('dataDisk')} ${vm.disks.length + 1}`,
              rules: required('nameRequired')
            })(<Input maxLength={48} />)}
          </Item>
          <Item label={<HelpLabel label={t('capacity')} help="help.dataDisk" />}>
            {field('size', {
              initialValue: 20,
              rules: [
                {
                  required: true,
                  type: 'number',
                  min: 1,
                  max: 2048,
                  message: t('invalidDisk')
                }
              ]
            })(<InputNumber min={1} max={2048} precision={0} />)}
          </Item>
          <Alert showIcon type="info" message={t('diskInitialize')} />
        </>
      );
    else if (kind === 'detach' || kind === 'deleteDisk') {
      const disk = vm.disks.find((d) => d.id === action.values.diskId);
      content = (
        <>
          <Alert
            showIcon
            type={kind === 'detach' ? 'warning' : 'error'}
            message={t(kind === 'detach' ? 'detachHelp' : 'deleteHelp', {
              name: disk?.name
            })}
          />
          {confirm(t(kind === 'detach' ? 'detachConfirm' : 'deleteConfirm'))}
        </>
      );
    } else if (kind === 'snapshot') {
      const mode = value('mode') || 'offline';
      content = (
        <>
          <Item label={t('snapshotName')}>
            {field('name', {
              initialValue: t('beforeChange'),
              rules: required('nameRequired')
            })(<Input maxLength={48} />)}
          </Item>
          <Item label={<HelpLabel label={t('snapshotMode')} help="help.snapshotMode" />}>
            {field('mode', {
              initialValue: 'offline'
            })(
              <Select>
                <Option value="offline">{t('offlineSnapshot')}</Option>
                <Option
                  value="online"
                  disabled={!vm.agent || vm.status !== 'running'}
                >
                  {t('onlineSnapshot')}
                </Option>
              </Select>
            )}
          </Item>
          <p className={styles.hint}>
            {t('snapshotContents')}：{t('systemDisk')} {vm.disk} GiB
            {vm.disks
              .filter((d) => d.attached)
              .map((d) => `、${d.name} ${d.size} GiB`)
              .join('')}
            。{t('noMemory')}
          </p>
          {mode === 'offline' &&
            vm.status !== 'stopped' &&
            confirm(t('snapshotStopConfirm'))}
          {(!vm.agent || vm.status !== 'running') && (
            <p className={styles.hint}>{t('agentRequired')}</p>
          )}
        </>
      );
    } else if (kind === 'restore')
      content = (
        <>
          <Alert showIcon type="warning" message={t('restoreHelp')} />
          <p className={styles.hint}>{t('restoreAdditionalDisks')}</p>
          {confirm(t('restoreConfirm'))}
        </>
      );
    else if (kind === 'external')
      content = (
        <>
          <Alert
            showIcon
            type="warning"
            message={t(
              action.values.enabled
                ? 'externalEnableHelp'
                : 'externalDisableHelp'
            )}
          />
          {confirm(t('externalConfirm'))}
        </>
      );
    else if (kind === 'integration')
      content = (
        <>
          <Item label={<HelpLabel label={t('clientComponent')} help="help.integration" />}>
            {field('client', {
              initialValue:
                vm.integration?.client ||
                data.components.find((c) => c.kind === 'container')?.id,
              rules: [
                {
                  required: true,
                  message: t('invalidIntegration')
                }
              ]
            })(
              <Select>
                {data.components
                  .filter((c) => c.kind === 'container')
                  .map((c) => (
                    <Option value={c.id} key={c.id}>
                      {c.name}
                    </Option>
                  ))}
              </Select>
            )}
          </Item>
          <Item label={<HelpLabel label={t('servicePort')} help="help.servicePort" />}>
            {field('port', {
              initialValue: vm.integration?.port || 80,
              rules: [
                {
                  required: true,
                  type: 'number',
                  min: 1,
                  max: 65535,
                  message: t('invalidIntegration')
                }
              ]
            })(<InputNumber min={1} max={65535} precision={0} />)}
          </Item>
          <p className={styles.hint}>{t('integrationHelp')}</p>
        </>
      );
    return (
      <Modal
        visible
        title={t(`action.${kind}`)}
        onCancel={onCancel}
        onOk={this.submit}
        okText={t('confirm')}
        cancelText={t('cancel')}
        destroyOnClose
        width={560}
      >
        <Form layout="vertical">{content}</Form>
      </Modal>
    );
  }
}
export default Form.create()(ActionModal);
