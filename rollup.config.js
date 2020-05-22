import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'

export default [
  {
    input: 'src/index.js',
    output: {
      name: 'TinyScrollListener',
      file: 'lib/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      babel({
        exclude: 'node_modules/**',
      }),
    ],
  },
  {
    input: 'src/index.js',
    output: {
      name: 'TinyScrollListener',
      file: 'lib/index.min.js',
      format: 'umd',
    },
    plugins: [
      resolve(),
      babel({
        exclude: 'node_modules/**',
      }),
      uglify(),
    ],
  },
]
