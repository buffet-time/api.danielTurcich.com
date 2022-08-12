/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { google as Google } from 'googleapis'
import { authorize } from '../shared/googleApis.js'
import FileSystem from 'fs/promises'
import { redditCredentials } from './credentials/credentials.js'
import { default as Fastify } from 'fastify'
import snoowrap from 'snoowrap'
import { type OAuth2Client } from 'google-auth-library'

const reddit = new snoowrap(redditCredentials)
const fastify = Fastify()
const port = 1080
let gmailAuthClient: OAuth2Client

fastify.get('/Email', async (request: any, reply) => {
	try {
		const to = request.query.to as string
		const subject = request.query.subject as string
		const message = request.query.message as string

		reply.send(sendEmail(to, subject, message))
	} catch (error) {
		console.log(`Error in /Email request:\n ${error}`)
	}
})

fastify.get('/Reddit/Top/Femboy', async (_request, reply) => {
	try {
		const redditResponse = await reddit
			.getSubreddit('femboy')
			.getHot({ limit: 1 })
		// pinned messages have stickied set to true
		const topPost = redditResponse.filter((post) => post.stickied === false)
		reply.send({ url: topPost[0].url })
	} catch (error) {
		console.log(`Error in /Reddit/Top/Femboy request:\n ${error}`)
	}
})

// Run the server!
async function start() {
	try {
		fastify.listen(port, (error) => {
			if (error) {
				console.log(error)
			}
		})

		const onStart = async () => {
			try {
				const gmailCredentialsPath = `./credentials/emailCredentials.json`
				const gmailTokenPath = `./credentials/emailToken.json`
				const gmailScopes = ['https://www.googleapis.com/auth/gmail.send']
				const content = await FileSystem.readFile(gmailCredentialsPath, 'utf-8')
				gmailAuthClient = await authorize({
					credentials: JSON.parse(content),
					scopes: gmailScopes,
					tokenPath: gmailTokenPath
				})
			} catch (error) {
				throw new Error('No emailCredentials.json, check readme.md')
			}
			console.log(`Listening on port: ${port}`)
		}

		onStart()
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}
start()

function sendEmail(to: string, subject: string, message: string) {
	try {
		Google.gmail({ version: 'v1', auth: gmailAuthClient }).users.messages.send({
			auth: gmailAuthClient,
			userId: 'buffetsbot@gmail.com',
			requestBody: {
				raw: makeBody(to, 'buffetsbot@gmail.com', subject, message)
			}
		})
		return 'good'
	} catch (error) {
		return 'error'
	}
}

function makeBody(to: string, from: string, subject: string, message: string) {
	return Buffer.from(
		[
			'Content-Type: text/plain; charset="UTF-8"\n',
			'MIME-Version: 1.0\n',
			'Content-Transfer-Encoding: 7bit\n',
			'to: ',
			to,
			'\n',
			'from: ',
			from,
			'\n',
			'subject: ',
			subject,
			'\n\n',
			message
		].join('')
	)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
}
