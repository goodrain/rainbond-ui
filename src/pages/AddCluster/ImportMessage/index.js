/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Input, Row, Steps, Select, Collapse, Icon, Checkbox, Tooltip, Empty, Spin } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import router from 'umi/router';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import Message from './message';
import styles from './index.less';
const { Panel } = Collapse;
const { Option, OptGroup } = Select;
@Form.create()
@connect(({ user, list, loading, global, index, region }) => ({
    user: user.currentUser,
    list,
    loading: loading.models.list,
    rainbondInfo: global.rainbondInfo,
    enterprise: global.enterprise,
    isRegist: global.isRegist,
    oauthLongin: loading.effects['global/creatOauth'],
    overviewInfo: index.overviewInfo,
    baseConfiguration: region.base_configuration
}))
export default class ImportMessage extends PureComponent {
    constructor(props) {
        super(props);
        const { user } = this.props;
        const adminer = userUtil.isCompanyAdmin(user);
        this.state = {
            adminer,
            nameSpaceArr: [],
            resourceData: {},
            resourceDataIndex:[],
            namespace: '',
            loadingSwitch: true,
        };
    }
    componentWillMount() {
        const { adminer } = this.state;
        const { dispatch } = this.props;
        if (!adminer) {
            dispatch(routerRedux.push(`/`));
        }
    }
    render() {
        const {
            match: {
                params: { eid }
            },
        } = this.props;
        const { nameSpaceArr, resourceData, loadingSwitch, resourceDataIndex, namespace} = this.state
        return (
            <PageHeaderLayout
                title={formatMessage({id:'enterpriseColony.import.title'})}
            >
                <Message />
            </PageHeaderLayout>
        );
    }
}

