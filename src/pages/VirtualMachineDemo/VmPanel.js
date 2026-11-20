import React, { PureComponent } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Descriptions,
  Empty,
  Icon,
  Input,
  Table,
  message
} from 'antd';
import { connectionAddress, instanceAddress } from './state';
import { t } from './messages';
import styles from './index.less';
import HelpLabel from './HelpLabel';

const D = Descriptions.Item;
const stateText = (vm) => t(vm.status === 'install' ? 'poweredOn' : `status.${vm.status}`);

export default class VmPanel extends PureComponent {
  state = { script: this.props.vm.initScript || '' };
  action = (type, values = {}) =>
    this.props.onAction({ type, id: this.props.vm.id, values });

  renderOverview() {
    const { vm, data, onTab, onRun } = this.props;
    const diag = vm.diagnostic;
    return (
      <>
        {diag && (
          <Alert
            type={diag.severity}
            showIcon
            message={t(`diagnostic.${vm.scenario}`)}
            description={
              <>
                <p>
                  {t('elapsed')}：{diag.elapsed}
                </p>
                <p>{diag.detail}</p>
                {vm.scenario === 'capacity' && (
                  <p>
                    {t('requested')}: {vm.cpu} CPU / {vm.memory} GiB ·{' '}
                    {t('available')}: 2 CPU / 4 GiB
                  </p>
                )}
                <Button
                  size="small"
                  onClick={() => message.info(t('retryUnchanged'))}
                >
                  {t('retry')}
                </Button>
              </>
            }
          />
        )}
        <dl className={styles.overviewResources}>
          <div><dt><HelpLabel label={t('powerState')} help="help.power" /></dt><dd><Badge status={vm.status === 'running' ? 'success' : 'default'} text={stateText(vm)} /></dd></div>
          <div><dt><HelpLabel label={t('cpu')} help="help.cpu" /></dt><dd>{vm.cpu} {t('cores')}</dd></div>
          <div><dt><HelpLabel label={t('memory')} help="help.memory" /></dt><dd>{vm.memory} GiB</dd></div>
          <div><dt><HelpLabel label={t('systemDisk')} help="help.systemDisk" /></dt><dd>{vm.disk} GiB</dd></div>
        </dl>
        <div className={styles.columns}>
          <Card title={t('vmState')} size="small">
            <Descriptions column={1} size="small">
              <D label={<HelpLabel label={t('guestState')} help="help.power" />}>
                {t(
                  vm.status === 'stopped'
                    ? 'guestStopped'
                    : vm.status === 'paused'
                    ? 'guestPaused'
                    : vm.status === 'waiting'
                    ? 'guestWaiting'
                    : vm.scenario === 'bootError'
                    ? 'guestFailed'
                    : vm.iso
                    ? 'guestInstalling'
                    : vm.agent && (!diag || diag.networkOnly)
                    ? 'guestReady'
                    : 'guestStarting'
                )}
              </D>
              <D label={<HelpLabel label={t('guestTools')} help="help.guestTools" />}>
                {t(
                  vm.agent &&
                    vm.status === 'running' &&
                    (!diag || diag.networkOnly)
                    ? 'connected'
                    : 'notConnected'
                )}
              </D>
              <D label={t('operatingSystem')}>{vm.os.replace(/\s*[（(](演示|demo)[）)]/gi, '')}</D>
            </Descriptions>
          </Card>
          <Card title={t('connectVm')} size="small">
            <Descriptions column={1} size="small">
              <D label={<HelpLabel label={t('network')} help="help.network" />}>
                {t(
                  vm.network === 'business'
                    ? 'businessNetwork'
                    : 'defaultNetwork'
                )}
              </D>
              <D label={t('recommendedAccess')}>
                {t(
                  vm.network === 'business' ? 'directAccess' : 'consoleAccess'
                )}
              </D>
              <D label={<HelpLabel label={t('serviceAddress')} help="help.serviceAddress" />}>{`10.43.0.${
                41 +
                data.components
                  .filter((c) => c.kind === 'vm')
                  .findIndex((c) => c.id === vm.id)
              }`}</D>
              <D label={<HelpLabel label={t('externalAccess')} help="help.externalAccess" />}>
                {vm.network === 'business'
                  ? connectionAddress(data, vm) || t('waitingAddress')
                  : t(vm.external ? 'enabled' : 'notEnabled')}
              </D>
            </Descriptions>
            <div className={styles.actions}>
              {!vm.iso && <Button type="primary" onClick={() => onTab('console')}>
                {t('openConsole')}
              </Button>}
              <Button onClick={() => onTab('network')}>{t('network')}</Button>
            </div>
          </Card>
        </div>
        <Card title={t('activity')} size="small">
          <Table
            size="small"
            rowKey={(_, i) => String(i)}
            pagination={false}
            dataSource={vm.logs}
            columns={[
              {
                title: t('operation'),
                dataIndex: 'operation',
                render: (value) => t(`action.${value}`)
              },
              { title: t('time'), dataIndex: 'time' }
            ]}
            locale={{ emptyText: t('noActivity') }}
          />
        </Card>
      </>
    );
  }

