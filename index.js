const PromisePool = require('async-promise-pool')
const minimist = require('minimist')
const createDatabase = require('./lib/db')
const createPasses = require('./lib/pass')
const createPeople = require('./lib/person')
const mocks = require('./mocks')
const config = require('./config')

const argv = minimist(process.argv.slice(2))

const cli = {
  concurrency: +argv.concurrency || 5,
  limit: +argv.limit || 1000
}

const createApi = () => {
  const db = createDatabase(config)
  const pool = new PromisePool({ concurrency: cli.concurrency })

  const api = {
    passes: createPasses({ db, mocks }),
    people: createPeople({ db, mocks })
  }

  const load = () => {
    let i = 0

    const items = Array.from(Array(cli.limit).keys())

    items.forEach(item => {
      return pool.add(() => {
        console.log(i, item)
        i++
        return api.passes.create({})
      })
    })
  }

  console.log(api)

  return { load }
}

const { load } = createApi()

load()
