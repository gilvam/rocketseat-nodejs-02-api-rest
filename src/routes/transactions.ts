import { knex } from '../database'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'node:crypto'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

const TABLE_NAME = 'transactions'

export async function transactionRoutes(app: FastifyInstance) {
	app.addHook('preHandler', async (request, reply) => {
		// console.log(`[${request.method}]`, request.url)
	})

	app.get(
		'/',
		{ preHandler: [checkSessionIdExists] },
		async (request, reply) => {
			const { sessionId } = request.cookies
			const transactions = await knex(TABLE_NAME)
				.where('session_id', sessionId)
				.select()

			return { transactions }
		},
	)

	app.get(
		'/:id',
		{ preHandler: [checkSessionIdExists] },
		async (request, reply) => {
			const getTransactionParamsSchema = z.object({
				id: z.string().uuid(),
			})
			const { id } = getTransactionParamsSchema.parse(request.params)
			const { sessionId } = request.cookies
			const transaction = await knex(TABLE_NAME)
				.where({ session_id: sessionId, id })
				.first()

			return { transaction }
		},
	)

	app.get(
		'/summary',
		{ preHandler: [checkSessionIdExists] },
		async (request) => {
			const { sessionId } = request.cookies
			const response = await knex(TABLE_NAME)
				.where('session_id', sessionId)
				.sum('amount', { as: 'amount' })
				.first()

			return { summary: response }
		},
	)

	app.post('/', async (request, reply) => {
		const createTransactionBodySchema = z.object({
			title: z.string(),
			amount: z.number(),
			type: z.enum(['credit', 'debit']),
		})
		const { title, amount, type } = createTransactionBodySchema.parse(
			request.body,
		)
		let sessionId = request.cookies.sessionId

		if (!sessionId) {
			sessionId = randomUUID()
			reply.cookie('sessionId', sessionId, {
				path: '/',
				maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
			})
		}

		await knex(TABLE_NAME).insert({
			id: crypto.randomUUID(),
			title,
			amount: type === 'credit' ? amount : amount * -1,
			session_id: sessionId,
		})

		return reply.status(201).send()
	})
}
