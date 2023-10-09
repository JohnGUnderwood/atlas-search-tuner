const webpack = require('webpack');

module.exports = {
  webpack: (config) => {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
      'stream/promises': require.resolve('stream-browserify'),
    });
    config.resolve.fallback = fallback;

    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      })
    );

    return config;
  },
};