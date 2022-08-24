//共同的信息
    //单位
    const unit = {
        'unit.entries':'PCS'
    }
    //弹框
    const popover = {
        // 弹窗新建/修改组件
        'popover.newComponent.title':'New component',
        'popover.newComponent.componentName':'Component name',
        'popover.newComponent.gitHub':'Github project',
        'popover.newComponent.gitLab':'Gitlab project',
        'popover.newComponent.versions':'versions',
        'popover.newComponent.newProject':'New project',
        'popover.newComponent.codeBranch':'Code branch',

        // 弹窗新建/修改应用
        'popover.newApp.title':'New app',
        'popover.newApp.appName':'App name',
        'popover.newApp.appEngName':'English name App',
        'popover.newApp.logo':'Logo',
        'popover.newApp.upload_pictures':'Upload pictures',
        'popover.newApp.upload_pictures.extra':'Please upload a 48 × 48 image',
        'popover.newApp.appEngName.extra':'To change the English name of an application, disable all components of the application',
        'popover.newApp.appRemark':'App note',
        'popover.newApp.appRemark.placeholder':'Please fill in the application remarks',
        'popover.newApp.appName.placeholder':'Please fill in the application name',
        'popover.newApp.appEngName.placeholder':'Please fill in the English name of the application',

        //添加/编辑http访问策略
        'popover.access_strategy.title.add':'Example Add an HTTP access policy',
        'popover.access_strategy.title.edit':'Example Edit an HTTP access policy',
        'popover.access_strategy.lable.routingRule':'路由规则',
        'popover.access_strategy.lable.domain_name':'域名',
        'popover.access_strategy.lable.domain_heander':'请求头',
        'popover.access_strategy.lable.the_weight':'权重',
        'popover.access_strategy.lable.certificate_id':'HTTPs证书',
        'popover.access_strategy.lable.function_select':'功能选择',
        'popover.access_strategy.lable.exist_certificate_select':'已有证书选择',
        'popover.access_strategy.lable.auto_ssl_config':'认证配置',
        'popover.access_strategy.lable.rule_extensions_http':'扩展功能',
        'popover.access_strategy.lable.port':'端口号',
        'popover.access_strategy.lable.component':'组件',
        'popover.access_strategy.modal.domain':'域名解析说明',
        'popover.access_strategy.lable.analysis':'请将域名解析到：',
        'popover.access_strategy.lable.more':'更多高级路由参数',
        'popover.access_strategy.lable.automatic_issued':'自动签发证书（由控制器自动完成证书签发和匹配）',
        'popover.access_strategy.lable.poll':'负载均衡算法：轮询',
        'popover.access_strategy.lable.conversation':'负载均衡算法：会话保持',
        'popover.access_strategy.lable.access_target':'访问目标',
        'popover.access_strategy.lable.li1':'1.HTTP访问控制策略是基于“域名"等组成路由规则，你需要在所绑定域名的域名服务商增加域名DNSA记录 到当前集群的应用网关出口IP地址之上域名访问即可生效。',
        'popover.access_strategy.lable.li2':'2.当前集群（{ currentRegion }) 出口IP地址是: { ip }',
        'popover.access_strategy.lable.li3':'3.如有疑问请联系平台运营管理员',
        
        //http访问策略参数配置
        'popover.config.title':'参数配置',
        'popover.config.lable.proxy_connect_timeout':'连接超时时间',
        'popover.config.lable.second':'秒',
        'popover.config.lable.proxy_send_timeout':'请求超时时间',
        'popover.config.lable.proxy_read_timeout':'响应超时时间',
        'popover.config.lable.proxy_body_size':'上传限制',
        'popover.config.lable.proxy_buffer_numbers':'缓冲区数量',
        'popover.config.lable.proxy_buffer_size':'缓冲区大小',
        'popover.config.lable.WebSocket':'WebSocket支持',
        'popover.config.lable.proxy_buffering':'开启ProxyBuffer',
        'popover.config.lable.set_headers':'自定义请求头',

        // 添加/编辑tcp/udp访问策略
        'popover.tcp.title.add':'添加tcp/udp访问策略',
        'popover.tcp.title.edit':'编辑tcp/udp访问策略',
        'popover.tcp.lable.rule_extensions':'负载均衡',
        'popover.tcp.lable.poll':'轮询',

        //tcp/udp访问策略参数配置
        'popover.tcp.config.title':'连接信息',
        'popover.tcp.config.table.attr_name':'变量名',
        'popover.tcp.config.table.attr_value':'变量值',
        'popover.tcp.config.table.name':'说明',


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
        'popover.applicationMarket.local':'Local component library',
        'popover.applicationMarket.all':'All',
        'popover.applicationMarket.company':'Company release',
        'popover.applicationMarket.team':'Team release',
        
    }
    const button = {
        'button.delete':'Delete',
        'button.edit':'Edit',
        'button.search':'Search',
        'button.install':'Install',
        'button.read_only':'Read only',
        'button.push':'Push',
        'button.switch.open':'开',
        'button.switch.close':'关',
        'button.close':'关闭',
        'button.open':'开通',
    }
    const status = {
        'status.component.running':'运行中',
        'status.component.health':'健康',
        'status.component.not_health':'不健康',
        'status.component.abnormally':'运行异常',
        'status.component.closed':'已关闭',
        'status.component.off_line':'下线',
    }
    const confirmModal = {
        //修改应用信息 删除应用
        'confirmModal.app.title.edit':'修改应用信息',
        'confirmModal.app.title.delete':'删除应用',
        'confirmModal.app.delete.desc':'确定要此删除此应用吗？',

        //组件提示
        'confirmModal.component.restart.title':'确认要重启该组件吗？',
        'confirmModal.component.start.title':'确认要启动该组件吗？',
        'confirmModal.component.stop.title':'确认要关闭该组件吗？',

        //友情提示
        'confirmModal.friendly_reminder.title':'友情提示',
        'confirmModal.friendly_reminder.pages.desc':'{ codeObj }当前应用下的全部组件？',
        
        //应用复制
        'confirmModal.app.title.copy':'应用复制',
        'confirmModal.app.label.teamRegion':'复制到',
        'confirmModal.app.label.build':'构建源信息',
        'confirmModal.app.label.editVersions':'版本修改',
        'confirmModal.app.label.branch':'分支',
        'confirmModal.app.label.tag':'Tag',
        'confirmModal.app.label.not_change':'暂不支持变更版本',
        'confirmModal.app.label.third_party':'第三方组件',
        'confirmModal.app.label.mirror_image':'镜像:',
        'confirmModal.app.label.sound_code':'源码:',
        'confirmModal.app.label.component_library':'组件库:',
        'confirmModal.app.label.local':'本地文件:',
        'confirmModal.app.label.editVersions':'版本修改',

        //应用治理模式切换
        'confirmModal.app.govern.title':'应用治理模式切换',
        'confirmModal.app.govern.alert.msg':'应用治理模式主要指组件间通信模式的治理，目前支持内置ServiceMesh模式,Istio治理模式和Kubernetes原生Service模式',
        'confirmModal.app.govern.label.name_port':'组件名称/端口',
        'confirmModal.app.govern.label.alias':'别名',
        'confirmModal.app.govern.label.DNS':'内部域名',
        'confirmModal.app.govern.label.change':'治理模式选择',
        'confirmModal.app.govern.label.mode':'模式说明',
        'confirmModal.app.govern.label.service':'该模式组件间使用Kubernetes service名称域名进行通信，用户需要配置每个组件端口注册的service名称，治理能力有限.',
        'confirmModal.app.govern.label.serviceMesh':'内置ServiceMesh模式需要用户显示的配置组件间的依赖关系，平台会在下游组件中自动注入sidecar容器组成ServiceMesh微服务架构，业务间通信地址统一为localhost模式',
        'confirmModal.app.govern.label.istio':'该模式组件间使用Kubernetes service名称域名进行通信，用户需要配置每个组件端口注册的service名称，且安装Istio  control plane ，通过Istio进行治理。',

        //修改负责人
        'confirmModal.app.title.principal':'修改负责人',
        'confirmModal.app.lable.principal':'负责人',


        //删除策略
        'confirmModal.delete.strategy.title':'删除策略',
        'confirmModal.delete.strategy.subDesc':'此操作不可恢复',
        'confirmModal.delete.strategy.desc':'确定要删除此策略吗?',

        //删除/编辑/添加成员
        'confirmModal.add.member':'添加成员',
        'confirmModal.delete.member':'删除成员',
        'confirmModal.delete.member.desc':'确定要删除此成员吗？',
        'confirmModal.edit.member':'编辑成员',
        'confirmModal.lable.member.user_name':'用户名',
        'confirmModal.lable.member.user_ids':'选择用户',
        'confirmModal.lable.member.role_ids':'选择角色',

        //移交团队
        'confirmModal.MoveTeam.title':'移交团队',
        'confirmModal.MoveTeam.subDesc':'移交后您将失去所有权',
        'confirmModal.MoveTeam.desc':'确定要把团队移交给 { nick_name } 吗？',

        //开通集群
        'confirmModal.openRegion.title':'开通集群',
        'confirmModal.openRegion.alert':'暂无其他集群，请到集群管理面板中添加更多集群',
        'confirmModal.openRegion.table.region_alias':'名称',
        'confirmModal.openRegion.table.region_name':'集群',
        'confirmModal.openRegion.table.desc':'简介',
        'confirmModal.openRegion.card.title':'当前团队没有集群，请先开通"',

        //添加/修改镜像仓库授权信息
        'confirmModal.add.image.title':'添加镜像仓库授权信息',
        'confirmModal.edit.image.title':'修改镜像仓库授权信息',
        'confirmModal.image.lable.domain':'镜像仓库地址',
        'confirmModal.image.lable.username':'用户名',
        'confirmModal.image.lable.password':'密码',

        
    }
    const notification = {
        // 成功
        'notification.success.delete':'Delete success',
        'notification.success.setUp':'Create success',
        'notification.success.edit':'Edit success',
        'notification.success.add':'Add success',
        'notification.success.update':'Update success',
        'notification.success.open':'Open success',
        'notification.success.close':'Close success',
        'notification.success.save':'Save success',

        // 失败
        'notification.error.delete':'Delete failure',
        'notification.error.setUp':'Create failure',
        'notification.error.edit':'Edit failure',
        'notification.error.add':'Add failure',
        'notification.error.update':'Update failure',

        // 警告
        'notification.warn.team':'Please join the team first!',
        'notification.warn.app':'Create the app first!',

        //提示
        'notification.hint.component.change':'切换成功、更新组件后生效',
        'notification.hint.component.putBatchMove':'批量移动中',
        'notification.hint.component.putBatchStop':'批量关闭中',
        'notification.hint.component.putBatchStart':'批量启动中',
        'notification.hint.component.putBatchRestart':'批量重启中',
        'notification.hint.component.putBatchUpgrade':'批量更新中',
        'notification.hint.component.putBatchDeploy':'批量构建中',
        'notification.hint.component.putReStart':'操作成功，重启中',
        'notification.hint.component.putStart':'操作成功，启动中',
        'notification.hint.component.putStop':'操作成功，关闭中',
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
        'placeholder.selectPort':'Please select port',
        'placeholder.selectComponent':'Please select component',
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
        'placeholder.max255':'The value contains a maximum of 255 characters',
        'placeholder.preview_image':'Preview image',
        'placeholder.component_not_name':'The component to be created does not yet have a name',
        'placeholder.not_available':'No project exists. Please create one first',
        'placeholder.no_spaces':'禁止输入空格',
        'placeholder.addDomain':'请添加域名',
        'placeholder.addDomain.pattern':'请填写正确的域名格式，支持泛域名',
        'placeholder.path.absolute':'请输入绝对路径',
        'placeholder.max1024':'最大长度1024',
        'placeholder.certificate.bound':'请绑定证书',
        'placeholder.certificate.remove':'移除证书绑定',
        'placeholder.select.sign_issue':'请选择签发证书认证配置',
        'placeholder.select.rule_extensions_round':'请选择负载均衡类型',
        'placeholder.int':'请输入整数',
        'placeholder.4k':'输入值过小，或不是合法数字，推荐至少设置4K',
        'placeholder.max65535':'最大输入值65535',
        'placeholder.min0':'最小输入值0',
        'placeholder.proxy_connect_timeout':'请输入超时时间',
        'placeholder.proxy_send_timeout':'请输入请求超时时间',
        'placeholder.proxy_read_timeout':'请输入响应超时时间',
        'placeholder.proxy_body_size':'请输入',
        'placeholder.proxy_buffer_size':'请输入缓冲区大小',
        'placeholder.app':'请选择应用',
        'placeholder.ipOrPort':'请输入完整的ip和端口',
        'placeholder.internal_port':'该端口属于内部端口、请重新输入',
        'placeholder.limit':'端口号限制在 1-65534',
        'placeholder.plugin.plugin_alias':'要创建的插件还没有名字',
        'placeholder.plugin.plugin_aliasMsg':'请为创建的插件起个名字吧',
        'placeholder.plugin.build_source':'请选择插件安装来源',
        'placeholder.plugin.category':'请选择类别',
        'placeholder.plugin.image':'请输入镜像地址（名称:tag）如nginx:1.11',
        'placeholder.plugin.code_repo':'请输入源码Git地址（必须包含Dockerfile文件）',
        'placeholder.plugin.labelName':'最小内存',
        'placeholder.plugin.message':'请选择最小内存',
        'placeholder.plugin.min_cpu':'请输入CPU',
        'placeholder.plugin.min_cpuMsg':'只允许输入整数',
        'placeholder.plugin.build_cmd':'请输入插件的启动命令',
        'placeholder.plugin.update_info':'请输入更新说明',
        'placeholder.plugin.desc':'请输入一句话说明',
        'placeholder.userName':'请输入用户名称',
        'placeholder.user_ids':'请选择要添加的用户',
        'placeholder.role_ids':'请选择角色',
        'placeholder.open_colony':'请选择要开通的集群',
        'placeholder.not_Chinese':'不能输入汉字',
        'placeholder.reg_Chinese':'书写格式错误',
        'placeholder.regEmpty':'缺陷编号不能为空',
        'placeholder.templateFile':'请选择Values文件',
        'placeholder.helm.version':'请选择版本',
        'placeholder.helm.overrides':'请填写Values配置',
        'placeholder.copy.team_region':'团队/集群',
        'placeholder.copy.not_null':'不能为空',
        'placeholder.k8s_service_name.msg':'必须由小写字母、数字和-组成，并且必须以小写字母开始,数字和小写字母结束',
        'placeholder.max63':'最大长度63位',
        'placeholder.govern.change':'未安装控制平面，无法切换',
        'placeholder.govern.is_valid':'格式错误!',
    }
    const tooltip = {
        'tooltip.visit':'跳转到组件对外访问端口对应的域名地址',
    }

export default Object.assign({}, unit, popover, button, notification, placeholder, tooltip, confirmModal, status);
