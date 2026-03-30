const { isCI } = require('std-env')

module.exports = {
  forbidOnly: isCI,
}
