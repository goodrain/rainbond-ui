//共同的信息
    //单位
    const unit = {
        'unit.entries':'个'
        
    }
    //弹框
    const popover = {
        // 弹框确定取消
        'popover.confirm':'确定',
        'popover.cancel':'取消',

        // 位置：企业视图>总览>加入团队
        'popover.enterpriseOverview.joinTeam.title':'加入团队',
        'popover.enterpriseOverview.joinTeam.label':'团队名称',
        'popover.enterpriseOverview.joinTeam.message':'请选择团队',
        'popover.enterpriseOverview.joinTeam.placeholder':'请选择一个团队',
        'popover.enterpriseOverview.joinTeam.hint':'暂无团队可以添加，可以先创建团队。',

        // 位置：企业视图>总览>创建团队
        'popover.enterpriseOverview.setUpTeam.title':'创建团队',
        // label
        'popover.enterpriseOverview.setUpTeam.label.name':'团队名称',
        'popover.enterpriseOverview.setUpTeam.label.englishName':'团队英文名称',
        'popover.enterpriseOverview.setUpTeam.label.colony':'集群',
        // placeholder
        'popover.enterpriseOverview.setUpTeam.placeholder.name':'请输入团队名称',
        'popover.enterpriseOverview.setUpTeam.placeholder.englishName':'团队的英文名称',
        'popover.enterpriseOverview.setUpTeam.placeholder.colony':'选择集群',
        // conformDesc
        'popover.enterpriseOverview.setUpTeam.conformDesc.name':'请输入创建的团队名称，最大长度10位',
        'popover.enterpriseOverview.setUpTeam.conformDesc.englishName':'对应该团队在集群使用的命名空间',
        'popover.enterpriseOverview.setUpTeam.conformDesc.colony':'请选择使用的集群',
        // message
        'popover.enterpriseOverview.setUpTeam.message.name':'请输入团队名称',
        'popover.enterpriseOverview.setUpTeam.message.englishName':'请输入团队英文名称',
        'popover.enterpriseOverview.setUpTeam.message.colony':'请选择集群',

        //位置：企业视图>应用市场>添加应用商店
        'popover.applicationMarket.addMarket.title':'添加应用商店',
        
    }
    const button = {
        'button.delete':'Delete',
        'button.edit':'Edit',
        'button.search':'Search'
    }
    const notification = {
        // 成功
        'notification.success.delete':'删除成功',
        'notification.success.setUp':'创建成功',
        'notification.success.edit':'编辑成功',
        // 失败

        // 警告
        'notification.warn.team':'请先加入团队！',
        'notification.warn.app':'请先创建应用！'
    }
    

export default Object.assign({}, unit, popover, button, notification);