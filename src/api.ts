import { requestUrl } from 'obsidian';
import { BackendResponse, Recording, TranscriptSegment, SummaryData, StudyReportData } from './types';

export class SonicNoteApiClient {
	constructor(private getSettings: () => { token: string; serverUrl: string }) {}

	isAuthenticated(): boolean {
		return this.getSettings().token !== '';
	}

	private get serverUrl(): string {
		return this.getSettings().serverUrl;
	}

	private get token(): string {
		return this.getSettings().token;
	}

	private async request(method: 'GET' | 'POST', path: string, options?: { query?: Record<string, string | number>; body?: unknown }): Promise<BackendResponse> {
		let url = `${this.serverUrl}${path}`;
		if (options?.query) {
			const params = new URLSearchParams();
			for (const [k, v] of Object.entries(options.query)) {
				if (v !== undefined && v !== null) params.set(k, String(v));
			}
			url += '?' + params.toString();
		}

		const headers: Record<string, string> = {};
		if (this.token) {
			headers['Authorization'] = `Bearer ${this.token}`;
		}

		if (method === 'POST' && options?.body) {
			headers['Content-Type'] = 'application/json';
		}

		try {
			const response = await requestUrl({
				url,
				method,
				headers,
				body: method === 'POST' && options?.body ? JSON.stringify(options.body) : undefined,
			});
			return response.json as BackendResponse;
		} catch (e: unknown) {
			const err = e as { json?: BackendResponse; message?: string };
			if (err?.json) {
				return err.json as BackendResponse;
			}
			console.error(`[SonicNote] 请求失败 ${method} ${path}:`, err?.message || e);
			throw new Error(err?.message || `请求失败: ${method} ${path}`);
		}
	}

	async login(apiKey: string): Promise<{ token: string; userId: string }> {
		const res = await this.request('POST', '/app/mcp/login', {
			body: { apiKey },
		});
		if (res.code !== 200) {
			throw new Error(res.msg || '登录失败');
		}
		const data = res.data as { token?: string; user?: { userId: string }; userId?: string };
		const token = typeof data === 'string' ? data : data?.token;
		if (!token) {
			throw new Error('登录响应中缺少 token');
		}
		return {
			token,
			userId: data?.user?.userId || data?.userId || '',
		};
	}

	async fetchRecordingList(page: number, size: number): Promise<{ list: Recording[]; total: number }> {
		const res = await this.request('GET', '/app/recording/list', {
			query: { page, size },
		});
		if (res.code !== 200) {
			throw new Error(res.msg || '获取录音列表失败');
		}
		const data = res.data as { records?: Recording[]; list?: Recording[]; total?: number };
		return {
			list: data?.records || data?.list || [],
			total: data?.total || 0,
		};
	}

	async fetchRecordingDetail(audioId: string): Promise<Recording> {
		const res = await this.request('GET', '/app/recording/detail', {
			query: { audioId },
		});
		if (res.code !== 200) {
			throw new Error(res.msg || '获取录音详情失败');
		}
		return res.data as Recording;
	}

	async fetchNote(audioId: string): Promise<string> {
		const res = await this.request('GET', '/app/recording/getNote', {
			query: { audioId },
		});
		if (res.code !== 200) {
			return '';
		}
		const data = res.data as { note?: string };
		return data?.note || '';
	}

	async fetchTranscriptResult(audioId: string): Promise<TranscriptSegment[]> {
		const res = await this.request('GET', `/share/${audioId}/transcript/result`);
		if (res.code !== 200) {
			return [];
		}
		return (res.data as TranscriptSegment[]) || [];
	}

	async fetchSummary(audioId: string): Promise<SummaryData | null> {
		const res = await this.request('GET', `/share/${audioId}/summary`);
		if (res.code !== 200) {
			return null;
		}
		return res.data as SummaryData;
	}

	async fetchStudyReport(audioId: string): Promise<StudyReportData | null> {
		const res = await this.request('GET', `/share/${audioId}/studyReport`);
		if (res.code !== 200) {
			return null;
		}
		return res.data as StudyReportData;
	}
}
