// ===== 插件设置 =====

export interface ZnotePluginSettings {
  serverUrl: string;
  syncFolder: string;
  pageSize: number;
  token: string;
  phoneNumber: string;
  lastSyncTime: string;
}

export const DEFAULT_SETTINGS: ZnotePluginSettings = {
  serverUrl: 'http://ainote.easylinkin.com:8048',
  syncFolder: 'ZnoteSync',
  pageSize: 50,
  token: '',
  phoneNumber: '',
  lastSyncTime: '',
};

// ===== 后端数据类型 =====

export interface BackendResponse {
  code: number;
  msg: string;
  data: any;
}

export interface Recording {
  audioId: string;
  userId: string;
  deviceId: string;
  audioUrl: string;
  recordTime: string;
  recordName: string;
  recordNickName: string;
  duration: string;
  note: string;
  recordType: string;
  isTranscribed: string;
  isSummarized: string;
  transcriptStatus: number;
  summaryStatus: number;
  delFlag: string;
  deviceName: string;
  createTime: string;
  updateTime: string;
}

export interface TranscriptSegment {
  spokesperson: string;
  text: string;
  time: number;
}

export interface SummaryData {
  summaryId: string;
  audioId: string;
  summaryContent: string;
  templateId: string;
  status: number;
}

// ===== 同步相关 =====

export interface LocalFileInfo {
  path: string;
  syncTime: string;
}

export interface SyncResult {
  total: number;
  synced: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
}
