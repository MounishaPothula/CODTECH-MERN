const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    popup: './src/popup/index.jsx',
    background: './background.js',
    content: './src/content.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  optimization: {
    minimize: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }],
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { 
          from: 'manifest.json',
          to: 'manifest.json'
        },
        { 
          from: 'icons',
          to: 'icons'
        },
        { 
          from: 'src/popup/popup.html',
          to: 'popup.html'
        },
        { 
          from: 'src/blocked.html',
          to: 'blocked.html'
        }
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  }
}; 