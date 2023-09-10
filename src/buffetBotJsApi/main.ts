import Fastify from 'fastify'

const fastify = Fastify()
const port = 1080

fastify.get('/Email', async (_request, reply) => {
	await reply.send('command removed.')
})

// Run the server!
function start() {
	try {
		fastify.listen({ port: port }, (error: any) => {
			if (error) {
				console.log(error)
			}
		})

		console.log(`Buffet Bot API: Listening on port: ${port}`)
	} catch (err) {
		console.log('Error in start()', err)
		fastify.log.error(err)
		process.exit(1)
	}
}
start()
