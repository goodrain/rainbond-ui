const assert = require('assert');
const fs = require('fs');
const path = require('path');

const jsSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const lessSource = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');

assert.ok(
  /className=\{styles\.appStatusBar\}/.test(jsSource),
  'app cards should keep the status bar element'
);

assert.ok(
  /\.teamHotAppItem\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;/m.test(lessSource),
  'app cards should stack the status bar above the content'
);

assert.ok(
  /\.teamHotAppItem\s*\{[\s\S]*?transition:\s*box-shadow 0\.2s ease,\s*transform 0\.2s ease;[\s\S]*?&:hover\s*\{[\s\S]*?box-shadow:\s*@rbd-card-shadow-hover;[\s\S]*?transform:\s*translateY\(-2px\);/m.test(lessSource),
  'app cards should keep hover shadow and slight upward movement'
);

assert.ok(
  !/data-app-initial|--app-status-color|styles\.appStatusGradient|linear-gradient\(180deg/.test(jsSource) &&
    !/\.appStatusGradient|&::after|content:\s*attr\(data-app-initial\)|fill%3D%27%231677FF%27|background-image:\s*url\("data:image\/svg\+xml|mask-image:\s*url\("data:image\/svg\+xml|transform:\s*rotate\(-45deg\)/.test(lessSource),
  'app cards should not keep header gradient or right-bottom initial decoration'
);

assert.ok(
  /\.appStatusBar\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*\d+px;[\s\S]*?border-radius:\s*12px 12px 0 0;/m.test(lessSource),
  'app status bar should render as a top horizontal strip'
);

assert.ok(
  !/\.appStatusBar\s*\{[\s\S]*?width:\s*6px;[\s\S]*?align-self:\s*stretch;/m.test(lessSource),
  'app status bar should no longer render as a left vertical strip'
);

assert.ok(
  /className=\{styles\.appCardHeaderRight\}[\s\S]*?className=\{styles\.appCardStatus\}/.test(jsSource),
  'app status should render in the header right area'
);

assert.ok(
  /className=\{styles\.appCardStatus\}[\s\S]*?background:\s*globalUtil\.appStatusColor\(item\.status,\s*0\.12\)/.test(jsSource) &&
    !/borderColor:\s*globalUtil\.appStatusColor\(item\.status/.test(jsSource),
  'app status badge should use status related background without border color'
);

assert.ok(
  /\.appCardStatus\s*\{[\s\S]*?height:\s*22px;[\s\S]*?padding:\s*0 9px;[\s\S]*?border-radius:\s*12px;/m.test(lessSource) &&
    !/\.appCardStatus\s*\{[\s\S]*?border:\s*1px solid transparent;/.test(lessSource),
  'app status badge should render as a compact pill without border'
);

assert.ok(
  /styles\.appCardActions/.test(jsSource),
  'app cards should render a bottom action row'
);

assert.ok(
  /访问/.test(jsSource) && /管理/.test(jsSource),
  'app cards should render visit and manage text actions'
);

assert.ok(
  /<VisterBtn[\s\S]*?type="primary"[\s\S]*?className=\{styles\.appVisitAction\}/.test(jsSource),
  'visit action should use Ant Design primary type'
);

assert.ok(
  /\.appVisitAction\s*\{[\s\S]*?border-color:\s*@border-color-base;[\s\S]*?background:\s*#fff;[\s\S]*?color:\s*@primary-color;[\s\S]*?&:hover,[\s\S]*?&:focus\s*\{[\s\S]*?border-color:\s*@border-color-base;[\s\S]*?color:\s*@primary-color;/m.test(lessSource),
  'visit action should render as a grey border button with blue text'
);

assert.ok(
  /renderAppRuntimeButton\s*=\s*item\s*=>[\s\S]*?<Button className=\{styles\.appActionButton\} onClick=\{\(e\) => this\.handleAppRuntimeButtonClick\(item,\s*e\)\}>[\s\S]*?<Icon type=\{isRunning \? 'pause-circle' : 'play-circle'\} \/>[\s\S]*?<span>\{isRunning \? '关闭' : '启动'\}<\/span>/.test(jsSource),
  'runtime action should render start or stop as a plain action button with operation logic'
);

assert.ok(
  /className=\{styles\.appCardActions\}[\s\S]*?\{hasVisitAccess \? this\.renderAppVisitButton\(item\) : this\.renderAppRuntimeButton\(item\)\}/.test(jsSource),
  'runtime action should move to the first position when visit access is unavailable'
);

assert.ok(
  /renderAppMoreMenu\s*=\s*\(item,\s*hideRuntimeAction = false\)[\s\S]*?\{!hideRuntimeAction && \([\s\S]*?<Menu\.Item key=\{isRunning \? 'stop' : 'start'\} onClick=\{\(e\) => this\.handleAppRuntimeButtonClick\(item,\s*e\)\}/.test(jsSource) &&
    /overlay=\{this\.renderAppMoreMenu\(item,\s*!hasVisitAccess\)\}/.test(jsSource),
  'more menu should hide the runtime action when it is rendered in the first position and bind operation logic'
);

assert.ok(
  /className=\{styles\.appActionButton\}[\s\S]*?onClick=\{\(e\) => this\.jumpToAppOverview/.test(jsSource),
  'manage action should keep the default button type'
);

assert.ok(
  !/type="primary" ghost/.test(jsSource),
  'manage action should not use the previous primary ghost button style'
);

assert.ok(
  /<Icon type="export" \/>/.test(jsSource) &&
    /<Icon type="appstore" \/>/.test(jsSource),
  'visit and manage actions should use basic Ant Design icons'
);

assert.ok(
  !/renderActionContent|renderVisitActionIcon|renderManageActionIcon|renderAppActionItem|renderAppDeleteButton|appActionLink/.test(jsSource),
  'app actions should not keep custom svg, link action, or wrapper renderers'
);

assert.ok(
  !/appActionIconWrapper|appActionText|visitActionIcon|appActionItem|appActionLink/.test(jsSource + lessSource),
  'app action buttons should not keep animation wrapper classes'
);

assert.ok(
  !/renderActionContent\('ellipsis',\s*'更多'\)/.test(jsSource),
  'more action should not render text'
);

assert.ok(
  /className=\{`\$\{styles\.appActionButton\} \$\{styles\.moreActionButton\}`\}/.test(jsSource) &&
    /<Icon type="ellipsis" className=\{styles\.moreActionIcon\} \/>/.test(jsSource),
  'more action should render only the ellipsis icon'
);

assert.ok(
  /renderAppMoreMenu/.test(jsSource) && /启动/.test(jsSource) && /关闭/.test(jsSource) && /删除/.test(jsSource),
  'more menu should render mutually exclusive start/stop labels and delete'
);

assert.ok(
  /import \{ Button, Dropdown, Input, Spin, Pagination, Tooltip, Icon, Menu, Select, Modal, notification \} from 'antd';/.test(jsSource) &&
    /import AppDeteleResource from '..\/..\/..\/components\/AppDeteleResource';/.test(jsSource),
  'team home app actions should reuse the shared delete resource component with a static import'
);

assert.ok(
  /handlePromptModalOpen\s*=\s*\(\)\s*=>[\s\S]*?type:\s*'global\/buildShape'[\s\S]*?group_id:\s*operateApp\.group_id[\s\S]*?action:\s*operateCode[\s\S]*?this\.loadHotApp\(\);/.test(jsSource),
  'start and stop should reuse the buildShape operation and refresh the team app list'
);

assert.ok(
  /handleDeleteAppClick\s*=\s*\(item,\s*e\)\s*=>[\s\S]*?type:\s*'application\/fetchGroupAllResource'[\s\S]*?group_id:\s*item\.group_id[\s\S]*?toDelete:\s*true[\s\S]*?toDeleteResource:\s*false/.test(jsSource),
  'delete should fetch app resources before opening the two-step delete modal'
);

assert.ok(
  /<Modal[\s\S]*?confirmLoading=\{buildShapeLoading\}[\s\S]*?onOk=\{this\.handlePromptModalOpen\}[\s\S]*?friendly_reminder\.pages\.desc/.test(jsSource),
  'start and stop should keep the friendly reminder confirmation modal'
);

assert.ok(
  !/handleDeleteResource\s*=|renderDeleteResourceList\s*=|getDeleteResourceRows\s*=|deleteConfirmContent|deleteResourceList/.test(jsSource.replace(/deleteResourceList:\s*\{\},/g, '').replace(/deleteResourceList/g, '')),
  'team home should not keep a separate delete modal implementation'
);

assert.ok(
  /<AppDeteleResource[\s\S]*?onDelete=\{this\.handleDelete\}[\s\S]*?goBack=\{this\.cancelDeleteResource\}[\s\S]*?infoList=\{deleteResourceList\}[\s\S]*?group_id=\{operateApp\.group_id\}[\s\S]*?isflag=\{toDeleteResource\}[\s\S]*?onSuccess=\{this\.handleDeleteSuccess\}[\s\S]*?skipRedirect/.test(jsSource),
  'delete should render the shared two-step delete resource modal without redirecting away from the team home'
);

assert.ok(
  /\.appCardActions\s*\{[\s\S]*?grid-template-columns:\s*2fr 2fr 1fr;/m.test(lessSource),
  'bottom app actions should use a 40/40/20 layout'
);

assert.ok(
  /\.appActionButton,[\s\S]*?\.appVisitAction\s*\{[\s\S]*?height:\s*34px;[\s\S]*?border-radius:\s*10px;[\s\S]*?i\s*\{[\s\S]*?margin-right:\s*6px;[\s\S]*?font-size:\s*16px;/m.test(lessSource),
  'app action buttons should use plain Ant Design button sizing with icon spacing'
);

assert.ok(
  !/\.appActionButton,[\s\S]*?\.appVisitAction\s*\{[\s\S]*?background:\s*fade\(@primary-color/m.test(lessSource),
  'app action styles should not override Ant Design button background'
);

assert.ok(
  !/\.appActionIconWrapper|\.appActionText|\.visitActionIcon|translateX\(16px\)|content:\s*'｜'|&::before/.test(lessSource),
  'app action button animations should be removed'
);

assert.ok(
  /\.moreActionButton\s*\{[\s\S]*?padding:\s*0;[\s\S]*?\.moreActionIcon\s*\{[\s\S]*?margin-right:\s*0;[\s\S]*?font-size:\s*18px;/m.test(lessSource),
  'more action should keep only the ellipsis icon spacing'
);

assert.ok(
  /className=\{styles\.appComponentSummary\}>\{item\.services_num\} 个组件/.test(jsSource),
  'component count should render below the app name without service type text'
);

assert.ok(
  /className=\{styles\.appMetaRow\}[\s\S]*?内存 \{memoryValue\} \{memoryUnit\}[\s\S]*?className=\{styles\.appMetaDivider\}>·[\s\S]*?CPU \{cpuValue\} \{cpuUnit\}[\s\S]*?className=\{styles\.appMetaDivider\}>·[\s\S]*?更新 \{updatedTimeText\}/.test(jsSource),
  'resource usage and update time should render in one metadata row with centered dot separators'
);

assert.ok(
  !/styles\.appCardResources/.test(jsSource) && !/styles\.appCardTimeRow/.test(jsSource),
  'old resource and time rows should be removed from app card rendering'
);

assert.ok(
  !/teamApply\.createTime/.test(jsSource) && !/versionUpdata_6_1\.updateTime/.test(jsSource),
  'old create/update labels should no longer render in app cards'
);

assert.ok(
  /\.appIcon\s*\{[\s\S]*?width:\s*48px;[\s\S]*?height:\s*48px;/m.test(lessSource),
  'app icon should use the compact default size'
);

assert.ok(
  /getAppNameInitial\s*=\s*name\s*=>[\s\S]*?Array\.from\(appName\)[\s\S]*?return initial\.toUpperCase\(\);/.test(jsSource),
  'app icon should derive its content from the app name initial'
);

assert.ok(
  !/fetchSvg\('appIconSvg'/.test(jsSource) &&
    /className=\{styles\.appIconText\}[\s\S]*?\{this\.getAppNameInitial\(item\.group_name\)\}/.test(jsSource),
  'app icon should render the app initial instead of the svg icon'
);

assert.ok(
  /\.appIconText\s*\{[\s\S]*?font-size:\s*22px;[\s\S]*?font-weight:\s*700;[\s\S]*?text-transform:\s*uppercase;/m.test(lessSource),
  'app initial should use a prominent text style'
);

assert.ok(
  /\.appName\s*\{[\s\S]*?font-size:\s*16px;[\s\S]*?color:\s*@rbd-title-color;[\s\S]*?line-height:\s*@rbd-title-line-height;/m.test(lessSource),
  'app name should use the compact title size'
);

assert.ok(
  /\.appName\s*\{[\s\S]*?font-weight:\s*700;/m.test(lessSource),
  'app name should use stronger title weight'
);

assert.ok(
  /\.appComponentSummary\s*\{[\s\S]*?color:\s*@rbd-content-color-secondary;[\s\S]*?font-size:\s*@rbd-auxiliary-size;[\s\S]*?line-height:\s*@rbd-auxiliary-line-height;/m.test(lessSource),
  'component summary should use the requested 12px size'
);

assert.ok(
  /\.appMetaItem\s*\{[\s\S]*?font-size:\s*@rbd-auxiliary-size;[\s\S]*?line-height:\s*@rbd-auxiliary-line-height;[\s\S]*?color:\s*@rbd-content-color-secondary;/m.test(lessSource),
  'metadata row text should use the requested 12px size'
);

assert.ok(
  /\.appMetaDivider\s*\{[\s\S]*?color:\s*@rbd-content-color-secondary;[\s\S]*?font-size:\s*@rbd-auxiliary-size;[\s\S]*?line-height:\s*@rbd-auxiliary-line-height;/m.test(lessSource),
  'metadata row separators should use the requested 12px size'
);

console.log('team basic app list layout tests passed');
