const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const source = fs.readFileSync(path.join(__dirname, 'application.js'), 'utf8');
const ast = parser.parse(source, { sourceType: 'module' });
const requests = [];
const response = { list: [{ id: 7 }] };
const handleError = () => {};
const request = (url, options) => {
  requests.push({ url, options });
  return Promise.resolve(response);
};
function loadService(name) {
  const declaration = ast.program.body.find(node =>
    node.type === 'ExportNamedDeclaration' && node.declaration?.id?.name === name
  ).declaration;
  return new Function(
    'request', 'apiconfig',
    `${source.slice(declaration.start, declaration.end)}\nreturn ${name};`
  )(request, { baseUrl: '/region-api' });
}

const baseUrl = '/region-api/console/teams/team-a/groups/3/k8s-resources';
const body = { team_name: 'team-a', app_id: 3, List_id: [7, 9] };

(async () => {
  const preview = loadService('previewKubernetesDeletion');
  const reconcile = loadService('reconcileKubernetesResources');
  assert.strictEqual(await preview(body, handleError), response);
  assert.deepStrictEqual(requests.pop(), {
    url: `${baseUrl}/actions/deletion-impact`,
    options: { method: 'post', data: { ids: body.List_id }, handleError }
  });
  assert.strictEqual(await reconcile(body, handleError), response);
  assert.deepStrictEqual(requests.pop(), {
    url: `${baseUrl}/actions/reconcile`,
    options: { method: 'post', data: {}, handleError }
  });

  const getResource = loadService('getSingleKubernetesVal');
  const editResource = loadService('editSingleKubernetesVal');
  const deleteResource = loadService('delSingleKubernetesVal');
  for (const name of ['reconcile', 'deletion-impact']) {
    const resource = {
      ...body,
      list_name: name,
      id: 7,
      List_id: 7,
      yaml: `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: ${name}\n`,
      cascade_crd: true
    };
    assert.strictEqual(await getResource(resource), response);
    assert.deepStrictEqual(requests.pop(), {
      url: `${baseUrl}/${name}`,
      options: { method: 'get', params: { list_name: name, id: 7 } }
    });
    assert.strictEqual(await editResource(resource), response);
    assert.deepStrictEqual(requests.pop(), {
      url: `${baseUrl}/${name}`,
      options: { method: 'put', data: { resource_yaml: resource.yaml, id: 7 } }
    });
    assert.strictEqual(await deleteResource(resource, handleError), response);
    assert.deepStrictEqual(requests.pop(), {
      url: `${baseUrl}/${name}`,
      options: {
        method: 'DELETE',
        data: { resource_yaml: resource.yaml, id: 7, cascade_crd: true },
        handleError
      }
    });
  }
  console.log('Kubernetes resource service routes preserve action and named resource requests');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
