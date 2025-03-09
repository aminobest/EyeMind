import CopyWebpackPlugin from 'copy-webpack-plugin'
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin'
import type { Configuration } from 'webpack'
import { merge } from 'webpack-merge'
import { commonConfig } from './webpack.common.config'
import { plugins } from './webpack.plugins'
import { rules } from './webpack.rules'

export const rendererConfig: Configuration = merge(commonConfig, {
  target: 'web',
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
    ],
  },
  plugins: [
    ...plugins,
    new NodePolyfillPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'assets/**',
          to: 'vendor/bpmn-js',
          context: 'node_modules/bpmn-js/dist/',
        },
        { from: '**/*.{html,css,svg,jpg}', context: './src/app/client/' },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.css'],
    fallback: {
      fs: false,
      tls: false,
      net: false,
      path: false,
      zlib: false,
      http: false,
      https: false,
      stream: false,
      crypto: false,
      request: false,
      assert: false,
      child_process: false,
      util: false,
      url: false,
      os: false,
    },
  },
  optimization: {
    minimize: false,
  },
})
