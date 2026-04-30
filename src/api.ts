import { requestUrl, RequestUrlParam } from 'obsidian';
import { BackendResponse, Recording, TranscriptSegment, SummaryData, ZnotePluginSettings } from './types';

export class ZnoteApiClient {
  constructor(private getSettings: () => ZnotePluginSettings) {}

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

    const params: RequestUrlParam = {
      url,
      method,
      headers,
    };

    if (method === 'POST' && options?.body) {
      headers['Content-Type'] = 'application/json';
      params.body = JSON.stringify(options.body);
    }

    const response = await requestUrl(params);
    return response.json as BackendResponse;
  }

  async login(phone: string, code: string): Promise<{ token: string; userId: string }> {
    const res = await this.request('POST', '/app/user/loginByPhone', {
      body: { phonenumber: phone, code: code },
    });
    if (res.code !== 200) {
      throw new Error(res.msg || '登录失败');
    }
    return {
      token: res.data.token || res.data,
      userId: res.data.userId || '',
    };
  }

  async fetchRecordingList(page: number, size: number): Promise<{ list: Recording[]; total: number }> {
    const res = await this.request('GET', '/app/recording/list', {
      query: { page, size },
    });
    if (res.code !== 200) {
      throw new Error(res.msg || '获取录音列表失败');
    }
    return {
      list: res.data?.records || res.data?.list || [],
      total: res.data?.total || 0,
    };
  }

  async fetchRecordingDetail(audioId: string): Promise<Recording> {
    const res = await this.request('GET', '/app/recording/detail', {
      query: { audioId },
    });
    if (res.code !== 200) {
      throw new Error(res.msg || '获取录音详情失败');
    }
    return res.data;
  }

  async fetchNote(audioId: string): Promise<string> {
    const res = await this.request('GET', '/app/recording/getNote', {
      query: { audioId },
    });
    if (res.code !== 200) {
      return '';
    }
    return res.data?.note || '';
  }

  async fetchTranscriptResult(audioId: string): Promise<TranscriptSegment[]> {
    const res = await this.request('GET', `/share/${audioId}/transcript/result`);
    if (res.code !== 200) {
      return [];
    }
    return res.data || [];
  }

  async fetchSummary(audioId: string): Promise<SummaryData | null> {
    const res = await this.request('GET', `/share/${audioId}/summary`);
    if (res.code !== 200) {
      return null;
    }
    return res.data;
  }
}
