const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

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
        new CopyWebpackPlugin([{
            from: 'receiver',
        }, {
            from: 'external',
            to: 'external'
        }
        ]),
        new CompressionPlugin({
            exclude: /^launch-helper.min.js$/,
            asset: '[path][query]',
            minRatio: 5,
            compressionOptions: {
                level: 9
            }
        })
    ]
};