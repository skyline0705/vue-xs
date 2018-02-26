const buble = require('rollup-plugin-buble')

module.exports = {
  input: 'src/index.js',
  output: {
    file: 'dist/vue-xs.js',
    format: 'umd',
    name: 'VueXS',
  },
  plugins: [buble()]
}
