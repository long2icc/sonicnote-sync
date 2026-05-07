import { App, Notice, TFile, TFolder } from 'obsidian';
import { SonicNoteApiClient } from './api';
import { SonicNotePluginSettings, LocalFileInfo, Recording, SyncResult, TranscriptSegment, SummaryData } from './types';
import { formatFileName, toMarkdown } from './formatter';

export class SyncService {
  private api: SonicNoteApiClient;
  private app: App;
  private getSettings: () => SonicNotePluginSettings;
  private saveSettings: () => Promise<void>;

  constructor(
    app: App,
    api: SonicNoteApiClient,
    getSettings: () => SonicNotePluginSettings,
    saveSettings: () => Promise<void>
  ) {
    this.app = app;
    this.api = api;
    this.getSettings = getSettings;
    this.saveSettings = saveSettings;
  }

  async syncAll(onProgress?: (msg: string) => void): Promise<SyncResult> {
    const settings = this.getSettings();
    const result: SyncResult = { total: 0, synced: 0, skipped: 0, errors: 0, errorMessages: [] };

    // 1. Ensure sync folder exists
    await this.ensureFolder(settings.syncFolder);

    // 2. Build local index
    onProgress?.('正在读取本地索引...');
    const localIndex = await this.buildLocalIndex(settings.syncFolder);

    // 3. Fetch all recordings from backend
    onProgress?.('正在从服务器拉取录音列表...');
    let page = 1;
    let allRecordings: Recording[] = [];

    while (true) {
      try {
        const res = await this.api.fetchRecordingList(page, settings.pageSize);
        allRecordings = allRecordings.concat(res.list);
        if (allRecordings.length >= res.total || res.list.length === 0) break;
        page++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : '获取录音列表失败';
        result.errorMessages.push(msg);
        new Notice(`同步失败: ${msg}`);
        return result;
      }
    }

    // Filter out deleted
    allRecordings = allRecordings.filter(r => r.delFlag !== '2');
    result.total = allRecordings.length;

    // 4. Process each recording
    for (let i = 0; i < allRecordings.length; i++) {
      const recording = allRecordings[i];
      onProgress?.(`正在同步 ${i + 1}/${result.total}: ${recording.recordNickName || recording.recordName}`);

      try {
        await this.processRecording(recording, localIndex, settings);
        result.synced++;
      } catch (e) {
        result.errors++;
        const msg = e instanceof Error ? e.message : '未知错误';
        result.errorMessages.push(`${recording.recordNickName || recording.recordName}: ${msg}`);
      }
    }

    // 5. Update last sync time
    const now = new Date().toISOString();
    settings.lastSyncTime = now;
    await this.saveSettings();

    return result;
  }

  private async ensureFolder(folderPath: string): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    }
  }

  async buildLocalIndex(syncFolder: string): Promise<Map<string, LocalFileInfo>> {
    const index = new Map<string, LocalFileInfo>();
    const folder = this.app.vault.getAbstractFileByPath(syncFolder);
    if (!(folder instanceof TFolder)) return index;

    for (const file of folder.children) {
      if (!(file instanceof TFile) || file.extension !== 'md') continue;

      try {
        const content = await this.app.vault.read(file);
        const audioId = this.extractFrontmatterField(content, 'audio_id');
        const syncTime = this.extractFrontmatterField(content, 'sync_time');
        if (audioId) {
          index.set(audioId.replace(/"/g, ''), { path: file.path, syncTime: syncTime || '' });
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return index;
  }

  private extractFrontmatterField(content: string, field: string): string | null {
    const match = content.match(new RegExp(`^${field}:\\s*"?([^"]*)"\\s*$`, 'm'));
    return match ? match[1] : null;
  }

  private async processRecording(recording: Recording, localIndex: Map<string, LocalFileInfo>, settings: SonicNotePluginSettings): Promise<void> {
    const syncTime = new Date().toISOString();

    const local = localIndex.get(recording.audioId);

    // Found existing file for this audioId — update it
    if (local && local.path) {
      // Skip if no update needed (has updateTime and it's older than syncTime)
      if (local.syncTime && recording.updateTime && recording.updateTime <= local.syncTime) {
        return;
      }

      const file = this.app.vault.getAbstractFileByPath(local.path);
      if (file instanceof TFile) {
        // Check for conflict (user edited file locally after sync)
        const fileMtime = new Date(file.stat.mtime).toISOString();
        if (local.syncTime && fileMtime > local.syncTime) {
          await this.writeRecordingToNewFile(recording, syncTime, settings, local.path);
          return;
        }

        // Update existing file
        const content = await this.buildRecordingContent(recording, syncTime);
        await this.app.vault.modify(file, content);
        localIndex.set(recording.audioId, { path: local.path, syncTime });
        return;
      }
    }

    // New recording — create file
    await this.writeRecordingToNewFile(recording, syncTime, settings);
    localIndex.set(recording.audioId, {
      path: `${settings.syncFolder}/${formatFileName(recording)}.md`,
      syncTime,
    });
  }

  private async writeRecordingToNewFile(recording: Recording, syncTime: string, settings: SonicNotePluginSettings, conflictWithPath?: string): Promise<void> {
    const content = await this.buildRecordingContent(recording, syncTime);
    let fileName = formatFileName(recording);

    if (conflictWithPath) {
      // Create conflict copy
      const timestamp = Date.now();
      fileName = `${fileName}-conflict-${timestamp}`;
    }

    // Deduplicate filename
    let filePath = `${settings.syncFolder}/${fileName}.md`;
    let counter = 2;
    while (await this.app.vault.adapter.exists(filePath)) {
      filePath = `${settings.syncFolder}/${fileName}-${counter}.md`;
      counter++;
    }

    await this.app.vault.create(filePath, content);
  }

  private async buildRecordingContent(recording: Recording, syncTime: string): Promise<string> {
    const settings = this.getSettings();
    const tasks: [string, Promise<TranscriptSegment[] | SummaryData | string | null>][] = [];

    // Fetch transcript if enabled and available (status 2 = completed)
    let transcript: TranscriptSegment[] | null = null;
    if (settings.includeTranscript && recording.transcriptStatus === 2) {
      tasks.push(['transcript', this.api.fetchTranscriptResult(recording.audioId).catch(() => null)]);
    }

    // Fetch summary if available (status 2 = completed)
    let summary: SummaryData | null = null;
    if (recording.summaryStatus === 2) {
      tasks.push(['summary', this.api.fetchSummary(recording.audioId).catch(() => null)]);
    }

    // Fetch note
    let note = '';
    tasks.push(['note', this.api.fetchNote(recording.audioId).catch(() => '')]);

    // Execute all requests in parallel
    const results = await Promise.all(tasks.map(([_, p]) => p));
    tasks.forEach(([name], i) => {
      const val = results[i];
      if (name === 'transcript') transcript = val as TranscriptSegment[] | null;
      if (name === 'summary') summary = val as SummaryData | null;
      if (name === 'note') note = (val as string) || '';
    });

    return toMarkdown(recording, transcript, summary, note, syncTime);
  }
}
