const path = require('path');

module.exports = {
  entry: './src/app.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'app.bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  // mode: 'production',
  // devtool: false,
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    watchContentBase: true,
    compress: true,
    open: true,
    port: 8080
  },
  stats: {
    modulesSort: 'size',
  },
}
