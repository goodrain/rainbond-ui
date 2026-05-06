const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const styleSource = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');

assert.match(
  source,
  /item\.key === 'llm-display'/,
  'CreateComponentModal should still handle clicks on the LLM entry explicitly'
);

assert.match(
  source,
  /handleOpenLlmSelector\(\)/,
  'CreateComponentModal should open the host-side LLM deploy modal for the LLM entry'
);

assert.match(
  source,
  /createTeamLlmDownload/,
  'CreateComponentModal should call the plugin download endpoint for the modelscope flow'
);

assert.match(
  source,
  /uploadTeamLlmArtifact/,
  'CreateComponentModal should call the plugin upload endpoint for the upload flow'
);

assert.match(
  source,
  /jumpToLlmPlugin\(asset\.model_key\)/,
  'CreateComponentModal should auto-open the instance drawer when downloaded repository models are selected'
);

assert.doesNotMatch(
  source,
  /handleJumpToLlmMarket|CreateComponentModal\.llm_model_market/,
  'CreateComponentModal should not render a redundant model repository jump link in the deploy modal'
);

assert.match(
  source,
  /<Radio\.Button value="repository">模型仓库<\/Radio\.Button>/,
  'CreateComponentModal should include the model repository tab in the deploy modal'
);

assert.doesNotMatch(
  source,
  /<Radio\.Button value="local">本地<\/Radio\.Button>/,
  'CreateComponentModal should remove the old local tab from the deploy modal'
);

assert.doesNotMatch(
  source,
  /DeleteOutlined|renderDeleteAction/,
  'CreateComponentModal deploy model modal should not expose model deletion'
);

assert.match(
  source,
  /className=\{styles\.llmRepositoryFooter\}/,
  'CreateComponentModal repository deploy/download action should live in one shared modal footer'
);

assert.match(
  source,
  /selectedLlmRepositoryKey/,
  'CreateComponentModal repository models should be selected before the shared action runs'
);

assert.doesNotMatch(
  source,
  /const getLlmRepositoryIcon =|className=\{styles\.llmRepositoryIcon\}/,
  'CreateComponentModal repository rows should drop the generated model icon to keep each row compact'
);

assert.match(
  source,
  /llmRepositorySearch/,
  'CreateComponentModal repository modal should support search filtering'
);

assert.doesNotMatch(
  source,
  /<span>\{model\.model_id \|\| model\.model_key\}<\/span>/,
  'CreateComponentModal repository rows should remove the extra model id field from the single-line layout'
);

assert.match(
  source,
  /jumpToLlmPlugin\(\);/,
  'CreateComponentModal should jump to the LLM page after repository downloads are submitted'
);

assert.match(
  source,
  /width=\{520\}/,
  'CreateComponentModal should keep repository, modelscope, and upload modal widths aligned with the AI Engine modal'
);

assert.match(
  source,
  /'魔搭和上传模型会先进入团队 PVC，再作为实例启动来源。'/,
  'CreateComponentModal should keep the non-repository modal hint identical to the AI Engine modal'
);

assert.doesNotMatch(
  source,
  /llmSourceType === 'repository' \? 860 : 720|width=\{720\}/,
  'CreateComponentModal should not make the repository tab wider than the other deploy sources'
);

assert.match(
  styleSource,
  /\.llmRepositoryList\s*\{[\s\S]*?max-height:\s*320px;[\s\S]*?overflow-y:\s*auto;/,
  'CreateComponentModal repository list should use the same fixed-height scroll area as the AI Engine modal'
);

assert.doesNotMatch(
  styleSource,
  /\.llmRepositoryItem[\s\S]*?border-left:/,
  'CreateComponentModal repository rows should remove the old left status rail so they match the AI Engine modal'
);

assert.doesNotMatch(
  source,
  /handlePluginClick\(llmPlugin/,
  'CreateComponentModal should no longer open an embedded plugin page for the LLM entry'
);

console.log('CreateComponentModal llm entry flow test passed');