  renderHardware() {
    const { vm } = this.props;
    return (
      <>
        <Card
          title={<HelpLabel label={t('compute')} help="help.compute" />}
          size="small"
          extra={
            <Button size="small" onClick={() => this.action('hardware')}>
              {t('edit')}
            </Button>
          }
        >
          <Descriptions column={2}>
            <D label={<HelpLabel label={t('cpu')} help="help.cpu" />}>{vm.cpu}</D>
            <D label={<HelpLabel label={t('memory')} help="help.memory" />}>{vm.memory} GiB</D>
          </Descriptions>
        </Card>
        <Card
          title={<HelpLabel label={t('disks')} help="help.diskActions" />}
          size="small"
          extra={
            <Button size="small" onClick={() => this.action('addDisk')}>
              {t('addDataDisk')}
            </Button>
          }
        >
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={[
              {
                id: 'system',
                name: t('systemDisk'),
                size: vm.disk,
                attached: true,
                system: true
              },
              ...vm.disks
            ]}
            columns={[
              {
                title: t('name'),
                dataIndex: 'name',
                render: (name, d) => (
                  <>
                    <HelpLabel label={name} help={d.system ? 'help.systemDisk' : 'help.dataDisk'} />
                    <div className={styles.hint}>
                      {t('persistent')}
                      {d.system && ` · ${t('bootFirst')}`}
                    </div>
                  </>
                )
              },
              {
                title: t('capacity'),
                dataIndex: 'size',
                render: (size) => `${size} GiB`
              },
              {
                title: t('state'),
                dataIndex: 'attached',
                render: (attached) => t(attached ? 'attached' : 'detached')
              },
              {
                title: t('operation'),
                render: (_, disk) =>
                  disk.system ? (
                    <span className={styles.hint}>{t('protectedDisk')}</span>
                  ) : disk.attached ? (
                    <Button
                      type="link"
                      onClick={() => this.action('detach', { diskId: disk.id })}
                    >
                      {t('detach')}
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="link"
                        onClick={() =>
                          this.props.onRun({
                            type: 'attach',
                            id: vm.id,
                            values: { diskId: disk.id }
                          })
                        }
                      >
                        {t('attach')}
                      </Button>
                      <Button
                        type="link"
                        onClick={() =>
                          this.action('deleteDisk', { diskId: disk.id })
                        }
                      >
                        {t('deleteData')}
                      </Button>
                    </>
                  )
              }
            ]}
          />
          <p className={styles.hint}>{t('capacityHelp')}</p>
          <Button size="small" disabled>
            {t('expandDisk')}
          </Button>
          <span className={styles.hint}>　{t('expandUnavailable')}</span>
          {(vm.retiredVolumes || []).map((d) => (
            <Alert
              className={styles.spaced}
              key={d.id}
              type="warning"
              showIcon
              message={`${d.name} · ${t('reclaimPending')}`}
              description={t('reclaimHelp')}
            />
          ))}
        </Card>
        <Card title={t('installationMedia')} size="small">
          <Descriptions column={1}>
            <D label={t('installationMedia')}>
              {vm.iso ? vm.os : t('notMounted')}
            </D>
            <D label={t('bootOrder')}>
              {vm.iso
                ? `${t('installationMedia')} → ${t('systemDisk')}`
                : t('systemDisk')}
            </D>
            <D label={<HelpLabel label={t('imageFormat')} help="help.imageFormat" />}>
              {[vm.iso ? 'ISO' : vm.source?.format, vm.source?.architecture, vm.source?.firmware].filter(Boolean).join(' / ') || t('unknownMedia')}
            </D>
          </Descriptions>
          {vm.iso && (
            <Button onClick={() => this.action('finish')}>
              {t('finishInstall')}
            </Button>
          )}
        </Card>
      </>
    );
  }

