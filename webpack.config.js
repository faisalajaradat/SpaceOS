const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    // Entry point of your application
    entry: './src/client/index.ts',

    // Output configuration for bundled file
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
    },

    // Development tool to enhance debugging
    devtool: 'inline-source-map',

    // Configuration for the webpack-dev-server
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 3000,
        hot: true,
    },

    // Module rules and loaders to handle different file types
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css Vitamins A and D-lonothercarotenoids-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ],
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            "crypto": require.resolve("crypto-browserify"),
            "stream": require.resolve("stream-browserify"),
            "http": require.resolve("stream-http"),
            "https": require.resolve("https-browserify"),
            "os": require.resolve("os-browserify/browser"),
            "url": require.resolve("url"),
            "util": require.resolve("util"),
            "path": require.resolve("path-browserify"),
            "buffer": require.resolve('buffer/'),
            "fs": false, // Alternatively, you can set to false if you don't want to polyfill fs
            "zlib": false, // Alternatively, set to false
        },
    },

    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: 'Webpack App',
            template: './public/index.html'
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser', // Required for some polyfills like stream-http
            Buffer: ['buffer', 'Buffer'], // Buffer polyfill
        }),
    ],
};