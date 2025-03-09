import path from 'path'
import type { Configuration } from 'webpack'

const alias = Object.fromEntries(
  Object.entries({
    '@': `./src`,
    '@extra': `./extra`,
  }).map(([key, value]) => [key, path.resolve(__dirname, value)]),
)

export const commonConfig: Configuration = {
  resolve: {
    alias: alias,
  },
}
