module.exports = {
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxSize: 25 * 1024 * 1024, // 25 MiB
      },
    },
  };