const assert = require('assert');
const fs = require('fs');
const path = require('path');

const loginComponent = fs.readFileSync(path.join(__dirname, 'loginComponent.js'), 'utf8');
const sharedLogin = fs.readFileSync(path.join(__dirname, '../../components/Login/index.js'), 'utf8');
const loginStyles = fs.readFileSync(path.join(__dirname, 'Login.less'), 'utf8');
const loginMap = fs.readFileSync(path.join(__dirname, '../../components/Login/map.js'), 'utf8');
const userService = fs.readFileSync(path.join(__dirname, '../../services/user.js'), 'utf8');
const zhLocale = fs.readFileSync(path.join(__dirname, '../../locales/zh-CN/login.js'), 'utf8');
const enLocale = fs.readFileSync(path.join(__dirname, '../../locales/en-US/login.js'), 'utf8');

assert.ok(loginComponent.includes('rainbondInfo.captcha_code'), 'captcha rendering should follow public platform config');
assert.ok(sharedLogin.includes('if (item && item.type'), 'disabled captcha should not make the shared login form read a null child');
assert.ok(loginComponent.includes("type !== 'thirdLogin'"), 'third-party binding login should stay outside captcha scope');
assert.ok(loginComponent.includes('name="captcha_code"'), 'login form should submit captcha_code');
assert.ok(loginComponent.includes('onClick={this.refreshCaptcha}'), 'captcha image should support manual refresh');
assert.ok(loginComponent.includes('prevProps.userLogin && !userLogin'), 'captcha should refresh after a login request');
assert.ok(loginComponent.includes('aria-label={formatMessage'), 'captcha refresh control should be keyboard accessible');
assert.ok(loginMap.includes('ImageCaptcha'), 'the shared login form should expose an image captcha field');
assert.ok(userService.includes('/console/captcha?'), 'captcha URL should be provided by the service layer');
assert.ok(/\.captchaRow\s*\{/.test(loginStyles), 'captcha row styles should exist');
assert.ok(zhLocale.includes("'login.captcha.label'"), 'Chinese captcha label should exist');
assert.ok(enLocale.includes("'login.captcha.label'"), 'English captcha label should exist');

console.log('login captcha behavior tests passed');
