'use strict'

const { isString, isObject, isNumber, isEmpty } = require('lodash')
const { MongoClient, ObjectId } = require('mongodb')

/**
 * Casts to objectid
 *
 * @param {Mixed} str - hex id or ObjectId
 * @return {ObjectId}
 * @api public
 */
const getId = string => {
  if (string === null) return new ObjectId()
  return isString(string) ? ObjectId.createFromHexString(string) : string
}

const isObjectID = id => {
  if (id === null) return false
  if (isNumber(id)) return true
  if (isString(id)) {
    return id.length === 24 && /^[\da-fA-F]{24}$/.test(id)
  }

  if (id instanceof ObjectId) {
    return true
  }

  return false
}

const parseSort = (key = '') => {
  if (Array.isArray(key)) {
    const keys = key.map(parseSort)
    return Object.assign(...keys)
  }

  const [sign] = key.match(/^[+-]/) || []
  if (sign) key = key.substring(1)
  const dir = sign === '-' ? -1 : 1

  return { [key]: dir }
}

/**
 * Applies ObjectId casting to _id fields.
 *
 * @param {Object} obj, query
 * @return {Object} query
 * @private
 */
const cast = object => {
  if (Array.isArray(object)) {
    return object.map(cast)
  }

  if (object && isObject(object)) {
    Object.keys(object).forEach(k => {
      if (k === '_id' && object._id) {
        if (object._id.$in) {
          object._id.$in = object._id.$in.map(getId)
        } else if (object._id.$nin) {
          object._id.$nin = object._id.$nin.map(getId)
        } else if (object._id.$ne) {
          object._id.$ne = getId(object._id.$ne)
        } else {
          object._id = getId(object._id)
        }
      } else {
        object[k] = cast(object[k])
      }
    })
  }

  return object
}

const collection = (col, opt) => {
  const castId = opt.castIds === false ? n => n : cast

  const findById = _id => {
    return findOne({ _id })
  }

  const findOne = query => {
    return col.findOne(castId(query))
  }

  const findMany = (
    query = {},
    { stream, sort = '-_id', limit = 1000, page = 0, ...options } = {}
  ) => {
    limit = Number.parseInt(limit, 10)
    page = Number.parseInt(page, 10)
    sort = parseSort(sort)
    const skip = page > 0 ? (page - 1) * limit : 0

    return stream
      ? col.find(castId(query), { limit, sort, skip, ...options })
      : col.find(castId(query), { limit, sort, skip, ...options }).toArray()
  }

  const insertOne = async data => {
    data._id = data._id || getId()
    await col.insertOne(castId(data))
    return data
  }

  const insertMany = async data => {
    const docs = await col.insertMany(data)
    return result(docs)
  }

  const updateById = (_id, data) => {
    return updateOne({ _id }, data)
  }

  const hasOperator = data => {
    return Object.keys(data).some(key => key.indexOf('$') !== 0)
  }

  const updateOne = async (query, data, options = {}) => {
    const update = hasOperator(data) ? { $set: data } : data

    const doc = await col.findOneAndUpdate(castId(query), castId(update), {
      returnDocument: 'after',
      ...options
    })

    return result(doc)
  }

  const updateMany = (query, data, options = {}) => {
    const update = hasOperator(data) ? { $set: data } : data
    return col.updateMany(query, update, options)
  }

  const deleteById = _id => {
    return deleteOne({ _id })
  }

  const deleteOne = async query => {
    const doc = await col.findOneAndDelete(castId(query))
    return result(doc)
  }

  const deleteMany = async (query = {}, options) => {
    return col.deleteMany(query, options)
  }

  const result = doc => {
    if (doc && typeof doc.value !== 'undefined') {
      return doc.value
    }

    if (doc.ok && doc.lastErrorObject && doc.lastErrorObject.n === 0) {
      return null
    }

    if (doc && typeof doc.ops !== 'undefined') {
      return doc.ops
    }

    return doc
  }

  const createIndex = (...args) => {
    return col.createIndex(...args)
  }

  const aggregate = (pipeline, { stream, ...options } = {}) => {
    return stream
      ? col.aggregate(pipeline, options)
      : col.aggregate(pipeline, options).toArray()
  }

  return {
    findOne,
    findById,
    findMany,
    insertOne,
    insertMany,
    updateById,
    updateOne,
    updateMany,
    deleteById,
    deleteOne,
    deleteMany,
    createIndex,
    aggregate,
    parseSort
  }
}

/**
 * Create MongoDB connected client.
 *
 * @param {String} uri
 * @return {Promise} db
 * @type public
 */

global.mongo = global.mongo || {}
const cached = global.mongo

const createDatabase = ({ mongo: uri, env } = {}) => {
  const dbName = 'hrtest'

  /**
   * Connect to mongodb.
   *
   * @return {Promise}
   * @type private
   */
  const connect = async () => {
    if (cached.conn) return cached.conn

    if (!cached.promise) {
      const conn = {}

      const opt = {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }

      cached.promise = MongoClient.connect(uri, opt)
        .then(client => {
          conn.client = client
          return client.db(dbName)
        })
        .then(db => {
          conn.db = db
          cached.conn = conn
        })
    }

    await cached.promise
    return cached.conn
  }

  /**
   * Close db connection.
   *
   * @return {Promise}
   * @type public
   */
  const close = () => {
    const { client } = cached.conn
    if (!client || !client.isConnected()) return
    return client.close(true)
  }

  /**
   * Get collection.
   *
   * @param {String} name
   * @return {Object}
   * @type public
   */
  const get = async (name, options = {}) => {
    const { db } = await connect()
    return collection(db.collection(name), { castIds: true, ...options })
  }

  /**
   * Drop the database.
   *
   * @param {String} name
   * @return {Object}
   * @type public
   */
  const dropDatabase = () => {
    const { client, db } = cached.conn
    if (!client || !client.isConnected()) return

    if (env === 'test' && dbName.includes('test')) {
      return db.dropDatabase()
    }
  }

  return {
    cast,
    close,
    get,
    id: getId,
    isObjectID,
    dropDatabase,
    parseSort,
    url: uri
  }
}

module.exports = createDatabase
