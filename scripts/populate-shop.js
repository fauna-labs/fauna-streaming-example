
import faunadb from 'faunadb'
import { Client, query as q } from 'faunadb'
import faker from 'faker'
import { askKeyOrGetFromtEnvVars } from './helpers'
require('dotenv').config({ path: '.env' })

const { Collection, Create, Do } = q

// When increasing this number keep in mind that your transaction might be too big 
// and therefore refused
const NUMBEROFPRODUCTS = 50

const main = async () => {
    // To set up we need an admin key either set in env vars or filled in when the script requests it.
    const adminKey = await askKeyOrGetFromtEnvVars()
    console.log('Creating 50 products')
    const client = new Client({
        secret: adminKey,
        domain: process.env.REACT_APP_FAUNA_DOMAIN || 'db.fauna.com',
        scheme: process.env.REACT_APP_FAUNA_SCHEME || 'https'
    })
    try {
        await createRandomShopItems(client)
    } catch (err) {
        console.error('Unexpected error', err)
    }
}


const createRandomShopItems = async (client) => {
    let toGenerate = NUMBEROFPRODUCTS;
    let queries = []
    while (toGenerate > 0) {

        const productData = {
            name: faker.commerce.productName(),
            color: faker.commerce.color(),
            price: faker.commerce.price(),
            material: faker.commerce.productMaterial(),
            available: Math.round(Math.random() * 100)
        }
        console.log(productData)
        queries.push(Create(Collection(process.env.REACT_APP_FAUNA_COLLECTION), {
            data: productData
        }))
        toGenerate--

    }

    await client.query(
        Do(...queries)
    )
}


main();