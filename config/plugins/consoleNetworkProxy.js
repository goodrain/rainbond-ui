import { HttpProxyAgent } from 'http-proxy-agent';
import { createProxyMiddleware } from '@umijs/deps/compiled/http-proxy-middleware';

// Build the agent at server startup: UMI normalizes config objects and drops
// agent prototype methods when an instance is placed in the proxy config.
export default (api) => {
  api.addBeforeMiddlewares(() => {
    const networkProxy = process.env.CONSOLE_HTTP_PROXY;
    if (!networkProxy) return [];
    return [
      createProxyMiddleware(
        [
          '/console',
          '/data',
          '/openapi/v1',
          '/enterprise-server',
          '/app-server',
          '/static/www'
        ],
        {
          target: process.env.CONSOLE_PROXY_TARGET || 'http://127.0.0.1:7070/',
          changeOrigin: true,
          agent: new HttpProxyAgent(networkProxy),
          logLevel: 'warn',
          onProxyRes(response, request) {
            if (
              process.env.CONSOLE_PROXY_DEBUG === 'true' &&
              response.statusCode >= 400
            ) {
              // Do not log headers, query parameters, request bodies or credentials.
              console.warn(
                `[console proxy] ${request.method} ${
                  request.url.split('?')[0]
                } ${response.statusCode}`
              );
            }
          }
        }
      )
    ];
  });
};