  renderNetwork() {
    const { vm, data } = this.props;
    const service = `10.43.0.${
      41 +
      data.components
        .filter((c) => c.kind === 'vm')
        .findIndex((c) => c.id === vm.id)
    }`;
    return (
      <Card
        title={t('nic')}
        size="small"
      >
        <Descriptions column={1} size="small">
          <D label={<HelpLabel label={t('connectedNetwork')} help="help.network" />}>
            {t(
              vm.network === 'business' ? 'businessNetwork' : 'defaultNetwork'
            )}
          </D>
          <D label={<HelpLabel label={t('guestIp')} help="help.guestIp" />}>
            {connectionAddress(data, vm, true) || t('waitingAddress')}
          </D>
          <D label={<HelpLabel label={t('instanceIp')} help="help.instanceIp" />}>
            {instanceAddress(data, vm)}
            <div className={styles.hint}>{t('instanceIpHelp')}</div>
          </D>
          <D label={<HelpLabel label={t('serviceAddress')} help="help.serviceAddress" />}>
            <strong>{service}</strong>
            <div className={styles.hint}>{t('serviceHelp')}</div>
          </D>
          <D label={t('internalPorts')}>
            {vm.os.includes('Windows') ? '3389 / TCP' : '22 / TCP'}
            {vm.integration ? `、${vm.integration.port} / TCP` : ''}
          </D>
          <D label={<HelpLabel label={t('externalAccess')} help="help.externalAccess" />}>
            {vm.network === 'business' ? (
              <>
                {connectionAddress(data, vm)} · {t('directAccess')}
              </>
            ) : vm.external ? (
              connectionAddress(data, vm)
            ) : (
              t('notEnabled')
            )}
          </D>
        </Descriptions>
        {vm.scenario === 'networkPartial' && (
          <Alert
            type="warning"
            showIcon
            message={t('diagnostic.networkPartial')}
            description={vm.diagnostic?.detail}
          />
        )}
        <Alert
          className={styles.spaced}
          type="info"
          showIcon
          message={t('networkAddressHelp')}
        />
        {vm.network === 'default' && (
          <Button
            className={styles.spaced}
            onClick={() => this.action('external', { enabled: !vm.external })}
          >
            {t(vm.external ? 'disableExternal' : 'enableExternal')}
          </Button>
        )}
        <p className={styles.hint}>{t('networkIntegrationAdvanced')}</p>
      </Card>
    );
  }

  renderSnapshots() {
    const { vm } = this.props;
    return (
      <Card
        title={<HelpLabel label={t('snapshotTitle')} help="help.snapshots" />}
        size="small"
        extra={
          <Button
            type="primary"
            disabled={vm.storage !== 'standard'}
            onClick={() => this.action('snapshot')}
          >
            {t('createSnapshot')}
          </Button>
        }
      >
        <Alert
          showIcon
          type={vm.storage === 'standard' ? 'info' : 'warning'}
          message={t(
            vm.storage === 'standard' ? 'snapshotHelp' : 'snapshotUnavailable'
          )}
        />
        <Table
          className={styles.spaced}
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={vm.snapshots}
          columns={[
            { title: t('name'), dataIndex: 'name' },
            {
              title: t('snapshotContents'),
              render: (_, s) => (
                <>
                  {t('systemDisk')} {s.config.disk} GiB
                  {s.config.disks.map((d) => (
                    <div key={d.id} className={styles.hint}>
                      {d.name} {d.size} GiB
                    </div>
                  ))}
                </>
              )
            },
            {
              title: <HelpLabel label={t('snapshotMode')} help="help.snapshotMode" />,
              dataIndex: 'mode',
              render: (mode) =>
                t(mode === 'online' ? 'onlineSnapshot' : 'offlineSnapshot')
            },
            {
              title: t('operation'),
              render: (_, s) => (
                <Button
                  type="link"
                  onClick={() => this.action('restore', { snapshotId: s.id })}
                >
                  {t('restore')}
                </Button>
              )
            }
          ]}
          locale={{ emptyText: t('noSnapshots') }}
        />
      </Card>
    );
  }

