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
        rules: [
            {
                test: /.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            includePaths: [path.resolve(__dirname, './scss')]
                        }
                    },
                ]
            }
        ]
    }
};

if (env === 'production') {
    config.plugins = [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: 'production'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: true,
                minimize: true,
                sourceMap: true
            }
        })
    ];
}

module.exports = config;
