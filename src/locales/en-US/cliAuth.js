const cliAuth = {
  'cliAuth.title': 'Authorize Command Line Tool',
  'cliAuth.description':
    'The local rainbond-skills installer (Codex / Claude Code) is requesting your current login credentials to configure Rainbond MCP access.',
  'cliAuth.warning.title': 'Confirm you started this installation',
  'cliAuth.warning.detail':
    'Clicking the button below sends your account JWT to the local callback address. It will only be used by the command line on this machine. Do not perform this on a public computer.',
  'cliAuth.field.user': 'Current account',
  'cliAuth.field.callback': 'Callback URL',
  'cliAuth.button.authorize': 'Authorize and send token',
  'cliAuth.invalid.title': 'Invalid authorization request',
  'cliAuth.invalid.subtitle':
    'Callback URL is not allowed (only 127.0.0.1 loopback callbacks are accepted). Please rerun the installer in your terminal.',
  'cliAuth.done.title': 'Authorization complete',
  'cliAuth.done.subtitle':
    'Credentials have been sent to the local CLI. You can close this tab and return to your terminal.',
  'cliAuth.error.noToken':
    'No login token detected. Please sign in again and retry.',
  'cliAuth.access.restricted.title': 'AI assistant is not available for this account yet',
  'cliAuth.access.restricted.detail':
    'The AI assistant is an optional Rainbond enhancement plugin. The Community Edition currently opens trial access to the first enterprise administrator by default. To enable team members to use it together, enable the Enterprise Edition plugin permission. Rainbond core capabilities remain open source and available.',
  'cliAuth.access.restricted.enterprise': 'Learn about Enterprise Edition',
  'cliAuth.access.restricted.acknowledge': 'Got it',
  'cliAuth.access.error': 'Unable to check authorization access. Please try again later.',
  'cliAuth.access.retry': 'Check again'
};

export default cliAuth;