  renderAdvanced() {
    const { vm, onRun } = this.props;
    return (
      <Collapse defaultActiveKey={['integration']}>
        <Collapse.Panel header={<HelpLabel label={t('containerIntegration')} help="help.integration" />} key="integration">
          <p>{t('integrationHelp')}</p>
          {vm.integration && (
            <Alert
              showIcon
              type="success"
              message={`${vm.id}-service:${vm.integration.port}`}
            />
          )}
          <div className={styles.actions}>
            <Button
              onClick={() => this.action('integration', { enabled: true })}
            >
              {t('configureIntegration')}
            </Button>
            {vm.integration && (
              <Button
                onClick={() =>
                  onRun({
                    type: 'integration',
                    id: vm.id,
                    values: { enabled: false }
                  })
                }
              >
                {t('removeIntegration')}
              </Button>
            )}
          </div>
        </Collapse.Panel>
        <Collapse.Panel header={<HelpLabel label={t('initialization')} help="help.initialization" />} key="initialization">
          <p className={styles.hint}>{t('initializationHelp')}</p>
          <Input.TextArea
            value={this.state.script}
            onChange={(event) => this.setState({ script: event.target.value })}
            rows={5}
          />
          <Button
            className={styles.spaced}
            onClick={() =>
              onRun({
                type: 'initialization',
                id: vm.id,
                values: { script: this.state.script }
              })
            }
          >
            {t('save')}
          </Button>
        </Collapse.Panel>
        <Collapse.Panel header={t('schedulingDevices')} key="devices">
          <Alert type="info" showIcon message={t('advancedRequirements')} />
        </Collapse.Panel>
      </Collapse>
    );
  }

  renderActiveTab() {
    const { vm, tab, monitorContent } = this.props;
    if (tab === 'hardware') return this.renderHardware();
    if (tab === 'network') return this.renderNetwork();
    if (tab === 'snapshots') return this.renderSnapshots();
    if (tab === 'advanced') return this.renderAdvanced();
    if (tab === 'rainbond-vm') return monitorContent;
    if (tab === 'console') return (
            <Card title={t('console')} size="small" extra={!vm.iso && <Button size="small" onClick={() => message.info(t('consoleUnavailableReason'))}>{t('reconnect')}</Button>}>
              <div className={styles.console}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  imageStyle={{ height: 32 }}
                  description={<div className={styles.consoleEmptyText}>
                    <strong>{t('consoleDemo')}</strong>
                    <p>{t(vm.status === 'stopped' ? 'consoleStoppedReason' : vm.status === 'waiting' ? 'consoleWaitingReason' : vm.status === 'paused' ? 'consolePausedReason' : 'consoleUnavailableReason')}</p>
                  </div>}
                />
              </div>
            </Card>
    );
    return this.renderOverview();
  }

  render() {
    const { vm, tab, onTab } = this.props;
    return (
      <>
        {vm.iso && (
          <section className={styles.installationStatus} aria-label={t('installationStatus')}>
            <Icon type="info-circle" />
            <div className={styles.installationText}>
              <strong>{t('installationWaiting')}</strong>
              <p>{t('installationSteps')}</p>
            </div>
            <div className={styles.actions}>
              <Button type="primary" onClick={() => tab === 'console' ? message.info(t('consoleUnavailableReason')) : onTab('console')}>{t('openConsole')}</Button>
              <Button onClick={() => this.action('finish')}>{t('finishInstall')}</Button>
            </div>
          </section>
        )}
        {vm.status === 'paused' && (
          <Alert type="warning" showIcon message={t('pauseHelp')} />
        )}
        {vm.pending && (
          <Alert
            className={styles.pendingNotice}
            type="warning"
            showIcon
            message={
              <>
                {t(vm.status === 'stopped' ? 'nextStart' : 'restartRequired')}{' '}
                {vm.pending.cpu && `${t('cpu')}: ${vm.pending.cpu} `}
                {vm.pending.memory &&
                  `${t('memory')}: ${vm.pending.memory} GiB `}
                {vm.pending.network &&
                  t(
                    vm.pending.network === 'business'
                      ? 'businessNetwork'
                      : 'defaultNetwork'
                  )}
              </>
            }
          />
        )}
        {this.renderActiveTab()}
      </>
    );
  }
}
