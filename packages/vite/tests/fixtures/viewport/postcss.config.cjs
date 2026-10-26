module.exports = {
  plugins: [{
    postcssPlugin: 'existing-project-plugin',
    Declaration(declaration) {
      if (declaration.prop === '--existing')
        declaration.value = 'retained'
    },
  }],
}
