const { cloneDeep } = require('lodash')

module.exports = ({ db, mocks }) => {
  const setIndexes = async () => {
    const passes = await db.get('passes')
    passes.createIndex({ docId: 1 })
    passes.createIndex({ userId: 1 })
    passes.createIndex({ country: 1 })
    passes.createIndex({ name: 1 })
    passes.createIndex({ surname: 1 })
    passes.createIndex({ residentCountry: 1 })
    passes.createIndex({ statusCodes: 1 })
    passes.createIndex({ resident: 1 })
    passes.createIndex({ airline: 1 })
    passes.createIndex({ arrivalDate: 1 })
    passes.createIndex({ covidVaccine: 1 })
    passes.createIndex({ covidVaccineStatus: 1 })
    passes.createIndex({ covidVaccineDoses: 1 })
    passes.createIndex({ arrivalDate: 1, country: 1 })
    passes.createIndex({ airline: 1, arrivalDate: 1 })
    passes.createIndex({ arrivalDate: 1, userId: 1 })
    passes.createIndex({ arrivalDate: 1, docId: 1, country: 1 })
    passes.createIndex({ arrivalDate: 1, insuranceCompany: 1 })
    passes.createIndex({ arrivalDate: 1, country: 1, insuranceCompany: 1 })

    passes.createIndex({
      resident: 1,
      country: 1,
      arrivalDate: 1,
      covidVaccineDoses: 1,
      covidVaccineStatus: 1
    })

    passes.createIndex({
      country: 1,
      resident: 1,
      arrivalDate: 1,
      covidVaccineStatus: 1,
      insuranceCompany: 1
    })

    passes.createIndex({
      country: 1,
      resident: 1,
      arrivalDate: 1,
      covidVaccineStatus: 1
    })

    passes.createIndex({
      arrivalDate: 1,
      country: 1,
      covidVaccine: 1,
      covidVaccineCountry: 1
    })

    passes.createIndex({
      arrivalDate: 1,
      country: 1,
      resident: 1,
      covidVaccine: 1,
      covidVaccineCountry: 1
    })

    passes.createIndex({
      status: 1,
      arrivalDate: 1,
      country: 1,
      resident: 1,
      covidVaccine: 1,
      covidVaccineCountry: 1
    })

    passes.createIndex({
      name: 'text',
      surname: 'text',
      docId: 'text',
      phone: 'text',
      email: 'text'
    })
  }

  const fetch = async () => {
    const passes = await db.get('passes')
  }

  const create = async (data = {}) => {
    const passes = await db.get('passes')
    const doc = cloneDeep({ ...mocks.pass, ...data })
    return passes.insertOne(doc)
  }

  const update = async () => {
    const passes = await db.get('passes')
    const data = cloneDeep(mocks.pass)
    return passes.updateOne(data)
  }

  setIndexes().catch(console.log)

  return { create, update, fetch }
}
