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
        'button.delete':'删除',
        'button.edit':'编辑',
        'button.search':'搜索'
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
    const placeholder = {
        'placeholder.appName':'请选择要所属应用',
        'placeholder.service_cname':'请为创建的组件起个名字吧',
        'placeholder.k8s_component_name':'请输入组件的英文名称',
        'placeholder.git_url':'请输入仓库地址',
        'placeholder.code_version':'请输入代码版本',
        'placeholder.notGit_url':'仓库地址不合法',
        'placeholder.subdirectories':'请输入子目录路径',
        'placeholder.password_1':'请输入仓库密码',
        'placeholder.username_1':'请输入仓库用户名',
        'placeholder.select':'请选择',
        'placeholder.max24':'最大长度24位',
        'placeholder.docker_cmdMsg':'请输入镜像名称',
        'placeholder.docker_cmd':'请输入镜像名称, 如 nginx : 1.11',
        'placeholder.dockerRunMsg':'输入DockerRun命令',
        'placeholder.dockerRun':'例如： docker run -d -p 8080:8080 -e PWD=1qa2ws --name=tomcat_demo tomcat',
        'placeholder.yaml_content':'请输入DockerCompose配置内容',
        'placeholder.user_name':'请输入仓库用户名',
        'placeholder.password':'请输入仓库密码',
        'placeholder.group_name':'请输入应用名称',
        'placeholder.component_cname':'请输入组件名称',
        'placeholder.endpoints':'请选择endpoints类型!',
        'placeholder.componentAddress':'请输入组件地址',
        'placeholder.nameSpaceMsg':'请输入Namesapce',
        'placeholder.nameSpace':'留空则默认为当前团队所在Namesapce',
        'placeholder.serviceName':'请输入服务名',
        'placeholder.attrName':'请输入正确的地址',
        'placeholder.notAttrName':'组件地址不能相同',
        'placeholder.nameSpaceReg':'只支持小写字母、数字或“-”，并且必须以字母开始、以数字或字母结尾',
        'placeholder.max32':'不能大于32个字符',
        'placeholder.nonsupport':'不支持{ nonsupport }',
        'placeholder.nonsupport.regAddress':'地址',
        'placeholder.roleName':'请输入角色名称',
        'placeholder.permissions':'权限分配!',
        'placeholder.nonsupport.regLoopBack':'环回接口地址',
    }
    

export default Object.assign({}, unit, popover, button, notification, placeholder);