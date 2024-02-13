import { RequestInfo, RequestInit, Response } from 'undici/types/fetch'

// Currently need to manually define Fetch for use in node 18+ global fetch
// Nodes global fetch was pulled from undici.
declare global {
	function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>
}

// This is a wrapper around the Fetch WebAPI to handle errors without any fuss
export async function ProperFetch(
	input: RequestInfo,
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	init?: RequestInit | undefined
): Promise<any> {
	try {
		console.log(100, input)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const response = init ? await fetch(input, init) : await fetch(input)

		// console.log(101, response)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		console.log(await response.text())

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (response.ok) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			return await response.json()
		}

		// if (response.)

		// eslint-disable-next-line @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		console.error('Responded with an error:' + (await response.json()))
		return null
	} catch (error: any) {
		console.error(`Error in fetch call: ${error}`)
		return null
	}
}
