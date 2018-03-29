const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    devServer: {
        port: 8082,
        historyApiFallback: true,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    },
    devtool: 'source-map',
    entry: './app/index.js',
    output: {
        filename: 'launch-helper.min.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        // new UglifyJSPlugin(),
        new CopyWebpackPlugin([{
                from: 'HDXEngine.html',
                to: 'HDXEngine.html'
            }, {
                from: 'HDXLauncher.js',
                to: 'HDXLauncher.js'
            }, {
                from: 'CitrixHTML5SDK.js',
                to: 'CitrixHTML5SDK.js'
            }, {
                from: 'external',
                to: 'external'
            }
        ])
    ]
};