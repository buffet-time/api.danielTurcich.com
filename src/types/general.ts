import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import type { FastifyBaseLogger, FastifyInstance } from 'fastify'
import type { IncomingMessage, Server, ServerResponse } from 'http'

export type ServerType = FastifyInstance<
	Server<typeof IncomingMessage, typeof ServerResponse>,
	IncomingMessage,
	ServerResponse<IncomingMessage>,
	FastifyBaseLogger,
	JsonSchemaToTsProvider<{}>
>
