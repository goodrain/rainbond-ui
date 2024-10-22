import React, { Component } from 'react'
import { Avatar, Button, Card, notification } from 'antd';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import Result from '../Result'
import ConfirmModal from '../ConfirmModal'
import styles from './index.less'


@connect(({ user, loading }) => ({
    currUser: user.currentUser,
    Loading: loading.effects['global/joinTeam']
}))
export default class AppJoinTeam extends Component {
    constructor(props) {
        super(props)
        this.state = {
            teams: [],
            joinList: false,
            isPass: false,
            isModal: false,
            teamName: '',
            teamOwnerName: '',
            teamAlias: ''
        }
    }
    componentDidMount() {
        this.loadTeams()
        this.getCheckJoinTame()
    }
    // 获取可以申请的团队
    loadTeams = () => {
        const { enterpriseID, dispatch } = this.props;
        dispatch({
            type: 'global/getUserCanJoinTeams',
            payload: {
                enterpriseID
            },
            callback: data => {
                if (data) {
                    this.setState({ teams: data.list });
                }
            }
        });
    };
    // 检测申请状态
    getCheckJoinTame = () => {
        const { enterpriseID, dispatch, currUser, setTimer } = this.props;
        dispatch({
            type: 'global/getJoinTeams',
            payload: {
                user_id: currUser.user_id
            },
            callback: data => {
                if (data.list.length > 0) {
                    data.list.map((item)=>{
                        if(item.is_pass != '2'){
                            this.setState({
                                joinList: item,
                                isPass: item.is_pass,
                                teamOwnerName: item.team_owner,
                                teamAlias: item.team_alias,
                                teamName: item.team_name
                            })
                        }else {
                            this.setState({
                                joinList: false,
                                isPass: false
                            })
                        }
                    })
                    setTimer()
                }
            }
        });
    };
    // 申请加入团队
    handleClickJoinTeam = () => {
        const { enterpriseID, dispatch } = this.props;
        const { teamName } = this.state
        dispatch({
            type: 'global/joinTeam',
            payload: {
                team_name: teamName
            },
            callback: data => {
                this.getCheckJoinTame()
                this.handleCloseModal()
                notification.success({ message: '申请成功，等待团队管理员审核！' });
            }
        });
    }
    handleOpenModal = (team_name) => {
        this.setState({
            isModal: true,
            teamName: team_name
        })
    }
    handleCloseModal = () => {
        this.setState({
            isModal: false
        })
    }

    // 取消申请
    handleDelete = () => {
        const { enterpriseID, dispatch, currUser } = this.props;
        const { isPass, teamName } = this.state
        dispatch({
            type: 'global/deleteJoinTeams',
            payload: {
                is_pass: isPass,
                team_name: teamName,
                user_id: currUser.user_id
            },
            callback: data => {
                this.loadTeams()
                if (data.list.length > 0) {
                    this.setState({
                        joinList: data.list,
                        isPass: data.list[0].is_pass,
                    })
                } else {
                    this.setState({
                        joinList: false,
                        isPass: false
                    })
                }
            }
        });
    }
    render() {
        const { teams, joinList, isPass, isModal, teamOwnerName, teamAlias } = this.state
        const colorList = ['#6d60e7', '#55b563', '#ebaa44', '#e86f2c', '#00a2ae'];
        return (
            <div className={styles.teamList}>
                <h2>申请加入团队</h2>
                <div className={styles.desc}>选择下面的团队申请加入，申请之后需要等待团队管理员审批。</div>
                {joinList && isPass == '0' ? (
                    <Card style={{ marginTop: 20, minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Result
                            type="ing"
                            title={`等待团队管理员审批`}
                            extra={`如果长时间没有通过，可以联系 ${teamAlias} 团队负责人 ${teamOwnerName}进行审批`}
                            description={`团队管理员审批通过之后会自动跳转到工作空间`}
                            actions={
                                <>
                                    <Button type="primary" onClick={this.handleDelete}>取消申请</Button>
                                </>
                            }
                            style={{
                                marginTop: 48,
                                marginBottom: 16
                            }}
                        />
                    </Card>
                ) : (
                    <div className={styles.teamContent}>
                        {teams.length > 0 && teams.map((item, index) => {
                            const { team_logo, team_alias, team_name, team_id, team_owner_name } = item
                            const colorIndex = teams && teams.length > 0 && teams.length - index - 1
                            return (
                                <div onClick={() => this.handleOpenModal(team_name)}>
                                    <div className={styles.list_img}>
                                        {team_logo ?
                                            <img src={team_logo} alt="" />
                                            :
                                            <Avatar
                                                style=
                                                {{
                                                    backgroundColor: colorIndex >= 5 ? colorList[colorIndex % 5] : colorList[colorIndex],
                                                    verticalAlign: 'middle'
                                                }}
                                                size={60}
                                                shape="square">
                                                <span
                                                    style=
                                                    {{
                                                        color: '#fff',
                                                        fontSize: 35,
                                                        textTransform: 'uppercase'
                                                    }}
                                                >
                                                    {team_alias.substr(0, 1)}
                                                </span>
                                            </Avatar>
                                        }
                                    </div>
                                    <div className={styles.team_name}>
                                        <div className={styles.name}> {team_alias} </div>
                                        <div className={styles.author}> 负责人：{team_owner_name} </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
    
                {isModal && 
                    <ConfirmModal
                        title={'申请加入团队'}
                        desc={'你确定要申请加入此团队吗？'}
                        onOk={this.handleClickJoinTeam}
                        onCancel={this.handleCloseModal}
                    />
                }
            </div>
        )
    }
}
