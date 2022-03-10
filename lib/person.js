module.exports = ({ db, mocks }) => {
  const setIndexes = async () => {
    const people = await db.get('people')
    people.createIndex({ email: 1 })
    people.createIndex({ docId: 1 })
    people.createIndex({ country: 1 })
  }

  const fetch = async () => {
    const people = await db.get('people')
  }

  const create = async () => {
    const people = await db.get('people')
  }

  const update = async () => {
    const people = await db.get('people')
  }

  setIndexes().catch(console.log)

  return { create, update, fetch }
}
