import React, { PureComponent } from 'react';
import { Alert, Button, Card, Descriptions, Form, Input, InputNumber, Radio, Select, Steps } from 'antd';
import { formatMessage } from '@/utils/intl';
import { createValues } from './state';
import { t } from './messages';
import styles from './index.less';
import HelpLabel from './HelpLabel';

const Item = Form.Item;
const VM_RESOURCE_PRESETS = [
  { key: '2c2g', cpu: 2, memory: 2, message: 'Vm.createVm.2g' },
  { key: '2c4g', cpu: 2, memory: 4, message: 'Vm.createVm.4g' },
  { key: '4c8g', cpu: 4, memory: 8, message: 'Vm.createVm.8g' },
  { key: '4c16g', cpu: 4, memory: 16, message: 'Vm.createVm.16g' }
];
const FORM_ITEM_LAYOUT = { labelCol: { xs: { span: 24 }, sm: { span: 3 } }, wrapperCol: { xs: { span: 24 }, sm: { span: 21 } } };

class CreateVm extends PureComponent {
  state = { step: 0, validationError: '', resourcePreset: '4c8g' };

  componentDidUpdate(previous) {
    if (previous.sourceSummary !== this.props.sourceSummary) {
      this.props.form.resetFields(['disk_volume_type']);
      this.setState({ step: 0, validationError: '' });
    } else if (previous.creationStorage !== this.props.creationStorage) {
      const selected = this.props.form.getFieldValue('disk_volume_type');
      const storage = this.props.creationStorage;
      if (selected && (storage?.status !== 'ready' || !storage.options.some(option => option.value === selected))) {
        this.props.form.resetFields(['disk_volume_type']);
        this.setState({ step: 0, validationError: '' });
      }
    }
    if (this.state.resourcePreset !== 'custom') {
      const preset = VM_RESOURCE_PRESETS.find(item => item.cpu === this.props.form.getFieldValue('cpu') && item.memory === this.props.form.getFieldValue('memory'));
      if (preset && preset.key !== this.state.resourcePreset) this.setState({ resourcePreset: preset.key });
      else if (!preset) this.setState({ resourcePreset: 'custom' });
    }
  }

  selectResourcePreset = event => {
    if (this.props.submitting) return;
    const key = event.target.value;
    const preset = VM_RESOURCE_PRESETS.find(item => item.key === key);
    if (!preset && key !== 'custom') return;
    if (preset) this.props.form.setFieldsValue({ cpu: preset.cpu, memory: preset.memory });
    this.setState({ resourcePreset: key, validationError: '' });
  };

  storageCanProceed = () => this.props.creationStorage?.status === 'deferred' ||
    (this.props.creationStorage?.status === 'ready' && this.props.creationStorage.options.length > 0);

  storageError = () => t(this.props.creationStorage?.status === 'empty' ? 'creationStorageEmpty'
    : this.props.creationStorage?.status === 'failed' ? 'creationStorageFailed' : 'creationStorageLoading');

  next = () => {
    if (this.props.submitting) return;
    if (!this.storageCanProceed()) {
      this.setState({ validationError: this.storageError() });
      return;
    }
    const fields = ['cpu', 'memory', 'disk', ...(this.props.creationStorage.status === 'ready' ? ['disk_volume_type'] : [])];
    this.props.form.validateFields(fields, { force: true }, error => {
      if (error) this.setState({ validationError: error.disk_volume_type ? t('storageRequired') : t('invalidSize') });
      else this.setState({ step: 1, validationError: '' });
    });
  };

  submit = () => {
    if (this.props.submitting) return;
    if (!this.storageCanProceed()) {
      this.setState({ step: 0, validationError: this.storageError() });
      return;
    }
    const fields = ['cpu', 'memory', 'disk', ...(this.props.creationStorage.status === 'ready' ? ['disk_volume_type'] : [])];
    this.props.form.validateFields(fields, { force: true }, (error, values) => {
      if (error) this.setState({ step: 0, validationError: error.disk_volume_type ? t('storageRequired') : t('invalidSize') });
      else this.props.onCreate({ cpu: values.cpu, memory: values.memory, disk: values.disk,
        ...(this.props.creationStorage.status === 'ready' ? { disk_volume_type: values.disk_volume_type } : {}) });
    });
  };

