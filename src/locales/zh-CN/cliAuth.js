const cliAuth = {
  'cliAuth.title': '授权命令行工具',
  'cliAuth.description':
    '本地的 rainbond-skills 安装脚本（Codex / Claude Code）请求获取你当前的登录凭证，用于配置 Rainbond MCP 接入。',
  'cliAuth.warning.title': '请确认这是你本人发起的安装',
  'cliAuth.warning.detail':
    '点击下方按钮后，浏览器会把当前账号的 JWT 发送到本机回调地址，仅用于本机命令行接入 Rainbond MCP。请勿在公共电脑上完成此操作。',
  'cliAuth.field.user': '当前账号',
  'cliAuth.field.callback': '回调地址',
  'cliAuth.button.authorize': '授权并发送凭证',
  'cliAuth.invalid.title': '授权请求无效',
  'cliAuth.invalid.subtitle':
    '回调地址不在允许范围（仅允许 127.0.0.1 本机回调）。请在终端重新运行安装脚本。',
  'cliAuth.done.title': '授权完成',
  'cliAuth.done.subtitle':
    '凭证已发送到本机命令行，可关闭此页面回到终端继续。',
  'cliAuth.error.noToken':
    '未检测到登录凭证，请重新登录后再试。',
};

export default cliAuth;
