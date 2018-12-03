/*
   应用版本管理
*/
import React, { PureComponent, Fragment } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { Link, Switch, Route } from 'dva/router';
import { Row, Col, Card, Form, Button, Popconfirm, Icon, Menu, Input,  Dropdown, Table, Modal, notification} from 'antd';
import { getRelationedApp , getUnRelationedApp, addRelationedApp, removeRelationedApp } from '../../services/app';
import globalUtil from '../../utils/global';

@connect()
export default class Index extends PureComponent {
   constructor(props){
     super(props);
     this.state = {
       selectedRowKeys:[],
       list:[],
      page_num:1,
      page_size:10,
      total:'',
      loading:true
     }
   }
   componentDidMount(){
     this.getVersionList();
   }
   handleRolback = (data) => {
      this.props.onRollback && this.props.onRollback(data.build_version);

   }
   getVersionList = () => {
     const {page_num,page_size} = this.state
       this.props.dispatch({
           type: 'appControl/getAppVersionList',
           payload: {
               team_name: this.props.team_name,
               service_alias: this.props.service_alias,
               page_num,
               page_size
           },
           callback:(data) => {
                this.setState({
                  list: data.list || [],
                  loading:false,
                  total:data.bean.total
                })
           }
       })
   }
   handleCancel = () => {
     this.props.onCancel && this.props.onCancel();
   }
   handleDel = (data) => {
    this.props.dispatch({
        type: 'appControl/delAppVersion',
        payload: {
            team_name: this.props.team_name,
            service_alias: this.props.service_alias,
            version_id: data.build_version
        },
        callback:(data) => {
            notification.success({
                message: '删除成功'
            })
            this.getVersionList();
        }
    })
   }
   onPageChange = (page_num) => {
        this.setState({ page_num, loading: true }, () => {
            this.getVersionList();
        })
}
   render(){
    const {total,page_num,page_size} = this.state;
      return (
        <Modal
        title="版本管理"
        width={1200}
        visible={true}
        onCancel={this.handleCancel}
        footer={[
            <Button onClick={this.handleCancel}>关闭</Button>
        ]}
        >
        <Table
          // pagination = {false}
          loading={this.loading}
          pagination={{ total: total, page_num: page_num, pageSize: page_size, onChange: this.onPageChange, current: page_num, }}
          dataSource={this.state.list || []}
          columns={[{
            title: '版本',
            dataIndex: 'build_version',
            width: 120
          },{
            title: '构建人',
            dataIndex: 'build_user',
            width: 100
          },{
            title: '构建时间',
            dataIndex: 'create_time',
            width: 100
          },{
            title: '构建类型',
            dataIndex: 'kind',
            width: 100
          },{
            title: '提交信息',
            dataIndex: 'commit_msg',
            width: 150
          },{
            title: '镜像/源码地址',
            dataIndex: 'repo_url',
            width: 100,
            render: (v, data) => {
                return data.repo_url || data.image_url
            }
          },{
            title: '构建状态',
            dataIndex: 'status',
            width: 100,
            render: (v) => {
                 var map = {
                     'success': '成功',
                     'failed': '失败',
                     'timeout': '超时'
                 }
                 return map[v] || v;
            }
          },{
            title: '操作',
            dataIndex: 'group_name',
            width: 100,
            render: (v, data) => {
                return <Fragment>
                    <a href="javascript:;" onClick={()=>{this.handleRolback(data)}}>回滚</a>
                    <Popconfirm title="确定要删除此版本吗?" onConfirm={()=>{this.handleDel(data)}}>
                    <a href="javascript:;">删除</a>
                    </Popconfirm>
                </Fragment>
            }
          }]}
         />
         </Modal>
      )
   }
}