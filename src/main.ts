import { Notice, Plugin } from 'obsidian';
import { SonicNoteApiClient } from './api';
import { SyncService } from './sync';
import { SonicNoteSettingTab } from './settings';
import { DEFAULT_SETTINGS, SonicNotePluginSettings } from './types';

export default class SonicNoteSyncPlugin extends Plugin {
  settings: SonicNotePluginSettings = DEFAULT_SETTINGS;
  private api!: SonicNoteApiClient;
  private syncService!: SyncService;
  private statusBarEl!: HTMLElement;

  async onload() {
    await this.loadSettings();

    // Initialize API client and sync service
    this.api = new SonicNoteApiClient(() => this.settings);
    this.syncService = new SyncService(
      this.app,
      this.api,
      () => this.settings,
      () => this.saveSettings()
    );

    // Status bar
    this.statusBarEl = this.addStatusBarItem();
    this.updateStatusBar();

    // Ribbon icon
    this.addRibbonIcon('headphones', 'SonicNote Sync: 同步录音', () => {
      this.triggerSync();
    });

    // Commands
    this.addCommand({
      id: 'sonicnote-sync:sync',
      name: '同步录音',
      callback: () => this.triggerSync(),
    });

    this.addCommand({
      id: 'sonicnote-sync:login',
      name: '登录',
      callback: () => {
        // @ts-ignore - internal API to open settings
        this.app.setting.open();
        // @ts-ignore
        this.app.setting.openTabById('sonicnote-sync');
      },
    });

    this.addCommand({
      id: 'sonicnote-sync:logout',
      name: '登出',
      callback: async () => {
        this.settings.token = '';
        this.settings.phoneNumber = '';
        await this.saveSettings();
        new Notice('已登出 SonicNote');
        this.updateStatusBar();
      },
    });

    // Settings tab
    this.addSettingTab(new SonicNoteSettingTab(
      this.app,
      this,
      this.api,
      () => this.settings,
      () => this.saveSettings()
    ));

    console.log('SonicNote Sync plugin loaded');
  }

  onunload() {
    console.log('SonicNote Sync plugin unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async triggerSync() {
    if (!this.api.isAuthenticated()) {
      new Notice('请先登录 SonicNote（设置 → SonicNote Sync）');
      return;
    }

    this.statusBarEl.setText('SonicNote: 同步中...');

    try {
      const result = await this.syncService.syncAll((msg) => {
        this.statusBarEl.setText(`SonicNote: ${msg}`);
      });

      let message = `同步完成: ${result.synced} 条新/更新`;
      if (result.skipped > 0) message += `, ${result.skipped} 条跳过`;
      if (result.errors > 0) message += `, ${result.errors} 条失败`;

      new Notice(message, 5000);
      this.updateStatusBar();
    } catch (e) {
      new Notice(`同步失败: ${e instanceof Error ? e.message : '未知错误'}`);
      this.updateStatusBar();
    }
  }

  private updateStatusBar() {
    if (this.api.isAuthenticated()) {
      const lastSync = this.settings.lastSyncTime
        ? `上次同步: ${this.settings.lastSyncTime}`
        : '未同步';
      this.statusBarEl.setText(`SonicNote: ${lastSync}`);
    } else {
      this.statusBarEl.setText('SonicNote: 未登录');
    }
  }
}
