import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('routes transactions', () => {
	beforeAll(async () => {
		await app.ready()
	})

	afterAll(async () => {
		await app.close()
	})

	beforeEach(() => {
		execSync('npm run knex migrate:rollback --all')
		execSync('npm run knex migrate:latest')
	})

	it('should be able to create a new transaction', async () => {
		const response = await request(app.server)
			.post('/transactions')
			.send({ title: 'new transaction', amount: 500, type: 'credit' })

		expect(response.statusCode).toEqual(201)
	})

	it('should be able to list all transactions', async () => {
		const createTransactionResponse = await request(app.server)
			.post('/transactions')
			.send({ title: 't', amount: 1, type: 'credit' })
		const cookies = createTransactionResponse.get('Set-Cookie')

		const listTransactionResponse = await request(app.server)
			.get('/transactions')
			.set('Cookie', cookies)

		expect(listTransactionResponse.status).toEqual(200)
		expect(listTransactionResponse.body.transactions).toEqual([
			expect.objectContaining({ title: 't', amount: 1 }),
		])
	})

	it('should be able to get a specifc transaction', async () => {
		const createTransactionResponse = await request(app.server)
			.post('/transactions')
			.send({ title: 't', amount: 1, type: 'credit' })
		const cookies = createTransactionResponse.get('Set-Cookie')

		const listTransactionResponse = await request(app.server)
			.get('/transactions')
			.set('Cookie', cookies)
		const transactionId = listTransactionResponse.body.transactions[0].id

		const getTransactionResponse = await request(app.server)
			.get(`/transactions/${transactionId}`)
			.set('Cookie', cookies)

		expect(getTransactionResponse.status).toEqual(200)
		expect(getTransactionResponse.body.transaction).toEqual(
			expect.objectContaining({ title: 't', amount: 1 }),
		)
	})

	it('should be able to get the summary', async () => {
		const creditTransactionResponse = await request(app.server)
			.post('/transactions')
			.send({ title: 'c', amount: 5000, type: 'credit' })
		const cookies = creditTransactionResponse.get('Set-Cookie')

		await request(app.server)
			.post('/transactions')
			.set('Cookie', cookies)
			.send({ title: 'd', amount: 2000, type: 'debit' })

		await request(app.server).get('/transactions').set('Cookie', cookies)

		const summaryResponse = await request(app.server)
			.get('/transactions/summary')
			.set('Cookie', cookies)

		expect(summaryResponse.status).toEqual(200)
		expect(summaryResponse.body.summary).toEqual({ amount: 3000 })
	})
})
