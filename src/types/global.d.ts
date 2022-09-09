// TODO: figure out why this works locally but fails in the ubuntu prod env
import { RequestInfo, RequestInit, Response } from 'undici/types/fetch'

// Currently need to manually define Fetch for use in node 18+ global fetch
// Nodes global fetch was pulled from undici.
export declare global {
	function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>
}
