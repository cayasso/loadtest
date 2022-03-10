const rc = require('rc')

const config = {
  mongo: process.env.MONGO_URL || 'mongodb://localhost:27017/hptest'
}

module.exports = rc('hp', config)
