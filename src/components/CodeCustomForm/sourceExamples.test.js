const {
  SOURCE_EXAMPLES,
  getSourceExampleById,
  getSourceExampleByUrl,
  getSourceExampleDefaultName,
  getSourceExampleFormValues
} = require('./sourceExamples');

describe('source example helpers', () => {
  it('keeps the curated UI example list in the expected order', () => {
    const visibleIds = SOURCE_EXAMPLES.filter(example => example.visibleInUI).map(
      example => example.id
    );

    expect(visibleIds).toEqual([
      'demo-2048',
      'java-demo',
      'vite-demo',
      'nodejs-demo',
      'go-demo',
      'python-demo',
      'dotnet-demo',
      'php-demo'
    ]);
  });

  it('returns explicit default names for sourcecode-examples subdirectory URLs', () => {
    const viteUrl =
      'https://gitee.com/rainbond/sourcecode-examples.git?dir=nodejs/vite';
    const nextjsUrl =
      'https://gitee.com/rainbond/sourcecode-examples.git?dir=nodejs/nextjs-backend';

    expect(getSourceExampleByUrl(viteUrl).defaultName).toEqual('vite-demo');
    expect(getSourceExampleDefaultName(viteUrl)).toEqual('vite-demo');
    expect(getSourceExampleDefaultName(nextjsUrl)).toEqual('nodejs-demo');
    expect(
      getSourceExampleDefaultName('https://gitee.com/rainbond/demo-2048.git')
    ).toEqual('demo-2048');
  });

  it('splits repository url and subdirectory for custom form examples', () => {
    expect(getSourceExampleFormValues(getSourceExampleById('vite-demo'))).toEqual({
      service_cname: 'vite-demo',
      k8s_component_name: 'vite-demo',
      git_url: 'https://gitee.com/rainbond/sourcecode-examples.git',
      server_type: 'git',
      code_version: 'master',
      checkedList: ['subdirectories'],
      subdirectories: 'nodejs/vite',
      useSubdirectory: true
    });
  });

  it('falls back to the repo slug for non-curated repositories', () => {
    expect(
      getSourceExampleDefaultName('https://gitee.com/acme/custom-demo.git')
    ).toEqual('custom-demo');
  });
});
