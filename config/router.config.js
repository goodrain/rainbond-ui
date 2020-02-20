export default [
  {
    path: '/oauth',
    component: '../layouts/OauthLayout',
    routes: [
      // 第三方认证
      { path: '/oauth/callback', component: './User/Third' },
    ],
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
      { path: '/user/third/register', component: './User/ThirdRegister' },
    ],
  },
  {
    path: '/exception/trigger',
    component: './Exception/triggerException',
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
        redirect: '/enterprise/auto',
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
            authority: ['admin', 'user'],
          },
          {
            path: '/enterprise/:eid/teams',
            component: './EnterpriseTeams',
            name: 'EnterpriseTeams',
            authority: ['admin', 'user'],
          },
          {
            path: '/enterprise/:eid/setting',
            component: './EnterpriseSetting',
            name: 'EnterpriseSetting',
            authority: ['admin', 'user'],
          },
          {
            path: '/enterprise/:eid/shared',
            component: './EnterpriseShared',
            name: 'EnterpriseShared',
            authority: ['admin', 'user'],
          },
        ],
      },
      //team view layout
      {
        path: '/team/:teamName/region/:regionName/',
        component: '../layouts/TeamLayout',
        name: 'TeamBasicLayout',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
        routes: [
          // 总览
          {
            path: '/team/:teamName/region/:regionName/index',
            component: './Index/Index',
            name: 'teamOverview',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },
          {
            path: '/team/:teamName/region/:regionName/source/:type?/:name?',
            component: './Source/Index',
            name: 'Source',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
            // hideInMenu: true,
          },
          {
            path: '/team/:teamName/region/:regionName/finance',
            component: './Finance',
            name: 'Finance',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },
          // {
          //   path: '/team/:teamName/region/:regionName/resources/buy/:regionName',
          //   component: './Finance/resources',
          //   name: 'resources',
          //   // icon: 'dashboard',
          //   authority: ['admin', 'user'],
          // },

          {
            path: '/team/:teamName/region/:regionName/message',
            component: './Message/Index',
            name: 'Message',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/allbackup',
            component: './Group/AllBackup',
            name: 'AllBackup',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/team',
            component: './Team',
            name: 'Team',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/groups/upgrade/:groupId/',
            component: './Upgrade',
            name: 'Upgrade',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
            title: '云市应用升级',
          },

          {
            path: '/team/:teamName/region/:regionName/groups/backup/:groupId/',
            component: './Group/Backup',
            name: 'Backup',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
            title: '备份管理',
          },

          {
            path: '/team/:teamName/region/:regionName/groups/:groupId',
            // component: './Group/Index',
            component: './Group/Index',
            name: 'Groups',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:teamName/region/:regionName/groups/share/one/:groupId/:shareId',
            component: './Group/AppShare',
            name: 'AppShares',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:teamName/region/:regionName/groups/share/two/:groupId/:shareId',
            component: './Group/AppShareLoading',
            name: 'AppShareLoading',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:teamName/region/:regionName/groups/share/three/:groupId:ShareId',
            component: './Group/AppShareFinish',
            name: 'AppShareFinish',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/app/:appAlias/:type?',
            component: './App',
            name: 'App',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/create/code/:type?/:code?',
            component: './Create/code',
            name: 'code',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/create/outer/:type?/:outer?',
            component: './Create/outer',
            name: 'outer',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/create/market/:keyword?',
            component: './Create/market',
            name: 'market',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/myplugns/:pluginId?',
            component: './Plugin',
            name: 'Plugin',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:teamName/region/:regionName/shareplugin/step-one/:pluginId/:shareId',
            component: './Plugin/share-stepone',
            name: 'stepone',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:teamName/region/:regionName/shareplugin/step-two/:pluginId/:shareId',
            component: './Plugin/share-steptwo',
            name: 'steptwo',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/create-plugin',
            component: './Plugin/Create',
            name: 'plugin',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/create/create-check/:appAlias',
            component: './Create/create-check',
            name: 'check',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:teamName/region/:regionName/create/create-compose-check/:groupId/:composeId',
            component: './Create/create-compose-check',
            name: 'compose',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/create/image/:type?/:image?',
            component: './Create/image',
            name: 'imagesss',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/create/create-setting/:appAlias',
            component: './Create/create-setting',
            name: 'setting',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:teamName/region/:regionName/create/create-moreService/:appAlias/:check_uuid',
            component: './Create/create-moreService',
            name: 'moreService',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/guide',
            component: './Guide/index',
            name: 'setting',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:teamName/region/:regionName/create/create-compose-setting/:groupId/:composeId',
            component: './Create/create-compose-setting',
            name: 'compose',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/result/success',
            component: './Result/Success',
            name: 'Success',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },
          {
            path: '/result/fail',
            component: './Result/Error',
            name: 'Error',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/exception/403',
            component: './Exception/403',
            name: '403',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/exception/404',
            component: './Exception/404',
            name: '404',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/exception/500',
            component: './Exception/500',
            name: '500',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/gateway/control/:types?/:isopen?',
            component: './GateWay/control',
            name: 'control',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path: '/team/:teamName/region/:regionName/gateway/license',
            component: './GateWay/license',
            name: 'license',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },
        ],
      },
    ],
  },
];
