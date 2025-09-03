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

    handleSubmit = () => {
        const { form, onSubmit } = this.props;
        const { basicInfoRef, backupConfigRef } = this.state;

        // 验证基础信息
        if (basicInfoRef) {
            basicInfoRef.handleSubmit();
        }

        // 验证备份配置
        if (backupConfigRef) {
            backupConfigRef.handleSubmit();
        }

        // 验证整个表单
        form.validateFields((err, values) => {
            if (!err && onSubmit) {
                // 合并所有配置数据
                const configData = {
                    ...values,
                    basicInfo: this.state.basicInfoData,
                    backupConfig: this.state.backupConfigData
                };
                onSubmit(configData);
            }
        });
    };

    handleBasicInfoSubmit = (basicInfoData) => {
        this.setState({ basicInfoData });
        console.log('基础信息配置:', basicInfoData);
    };

    handleBackupConfigSubmit = (backupData) => {
        this.setState({ backupConfigData: backupData });
        console.log('备份配置:', backupData);
    };

    render() {
        const { form, dbVersions = [], storageClasses = [], backupRepos = [] } = this.props;

        return (
            <div>
                {/* 基础信息配置组件 */}
                <BasicInfo
                    form={form}
                    dbVersions={dbVersions}
                    storageClasses={storageClasses}
                    onRef={this.onRefBasicInfo}
                    onSubmit={this.handleBasicInfoSubmit}
                />

                {/* 备份配置组件 */}
                <BackupConfig
                    form={form}
                    backupRepos={backupRepos}
                    onRef={this.onRefBackupConfig}
                    onSubmit={this.handleBackupConfigSubmit}
                />
            </div>
        );
    }
}

export default Index; 