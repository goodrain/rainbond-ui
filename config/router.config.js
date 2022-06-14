export default [
  {
    path: '/oauth',
    component: '../layouts/OauthLayout',
    routes: [
      // 第三方认证
      { path: '/oauth/callback', component: './User/Third' }
    ]
  },
  // user
  {
    path: '/user',
    component: '../layouts/UserLayout',
    routes: [
      { path: '/user', redirect: '/user/login' },
      // 登录
      { path: '/user/login', component: './User/Login' },
      // 注册
      { path: '/user/register', component: './User/Register' },
      // 注册
      { path: '/user/register-result', component: './User/RegisterResult' },
      // 第三方登录
      { path: '/user/third/login', component: './User/ThirdLogin' },
      // 第三方注册
      { path: '/user/third/register', component: './User/ThirdRegister' }
    ]
  },
  {
    path: '/exception/trigger',
    component: './Exception/triggerException'
  },
  // main route config
  {
    path: '/',
    component: '../layouts/SecurityLayout',
    authority: ['admin', 'user'],
    routes: [
      // enterprise view layout
      {
        path: '/',
        redirect: '/enterprise/auto'
      },
      {
        path: '/enterprise/:eid',
        component: '../layouts/EnterpriseLayout',
        name: 'EnterprisePage',
        authority: ['admin', 'user'],
        routes: [
          {
            path: '/enterprise/:eid/index',
            component: './Enterprise',
            name: 'enterpriseOverview',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/teams',
            component: './EnterpriseTeams',
            name: 'EnterpriseTeams',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/users',
            component: './EnterpriseUsers',
            name: 'EnterpriseUsers',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/clusters',
            component: './EnterpriseClusters',
            name: 'EnterpriseClusters',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/monitoring/:monitoringKey/dashboard',
            component: './GrafanaDashboard',
            name: 'GrafanaDashboard',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/clusters/:clusterID/dashboard',
            component: './EnterpriseClusterDashboard',
            name: 'EnterpriseClusterDashboard',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/orders/:orderType',
            component: './EnterpriseOrders',
            name: 'EnterpriseOrders',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/orders/:orderType/details',
            component: './EnterpriseOrders',
            name: 'EnterpriseServiceOverview',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/orders/:orderType/orderDetails/:orderId',
            component: './EnterpriseOrders',
            name: 'EnterpriseOorderDetails',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/setting',
            component: './EnterpriseSetting',
            name: 'EnterpriseSetting',
            authority: ['admin', 'user']
          },

          {
            path: '/enterprise/:eid/shared/app/:appId',
            component: './EnterpriseShared/Details',
            name: 'AppTemplate',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/shared/cloudMarket',
            component: './EnterpriseCloudMarket',
            name: 'EnterpriseCloudMarket',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/shared/import',
            component: './EnterpriseImport',
            name: 'EnterpriseImport',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/shared/:marketName',
            component: './EnterpriseShared',
            name: 'EnterpriseShared',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/addCluster',
            component: './AddCluster',
            name: 'AddCluster',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/provider/:provider/kclusters',
            component: './AddCluster/KClusterList',
            name: 'KClusterList',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/provider/ACksterList',
            component: './AddCluster/ACksterList',
            name: 'ACksterList',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/provider/Aliack',
            component: './AddCluster/Aliack',
            name: 'Aliack',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/provider/ACksterList/advanced',
            component: './AddCluster/Advanced',
            name: 'ACkadvanced',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/provider/ACksterList/install',
            component: './AddCluster/Install',
            name: 'ACkinstall',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/provider/ACksterList/result',
            component: './AddCluster/Result',
            name: 'ACkresult',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/provider/TencentList',
            component: './AddCluster/TencentList',
            name: 'TencentList',
            authority: ['admin', 'user']
          },
          {
            path: '/enterprise/:eid/provider/HuaweiList',
            component: './AddCluster/HuaweiList',
            name: 'HuaweiList',
            authority: ['admin', 'user']
          },
          {
            path:
              '/enterprise/:eid/provider/:provider/kclusters/:clusterID/init',
            component: './AddCluster/RainbondInit',
            name: 'RainbondInit',
            authority: ['admin', 'user']
          },
          {
            path:
              '/enterprise/:eid/provider/:provider/kclusters/:clusterID/link',
            component: './AddCluster/ClusterLink',
            name: 'ClusterLink',
            authority: ['admin', 'user']
          },
          { component: '404' }
        ]
      },
      // team view layout
      {
        path: '/team/:teamName/region/:regionName/',
        component: '../layouts/TeamLayout',
        name: 'TeamBasicLayout',
        authority: ['admin', 'user'],
        Routes: ['./src/layouts/TeamPermissions.js'],
        routes: [
          // 总览
          {
            path: '/team/:teamName/region/:regionName/index',
            component: './TeamDashboard/Index',
            name: 'teamOverview',
            authority: ['admin', 'user']
          },
          {
            path: '/team/:teamName/region/:regionName/message',
            component: './Message/Index',
            name: 'Message',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/allbackup',
            component: './Group/AllBackup',
            name: 'AllBackup',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/team',
            component: './Team',
            name: 'Team',
            authority: ['admin', 'user']
          },
          {
            path: '/team/:teamName/region/:regionName/apps',
            component: './AppList',
            name: 'appList',
            authority: ['admin', 'user'],
            title: '应用列表'
          },
          {
            path: '/team/:teamName/region/:regionName/apps/:appID/upgrade',
            component: './Upgrade',
            name: 'Upgrade',
            authority: ['admin', 'user'],
            title: '云市应用升级'
          },
          {
            path:
              '/team/:teamName/region/:regionName/apps/:appID/upgrade/:upgradeGroupID/record/:recordID',
            component: './Upgrade/UpgradeInfo',
            name: 'UpgradeInfo',
            authority: ['admin', 'user']
          },
          {
            path: '/team/:teamName/region/:regionName/apps/:appID/configgroups',
            component: './Configuration',
            name: 'Configuration',
            authority: ['admin', 'user'],
            title: '应用配置组管理'
          },
          {
            path:
              '/team/:teamName/region/:regionName/apps/:appID/configgroups/details/:id',
            component: './Configuration/Details',
            name: 'ConfigurationDetails',
            authority: ['admin', 'user'],
            title: '应用配置详情'
          },
          {
            path: '/team/:teamName/region/:regionName/apps/:appID/backup',
            component: './Group/Backup',
            name: 'Backup',
            menu: 'app.backup',
            authority: ['admin', 'user'],
            title: '备份管理'
          },

          {
            path: '/team/:teamName/region/:regionName/apps/:appID/publish',
            component: './Group/Publish',
            name: 'publish',
            authority: ['admin', 'user'],
            title: '发布管理'
          },

          {
            path: '/team/:teamName/region/:regionName/apps/:appID/gateway',
            component: './Group/Gateway',
            name: 'publish',
            authority: ['admin', 'user'],
            title: '应用网关'
          },

          {
            path: '/team/:teamName/region/:regionName/apps/:appID',
            component: './Group/Index',
            name: 'Groups',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/apps/:appID/share/:shareId/one',
            component: './Group/AppShare',
            name: 'AppShares',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/apps/:appID/share/:shareId/two',
            component: './Group/AppShareLoading',
            name: 'AppShareLoading',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/apps/:appID/share/:shareId/three',
            component: './Group/AppShareFinish',
            name: 'AppShareFinish',
            authority: ['admin', 'user']
          },
          {
            path:
              '/team/:teamName/region/:regionName/components/:appAlias/webconsole',
            component: './Component/WebConsole',
            name: 'WebConsole',
            authority: ['admin', 'user']
          },
          {
            path:
              '/team/:teamName/region/:regionName/components/:appAlias/:type?',
            component: './Component',
            name: 'Component',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/create/code/:type?/:code?',
            component: './Create/code',
            name: 'code',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/create/outer/:type?/:outer?',
            component: './Create/outer',
            name: 'outer',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/create/market/:keyword?',
            component: './Create/market',
            name: 'market',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/myplugns/:pluginId?',
            component: './Plugin',
            name: 'Plugin',
            targetAuthority: ['plugns'],
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/shareplugin/step-one/:pluginId/:shareId',
            component: './Plugin/share-stepone',
            name: 'stepone',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/shareplugin/step-two/:pluginId/:shareId',
            component: './Plugin/share-steptwo',
            name: 'steptwo',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/create-plugin',
            component: './Plugin/Create',
            name: 'plugin',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/install-plugin',
            component: './Plugin/Install',
            name: 'appPlugin',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/create/create-check/:appAlias',
            component: './Create/create-check',
            name: 'check',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/create/create-compose-check/:appID/:composeId',
            component: './Create/create-compose-check',
            name: 'compose',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/create/image/:type?/:image?',
            component: './Create/image',
            name: 'imagesss',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/create/create-setting/:appAlias',
            component: './Create/create-setting',
            name: 'setting',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/create/create-moreService/:appAlias/:check_uuid',
            component: './Create/create-moreService',
            name: 'moreService',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/guide',
            component: './Guide/index',
            name: 'setting',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/create/create-compose-setting/:appID/:composeId',
            component: './Create/create-compose-setting',
            name: 'compose',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/result/success',
            component: './Result/Success',
            name: 'Success',
            authority: ['admin', 'user']
          },
          {
            path: '/result/fail',
            component: './Result/Error',
            name: 'Error',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/exception/403',
            component: './Exception/403',
            name: '403',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/exception/404',
            component: './Exception/404',
            name: '404',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/exception/500',
            component: './Exception/500',
            name: '500',
            authority: ['admin', 'user']
          },

          {
            path:
              '/team/:teamName/region/:regionName/gateway/control/:types?/:isopen?',
            component: './GateWay/control',
            name: 'control',
            authority: ['admin', 'user']
          },

          {
            path: '/team/:teamName/region/:regionName/gateway/license',
            component: './GateWay/license',
            name: 'license',
            authority: ['admin', 'user']
          },
          { component: '404' }
        ]
      },
      // account view layout
      {
        icon: 'user',
        path: '/account',
        component: '../layouts/AccountLayout',
        name: 'AccountLayout',
        authority: ['admin', 'user'],
        routes: [
          {
            path: '/account/center',
            name: 'UserCenter',
            component: './Account/Center/Info',
            routes: [
              {
                path: '/account/center',
                redirect: '/account/center/binding'
              },
              {
                path: '/account/center/binding',
                component: './Account/Center/BindingView'
              },
              {
                path: '/account/center/accesstoken',
                component: './Account/Center/AccesstokenView'
              }
            ]
          },
          { component: '404' }
        ]
      }
    ]
  }
];
