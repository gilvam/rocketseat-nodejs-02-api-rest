import { knex } from '../database'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'node:crypto'

const TABLE_NAME = 'transactions'

export async function transactionRoutes(app: FastifyInstance) {
	app.get('/', async (request, reply) => {
		const transactions = await knex(TABLE_NAME).select()
		return { transactions }
	})

	app.get('/:id', async (request, reply) => {
		const getTransactionParamsSchema = z.object({
			id: z.string().uuid(),
		})
		const { id } = getTransactionParamsSchema.parse(request.params)
		const transaction = await knex(TABLE_NAME).where('id', id).first()

		return { transaction }
	})

	app.get('/summary', async (request) => {
		return knex(TABLE_NAME).sum('amount', { as: 'amount' }).first()
	})

	app.post('/', async (request, reply) => {
		const createTransactionBodySchema = z.object({
			title: z.string(),
			amount: z.number(),
			type: z.enum(['credit', 'debit']),
		})
		const { title, amount, type } = createTransactionBodySchema.parse(request.body)

		await knex(TABLE_NAME).insert({
			id: crypto.randomUUID(),
			title,
			amount: type === 'credit' ? amount : amount * -1,
		})

		return reply.status(201).send()
	})
}
