module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Log rules to debug
      console.log('Webpack Rules:', JSON.stringify(webpackConfig.module.rules, null, 2));

      // Find all rules that might include source-map-loader
      webpackConfig.module.rules.forEach((rule, index) => {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach((loader) => {
            if (loader.loader && loader.loader.includes('source-map-loader')) {
              loader.exclude = [
                /node_modules[\\\/]@zxing[\\\/]library/,
              ];
            }
          });
        } else if (rule.loader && rule.loader.includes('source-map-loader')) {
          rule.exclude = [
            /node_modules[\\\/]@zxing[\\\/]library/,
          ];
        }
      });

      return webpackConfig;
    },
  },
};