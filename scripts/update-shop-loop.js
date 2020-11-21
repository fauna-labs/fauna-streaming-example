
import faunadb from 'faunadb'
import { Client, query as q } from 'faunadb'
import faker from 'faker'
import { askKeyOrGetFromtEnvVars, getRandom } from './helpers'
require('dotenv').config({ path: '.env' })

const { Collection, Paginate, Documents, Lambda, Get, Var, Update, Do } = q

const NUMBEROFPRODUCTS = 100000

const main = async () => {
    // To set up we need an admin key either set in env vars or filled in when the script requests it.
    const adminKey = await askKeyOrGetFromtEnvVars()

    const client = new Client({
        secret: adminKey,
        domain: process.env.REACT_APP_FAUNA_DOMAIN || 'db.fauna.com',
        scheme: process.env.REACT_APP_FAUNA_SCHEME || 'https'
    })
    try {
        await updateRandomShopItems(client)
    } catch (err) {
        console.error('Unexpected error', err)
    }
}


const updateRandomShopItems = async (client) => {
    const references = await client.query(
        q.Map(
            Paginate(Documents(Collection(process.env.REACT_APP_FAUNA_COLLECTION)), { size: NUMBEROFPRODUCTS }),
            Lambda('ref', Get(Var('ref')))
        )
    )


    const loop = async () => {
        try {
            const randomObjs = getRandom(references.data, 20)
            const queries = []
            await Promise.all(
                randomObjs.map(async (randomObj) => {
                    const stockDifference = randomObj.data.available > 5
                        ? (- Math.max(Math.min(randomObj.data.available, Math.round(Math.random() * 10)), 1))
                        : Math.round(Math.random() * 90)
                    const newPrice = randomObj.data.price = Math.round(randomObj.data.price + (Math.random() * 100))
                    const available = randomObj.data.available + stockDifference
                    // updating price and stock (available)
                    queries.push(Update(
                        randomObj.ref,
                        {
                            data: { available: available, price: newPrice }
                        }))
                    randomObj.data.available = available
                }))
            await client.query(
                Do(...queries)
            )
            console.log('updated 20 objects')
        }
        catch (err) {
            console.error(err)
        }
        setTimeout(loop, 10)
    }
    loop()
}


main();