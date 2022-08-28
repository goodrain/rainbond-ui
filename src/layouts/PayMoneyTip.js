import React, {Fragment} from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../utils/global';
import {Layout, Icon, message, notification, Modal, Button} from 'antd';

//提示充值
export default class PayMoneyTip extends React.PureComponent {
    handleCancel = () => {
        this.props.dispatch({
            type: 'global/hideNoMoneyTip'
        })
    }
    handleClick = () => {
        window.open('https://www.goodrain.com/spa/#/personalCenter/my/recharge')
        this.handleCancel();
    }
    getRegionId = () => {
        var regionName = globalUtil.getCurrRegionName();
        let regionId = '';
        if(regionName == 'ali-hz') {
        regionId = 2;
        }
        if(regionName == 'ali-sh'){
        regionId = 1;
        }
        return regionId;
    }
    handleBuySource = () => {
        const regionId = this.getRegionId();
        if(regionId){
            window.open(`https://www.goodrain.com/spa/#/resBuy/${regionId}`)
        }else{
            notification.warning({message: formatMessage({id:'notification.warn.purchase'})})
        }
        this.handleCancel();
    }
    componentDidMount(){
    }
    render(){
        const regionId = this.getRegionId();
        return <Modal
            visible={true}
            title="提示"
            onCancel={this.handleCancel}
            footer={[<Button onClick={this.handleClick} size="sm">去充值</Button>]}
        >
             <h4 style={{textAlign: 'center'}}>企业账户余额不足</h4>
        </Modal>;
    }
}
