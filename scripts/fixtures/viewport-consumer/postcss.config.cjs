module.exports = {
  plugins: [{
    postcssPlugin: 'consumer-existing-postcss',
    Declaration(declaration) {
      if (declaration.prop === '--existing')
        declaration.value = 'retained'
    },
  }],
}