  handleFormSubmit = event => {
    event.preventDefault();
    if (this.props.submitting) return;
    if (this.state.step === 0) this.next();
    else this.submit();
  };

  render() {
    const { form, sourceSummary: source, onBackToSource, onCancel, submitting, onRetryStorage,
      creationStorage = { status: 'loading', options: [] } } = this.props;
    const { getFieldDecorator: field, getFieldValue: value } = form;
    const { step, resourcePreset } = this.state;
    const initial = createValues();
    const selectedStorage = creationStorage.status === 'ready'
      ? creationStorage.options.find(option => option.value === value('disk_volume_type')) : null;
    const storageSummary = selectedStorage?.label || t(creationStorage.status === 'deferred' ? 'creationStorageDeferred' : 'storageRequired');
    if (!source) return <Alert type="info" showIcon message={t('nativeSourceRequired')} />;
    return (
      <div className={`${styles.creation} ${step === 1 ? styles.creationReview : styles.creationCompact}`}>
        <Steps current={step} size="small">
          <Steps.Step title={t('vmConfiguration')} />
          <Steps.Step title={t('reviewCreate')} />
        </Steps>
        <div className={styles.sourceContext}>
          <span>{source.name} · {t(`creationMethod.${source.sourceType}`)} · {source.sourceName}</span>
          <Button type="link" size="small" onClick={onBackToSource} disabled={submitting}>{t('backToSourceModal')}</Button>
        </div>
        {this.state.validationError && <Alert className={styles.spaced} type="error" showIcon message={this.state.validationError} />}
        <Form layout="horizontal" onSubmit={this.handleFormSubmit}>
          <div hidden={step !== 0}>
            <Card title={t('vmConfiguration')} className={styles.nativeConfigCard}>
              <Item {...FORM_ITEM_LAYOUT} label={formatMessage({ id: 'Vm.createVm.specification' })}>
                <Radio.Group value={resourcePreset} onChange={this.selectResourcePreset} disabled={submitting} className={styles.resourcePresets}>
                  {VM_RESOURCE_PRESETS.map(preset => <Radio.Button key={preset.key} value={preset.key}>{formatMessage({ id: preset.message })}</Radio.Button>)}
                  <Radio.Button value="custom">{formatMessage({ id: 'Vm.createVm.Custom' })}</Radio.Button>
                </Radio.Group>
              </Item>
              <div hidden={resourcePreset !== 'custom'}>
                <Item {...FORM_ITEM_LAYOUT} label={<HelpLabel label={t('vcpuLabel')} help="help.cpu" />}>
                  {field('cpu', { initialValue: initial.cpu, rules: [{ required: true, type: 'integer', min: 1, max: 64, message: t('invalidSize') }] })(
                    <InputNumber min={1} max={64} precision={0} disabled={submitting} />
                  )}
                </Item>
                <Item {...FORM_ITEM_LAYOUT} label={<HelpLabel label={t('memory')} help="help.memory" />}>
                  {field('memory', { initialValue: initial.memory, rules: [{ required: true, type: 'integer', min: 1, max: 256, message: t('invalidSize') }] })(
                    <InputNumber min={1} max={256} precision={0} disabled={submitting} />
                  )}
                </Item>
              </div>
              <Item {...FORM_ITEM_LAYOUT} label={<HelpLabel label={t('systemDiskSize')} help="help.systemDisk" />}>
                {field('disk', { initialValue: initial.disk, rules: [{ required: true, type: 'integer', min: 20, max: 2048, message: t('invalidSize') }] })(
                  <InputNumber min={20} max={2048} precision={0} disabled={submitting} />
                )}
              </Item>
              <Item {...FORM_ITEM_LAYOUT} label={<HelpLabel label={t('storage')} help="help.storage" />}
                extra={<span className={styles.hint}>{t(creationStorage.status === 'deferred' ? 'creationStorageDeferredHelp' : 'quickStartStorageHelp')}</span>}>
                {creationStorage.status === 'deferred' ? <Input readOnly value={t('creationStorageDeferred')} /> : field('disk_volume_type', {
                  rules: [{ validator: (_, selected, callback) => callback(
                    creationStorage.status === 'ready' && creationStorage.options.some(option => option.value === selected)
                      ? undefined : t('storageRequired')) }]
                })(<Select loading={creationStorage.status === 'loading'} disabled={creationStorage.status !== 'ready' || submitting}
                  placeholder={t(creationStorage.status === 'loading' ? 'creationStorageLoading' : 'storageRequired')}>
                  {creationStorage.options.map(option => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}
                </Select>)}
                {['empty', 'failed'].includes(creationStorage.status) && <div>
                  <Alert type={creationStorage.status === 'failed' ? 'error' : 'warning'} showIcon
                    message={t(creationStorage.status === 'failed' ? 'creationStorageFailed' : 'creationStorageEmpty')} />
                  <Button type="link" size="small" disabled={submitting} onClick={onRetryStorage}>{t('creationStorageRetry')}</Button>
                </div>}
              </Item>
              <Item {...FORM_ITEM_LAYOUT} label=" " colon={false}><span className={styles.hint}>{t('dataDiskAfterCreation')}</span></Item>
            </Card>
          </div>
          {step === 1 && <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('vmName')}>{source.name}</Descriptions.Item>
              <Descriptions.Item label={t('operatingSystem')}>{source.os || t('unknownSystem')}</Descriptions.Item>
              <Descriptions.Item label={t('systemSource')}>{t(`creationMethod.${source.sourceType}`)}{source.sourceName ? ` · ${source.sourceName}` : ''}</Descriptions.Item>
              <Descriptions.Item label={t('resources')}>{value('cpu')} {t('vcpuUnit')} / {value('memory')} GiB</Descriptions.Item>
              <Descriptions.Item label={t('systemDisk')}>{value('disk')} GiB · {storageSummary}</Descriptions.Item>
              <Descriptions.Item label={t('dataDisk')}>—</Descriptions.Item>
              <Descriptions.Item label={t('network')}>{t('defaultNetwork')}</Descriptions.Item>
            </Descriptions>
            {source.sshRequired && <Descriptions column={1} bordered size="small" className={styles.spaced}>
              <Descriptions.Item label={t('loginMethod')}>{t(source.loginMethod === 'password' ? 'loginMethodPassword' : 'loginMethodKey')}</Descriptions.Item>
              <Descriptions.Item label={t('sshUsername')}>{source.sshUsername}</Descriptions.Item>
              <Descriptions.Item label={t('quickStartFirmware')}>UEFI</Descriptions.Item>
            </Descriptions>}
            <Alert className={styles.spaced} showIcon type="info" message={source.isIso ? t('isoNext') : t('imageNext')}
              description={source.sshRequired ? t('quickStartReviewHelp') : !source.isIso ? t('cloudLoginBoundary') : undefined} />
            <section className={`${styles.formSection} ${styles.spaced}`}>
              <h2><HelpLabel label={t('networkAccess')} help="help.network" /></h2>
              <p className={styles.hint}>{t('defaultNetworkHelp')}</p>
              <p className={styles.hint}><strong>{t('networkInternalAccess')}</strong> {t('networkInternalAccessHelp')}</p>
              <p className={styles.hint}><strong>{t('networkExternalAccess')}</strong> {t('networkExternalAccessHelp')}</p>
              <p className={styles.hint}><strong>{t('networkConsoleLogin')}</strong> {t('networkConsoleLoginHelp')}</p>
              {source.sshRequired && <Alert type="info" showIcon message={t('quickStartInternalSsh')} description={t('quickStartPortBoundary')} />}
            </section>
          </div>}
        </Form>
        <div className={styles.formFooter}>
          <Button disabled={submitting} onClick={onCancel}>{t('abandonCreation')}</Button>
          <Button disabled={submitting} onClick={step === 0 ? onBackToSource : () => this.setState({ step: 0, validationError: '' })}>
            {t('previous')}
          </Button>
          {step === 0 ? <Button type="primary" disabled={submitting || !this.storageCanProceed()} onClick={this.next}>{t('next')}</Button>
            : <Button type="primary" loading={submitting} disabled={!this.storageCanProceed()} onClick={this.submit}>{t('createAndStart')}</Button>}
        </div>
      </div>
    );
  }
}

export default Form.create()(CreateVm);
