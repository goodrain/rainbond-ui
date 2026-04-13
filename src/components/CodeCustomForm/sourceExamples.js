const SOURCE_EXAMPLES = [
  {
    id: 'demo-2048',
    labelId: 'teamAdd.create.code.demo2048',
    gitUrl: 'https://gitee.com/rainbond/demo-2048.git',
    repoUrl: 'https://gitee.com/rainbond/demo-2048.git',
    defaultName: 'demo-2048',
    visibleInUI: true,
    tagColor: 'magenta',
    linkColor: '#EA2E96'
  },
  {
    id: 'java-demo',
    label: 'Java Demo',
    gitUrl:
      'https://gitee.com/rainbond/sourcecode-examples.git?dir=java/springboot-maven',
    repoUrl: 'https://gitee.com/rainbond/sourcecode-examples.git',
    subdirectory: 'java/springboot-maven',
    defaultName: 'java-demo',
    visibleInUI: true,
    tagColor: 'lime',
    linkColor: '#A0D912'
  },
  {
    id: 'vite-demo',
    label: 'Vite Demo',
    gitUrl: 'https://gitee.com/rainbond/sourcecode-examples.git?dir=nodejs/vite',
    repoUrl: 'https://gitee.com/rainbond/sourcecode-examples.git',
    subdirectory: 'nodejs/vite',
    defaultName: 'vite-demo',
    visibleInUI: true,
    tagColor: 'green',
    linkColor: '#74CC49'
  },
  {
    id: 'nodejs-demo',
    label: 'Node.js Demo',
    gitUrl:
      'https://gitee.com/rainbond/sourcecode-examples.git?dir=nodejs/nextjs-backend',
    repoUrl: 'https://gitee.com/rainbond/sourcecode-examples.git',
    subdirectory: 'nodejs/nextjs-backend',
    defaultName: 'nodejs-demo',
    visibleInUI: true,
    tagColor: 'orange',
    linkColor: '#FA8E14'
  },
  {
    id: 'go-demo',
    label: 'Golang Demo',
    gitUrl:
      'https://gitee.com/rainbond/sourcecode-examples.git?dir=go/single-module',
    repoUrl: 'https://gitee.com/rainbond/sourcecode-examples.git',
    subdirectory: 'go/single-module',
    defaultName: 'go-demo',
    visibleInUI: true,
    tagColor: 'gold',
    linkColor: '#FCAD15'
  },
  {
    id: 'python-demo',
    label: 'Python Demo',
    gitUrl: 'https://gitee.com/rainbond/sourcecode-examples.git?dir=python/flask',
    repoUrl: 'https://gitee.com/rainbond/sourcecode-examples.git',
    subdirectory: 'python/flask',
    defaultName: 'python-demo',
    visibleInUI: true,
    tagColor: 'blue',
    linkColor: '#1990FF'
  },
  {
    id: 'dotnet-demo',
    label: '.Net Demo',
    gitUrl: 'https://gitee.com/rainbond/sourcecode-examples.git?dir=dotnet',
    repoUrl: 'https://gitee.com/rainbond/sourcecode-examples.git',
    subdirectory: 'dotnet',
    defaultName: 'dotnet-demo',
    visibleInUI: true,
    tagColor: 'geekblue',
    linkColor: '#3054EB'
  },
  {
    id: 'php-demo',
    label: 'PHP Demo',
    gitUrl: 'https://gitee.com/rainbond/sourcecode-examples.git?dir=php',
    repoUrl: 'https://gitee.com/rainbond/sourcecode-examples.git',
    subdirectory: 'php',
    defaultName: 'php-demo',
    visibleInUI: true,
    tagColor: 'volcano',
    linkColor: '#FA541B'
  },
  {
    id: 'python-django',
    label: 'Django Demo',
    gitUrl: 'https://gitee.com/rainbond/sourcecode-examples.git?dir=python/django',
    repoUrl: 'https://gitee.com/rainbond/sourcecode-examples.git',
    subdirectory: 'python/django',
    defaultName: 'python-django',
    visibleInUI: false
  },
  {
    id: 'go-multi-module',
    label: 'Go Multi Module Demo',
    gitUrl:
      'https://gitee.com/rainbond/sourcecode-examples.git?dir=go/multi-module',
    repoUrl: 'https://gitee.com/rainbond/sourcecode-examples.git',
    subdirectory: 'go/multi-module',
    defaultName: 'go-multi-module',
    visibleInUI: false
  },
  {
    id: 'java-gradle-demo',
    label: 'Java Gradle Demo',
    gitUrl:
      'https://gitee.com/rainbond/sourcecode-examples.git?dir=java/springboot-gradle',
    repoUrl: 'https://gitee.com/rainbond/sourcecode-examples.git',
    subdirectory: 'java/springboot-gradle',
    defaultName: 'java-gradle-demo',
    visibleInUI: false
  },
  {
    id: 'nestjs-npm-demo',
    label: 'NestJS Demo',
    gitUrl:
      'https://gitee.com/rainbond/sourcecode-examples.git?dir=nodejs/nestjs-npm',
    repoUrl: 'https://gitee.com/rainbond/sourcecode-examples.git',
    subdirectory: 'nodejs/nestjs-npm',
    defaultName: 'nestjs-npm-demo',
    visibleInUI: false
  }
];

const DEFAULT_SOURCE_EXAMPLE = SOURCE_EXAMPLES[0];

const SOURCE_EXAMPLES_BY_ID = SOURCE_EXAMPLES.reduce((examples, example) => {
  examples[example.id] = example;
  return examples;
}, {});

const SOURCE_EXAMPLES_BY_URL = SOURCE_EXAMPLES.reduce((examples, example) => {
  examples[example.gitUrl] = example;
  return examples;
}, {});

function getVisibleSourceExamples() {
  return SOURCE_EXAMPLES.filter(example => example.visibleInUI);
}

function getSourceExampleById(id) {
  return SOURCE_EXAMPLES_BY_ID[id];
}

function getSourceExampleByUrl(url) {
  return SOURCE_EXAMPLES_BY_URL[url];
}

function getSourceExampleDefaultName(url) {
  const sourceExample = getSourceExampleByUrl(url);
  if (sourceExample) {
    return sourceExample.defaultName;
  }

  const dirMatch = /[?&]dir=([^&#]+)/.exec(url || '');
  if (dirMatch && dirMatch[1]) {
    const dirParts = decodeURIComponent(dirMatch[1])
      .split('/')
      .filter(Boolean);
    if (dirParts.length > 0) {
      return dirParts[dirParts.length - 1];
    }
  }

  const repoMatch = /\/([^/?#]+?)(?:\.git)?(?:[?#]|$)/.exec(url || '');
  if (repoMatch && repoMatch[1]) {
    return repoMatch[1];
  }

  return 'demo';
}

function getSourceExampleFormValues(example, codeVersion = 'master') {
  const useSubdirectory = !!example?.subdirectory;

  return {
    service_cname: example.defaultName,
    k8s_component_name: example.defaultName,
    git_url: example.repoUrl || example.gitUrl,
    server_type: 'git',
    code_version: codeVersion,
    checkedList: useSubdirectory ? ['subdirectories'] : [],
    subdirectories: example.subdirectory || '',
    useSubdirectory
  };
}

module.exports = {
  SOURCE_EXAMPLES,
  DEFAULT_SOURCE_EXAMPLE,
  getVisibleSourceExamples,
  getSourceExampleById,
  getSourceExampleByUrl,
  getSourceExampleDefaultName,
  getSourceExampleFormValues
};
