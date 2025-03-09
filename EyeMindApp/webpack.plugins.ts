import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import forkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin =
  forkTsCheckerWebpackPlugin

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
]
