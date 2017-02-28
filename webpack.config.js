'use strict';

const path = require('path');
const webpack = require('webpack');
const env = process.env.NODE_ENV;

const config = {
    devtool: env === 'production' ? 'cheap-module-source-map' : 'eval-source-map',
    entry: './client/index.js',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /.js$/,
                loader: 'babel',
                exclude: /node_modules/
            }, {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.scss$/,
                loaders: ['style', 'css', 'sass']
            }
        ]
    },
    sassLoader: {
        includePaths: [path.resolve(__dirname, './scss')]
    }
};

if (env === 'production') {
    config.plugins = [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: true
            }
        })
    ];
}

module.exports = config;
