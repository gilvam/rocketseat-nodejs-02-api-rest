import fastify from 'fastify'
import { env } from './env'
import { knex } from './database'

const app = fastify()

console.log(`env: `, env)

app.get('/hello', async () => {
	return knex('transactions').where('amount', 1000).select('*')
})

app.listen({ port: env.PORT }).then(() => {
	console.log('HTTP Server Running')
})
