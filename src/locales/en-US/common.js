//共同的信息
    //单位
    const unit = {
        'unit.entries':'a'
    }
    //弹框
    const popover = {
        // 弹框确定取消
        'popover.confirm':'OK',
        'popover.cancel':'Cancel',

        // 位置：企业视图>总览>加入团队
        'popover.enterpriseOverview.joinTeam.title':'Add team',
        'popover.enterpriseOverview.joinTeam.label':'Team name',
        'popover.enterpriseOverview.joinTeam.message':'Please select team',
        'popover.enterpriseOverview.joinTeam.placeholder':'Please select a team',
        'popover.enterpriseOverview.joinTeam.hint':'No team can be added. You can create a team first.',

        // 位置：企业视图>总览>创建团队
        'popover.enterpriseOverview.setUpTeam.title':'Create team',
        // label
        'popover.enterpriseOverview.setUpTeam.label.name':'Team name',
        'popover.enterpriseOverview.setUpTeam.label.englishName':'English team name',
        'popover.enterpriseOverview.setUpTeam.label.colony':'Cluster',
        // placeholder
        'popover.enterpriseOverview.setUpTeam.placeholder.name':'Please enter the team name',
        'popover.enterpriseOverview.setUpTeam.placeholder.englishName':'The English name of the team',
        'popover.enterpriseOverview.setUpTeam.placeholder.colony':'Select the cluster',
        // conformDesc
        'popover.enterpriseOverview.setUpTeam.conformDesc.name':'Please enter the name of the team to be created. The maximum length is 10 characters',
        'popover.enterpriseOverview.setUpTeam.conformDesc.englishName':'The namespace used by the team in the cluster',
        'popover.enterpriseOverview.setUpTeam.conformDesc.colony':'Select a use cluster',
        // message
        'popover.enterpriseOverview.setUpTeam.message.name':'Please enter the team name',
        'popover.enterpriseOverview.setUpTeam.message.englishName':'Please enter the English name of the team',
        'popover.enterpriseOverview.setUpTeam.message.colony':'Please select a cluster',

        //位置：企业视图>应用市场>添加应用商店
        'popover.applicationMarket.addMarket.title':'Add an App Store',
        
    }
    const button = {
        'button.delete':'Delete',
        'button.edit':'Edit',
        'button.search':'Search'
    }
    const notification = {
        // 成功
        'notification.success.delete':'Delete success',
        'notification.success.setUp':'Create success',
        'notification.success.edit':'Edit success',
        // 失败

        // 警告
        'notification.warn.team':'Please join the team first!',
        'notification.warn.app':'Create the app first!'
    }
    const placeholder = {
        'placeholder.appName':'Select an application to which you want to apply',
        'placeholder.service_cname':'Give the component a name',
        'placeholder.k8s_component_name':'Please enter the English name of the component',
        'placeholder.git_url':'Please enter the warehouse address',
        'placeholder.code_version':'Please enter the code version',
        'placeholder.notGit_url':'The warehouse address is invalid',
        'placeholder.subdirectories':'Please enter a subdirectory path',
        'placeholder.password_1':'Please enter the warehouse password',
        'placeholder.username_1':'Please enter a warehouse user name',
        'placeholder.select':'Please select',
        'placeholder.max24':'The value contains a maximum of 24 characters',
        'placeholder.docker_cmdMsg':'Please enter the image name',
        'placeholder.docker_cmd':'Please enter the image name, such as nginx: 1.11',
        'placeholder.dockerRunMsg':'Enter the DockerRun command',
        'placeholder.dockerRun':'For example： docker run -d -p 8080:8080 -e PWD=1qa2ws --name=tomcat_demo tomcat',
        'placeholder.yaml_content':'Enter the DockerCompose configuration content',
        'placeholder.user_name':'Please enter a warehouse user name',
        'placeholder.password':'Please enter the warehouse password',
        'placeholder.group_name':'Please enter the application name',
        'placeholder.component_cname':'Please enter a component name',
        'placeholder.endpoints':'Select the endPoints type!',
        'placeholder.componentAddress':'Please enter the component address',
        'placeholder.nameSpaceMsg':'Please enter the Namesapce',
        'placeholder.nameSpace':'If left blank, it defaults to Namesapce, where the current team is located',
        'placeholder.serviceName':'Please enter the service name',
        'placeholder.attrName':'Please enter the correct address',
        'placeholder.notAttrName':'Component addresses must be different',
        'placeholder.nameSpaceReg':'Only lowercase letters, digits, and hyphens (-) are supported and must start with a letter and end with a digit or letter',
        'placeholder.max32':'The value cannot exceed 32 characters',
        'placeholder.nonsupport':'Does not support{ nonsupport }',
        'placeholder.nonsupport.regAddress':'Address',
        'placeholder.roleName':'Please enter a role name',
        'placeholder.permissions':'To allocate!',
        'placeholder.nonsupport.regLoopBack':'Loopback interface address',
    }
    

export default Object.assign({}, unit, popover, button, notification, placeholder);