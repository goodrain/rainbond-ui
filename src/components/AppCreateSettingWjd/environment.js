import {
    Affix,
    Button,
    Card,
    Col,
    Form,
    Icon,
    Input,
    notification,
    Radio,
    Row,
    Table,
    Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import AddOrEditVolume from '../../components/AddOrEditVolume';
import AddPort from '../../components/AddPort';
import AddRelation from '../../components/AddRelation';
import AddRelationMnt from '../../components/AddRelationMnt';
import ConfirmModal from '../../components/ConfirmModal';
import EditPortAlias from '../../components/EditPortAlias';
import EnvironmentVariable from '../../components/EnvironmentVariable';
import NoPermTip from '../../components/NoPermTip';
import Port from '../../components/Port';
import ViewRelationInfo from '../../components/ViewRelationInfo';
import {
    addMnt,
    batchAddRelationedApp,
    getMnt,
    getRelationedApp,
    removeRelationedApp
} from '../../services/app';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import { getVolumeTypeShowName } from '../../utils/utils';
import CodeBuildConfig from '../CodeBuildConfig';
import styles from '../AppCreateSetting/setting.less';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;


// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class RenderProperty extends PureComponent {
    render() {
        const {
            appDetail,
            visible,
            componentPermissions: { isEnv, isRely, isStorage, isPort }
        } = this.props;
        return (
            <div
                style={{
                    display: visible ? 'block' : 'none'
                }}
            >

                {isEnv && (
                    <EnvironmentVariable
                        title="环境变量"
                        type="Inner"
                        appAlias={appDetail.service.service_alias}
                    />
                )}
            </div>
        );
    }
}
// eslint-disable-next-line react/no-multi-comp
@connect(
    ({ teamControl }) => ({
        currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
    }),
    null,
    null,
    {
        withRef: true
    }
)
export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            componentPermissions: this.handlePermissions('queryComponentInfo'),
            type: 'property'
        };
    }

    //环境
    handlePermissions = type => {
        const { currentTeamPermissionsInfo } = this.props;
        return roleUtil.querySpecifiedPermissionsInfo(
            currentTeamPermissionsInfo,
            type
        );
    };
    render() {
        const { appDetail } = this.props;
        const { type, componentPermissions } = this.state;

        return (
            <div>
                <div
                    style={{
                        overflow: 'hidden'
                    }}
                >

                    <div
                        className={styles.content}
                        style={{
                            overflow: 'hidden',
                            marginBottom: 90
                        }}
                    >

                        <RenderProperty
                            key={appDetail.service.extend_method}
                            appDetail={appDetail}
                            visible={type !== 'deploy'}
                            componentPermissions={componentPermissions}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
