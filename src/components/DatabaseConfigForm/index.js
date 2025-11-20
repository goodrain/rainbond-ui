import React, { PureComponent } from 'react';
import { Form } from 'antd';
import BasicInfo from '../DatabaseBasicInfo';
import BackupConfig from '../DatabaseBackupConfig';

@Form.create()
class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            basicInfoRef: null,
            backupConfigRef: null
        };
    }

    componentDidMount() {
        const { onRef } = this.props;
        if (onRef) {
            onRef(this);
        }
    }

    onRefBasicInfo = (ref) => {
        this.setState({ basicInfoRef: ref });
    };

    onRefBackupConfig = (ref) => {
        this.setState({ backupConfigRef: ref });
    };

    // 检查当前数据库类型是否支持备份
    checkDatabaseBackupSupport = () => {
        const { databaseTypes = [], databaseType } = this.props;

        if (!databaseType) {
            return false;
        }

        const currentDbConfig = databaseTypes.find(
            dbType => String(dbType.type) === String(databaseType)
        );

        if (!currentDbConfig) {
            return false;
        }

        return currentDbConfig.support_backup === true;
    };

    handleSubmit = () => {
        const { form, onSubmit } = this.props;
        const { basicInfoRef, backupConfigRef } = this.state;
        const supportsBackup = this.checkDatabaseBackupSupport();

        // 验证基础信息
        if (basicInfoRef) {
            basicInfoRef.handleSubmit();
        }

        // 只在支持备份时才验证备份配置
        if (supportsBackup && backupConfigRef) {
            backupConfigRef.handleSubmit();
        }

        // 验证整个表单
        form.validateFields((err, values) => {
            if (!err && onSubmit) {
                // 合并所有配置数据
                const configData = {
                    ...values,
                    basicInfo: this.state.basicInfoData,
                    // 只在支持备份时才包含备份配置
                    ...(supportsBackup && { backupConfig: this.state.backupConfigData })
                };
                onSubmit(configData);
            }
        });
    };

    handleBasicInfoSubmit = (basicInfoData) => {
        this.setState({ basicInfoData });
    };

    handleBackupConfigSubmit = (backupData) => {
        this.setState({ backupConfigData: backupData });
    };

    render() {
        const { form, dbVersions = [], storageClasses = [], backupRepos = [], databaseType } = this.props;
        const supportsBackup = this.checkDatabaseBackupSupport();

        return (
            <div>
                {/* 基础信息配置组件 */}
                <BasicInfo
                    form={form}
                    dbVersions={dbVersions}
                    storageClasses={storageClasses}
                    databaseType={databaseType}
                    onRef={this.onRefBasicInfo}
                    onSubmit={this.handleBasicInfoSubmit}
                />

                {/* 只在支持备份时才显示备份配置组件 */}
                {supportsBackup && (
                    <BackupConfig
                        form={form}
                        backupRepos={backupRepos}
                        onRef={this.onRefBackupConfig}
                        onSubmit={this.handleBackupConfigSubmit}
                    />
                )}
            </div>
        );
    }
}

export default Index; 