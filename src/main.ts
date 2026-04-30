import { Notice, Plugin } from 'obsidian';
import { ZnoteApiClient } from './api';
import { SyncService } from './sync';
import { ZnoteSettingTab } from './settings';
import { DEFAULT_SETTINGS, ZnotePluginSettings } from './types';

export default class ZnoteSyncPlugin extends Plugin {
  settings: ZnotePluginSettings = DEFAULT_SETTINGS;
  private api!: ZnoteApiClient;
  private syncService!: SyncService;
  private statusBarEl!: HTMLElement;

  async onload() {
    await this.loadSettings();

    // Initialize API client and sync service
    this.api = new ZnoteApiClient(() => this.settings);
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
    this.addRibbonIcon('headphones', 'Znote Sync: 同步录音', () => {
      this.triggerSync();
    });

    // Commands
    this.addCommand({
      id: 'znote-sync:sync',
      name: '同步录音',
      callback: () => this.triggerSync(),
    });

    this.addCommand({
      id: 'znote-sync:login',
      name: '登录',
      callback: () => {
        // @ts-ignore - internal API to open settings
        this.app.setting.open();
        // @ts-ignore
        this.app.setting.openTabById('znote-sync');
      },
    });

    this.addCommand({
      id: 'znote-sync:logout',
      name: '登出',
      callback: async () => {
        this.settings.token = '';
        this.settings.phoneNumber = '';
        await this.saveSettings();
        new Notice('已登出 Znote');
        this.updateStatusBar();
      },
    });

    // Settings tab
    this.addSettingTab(new ZnoteSettingTab(
      this.app,
      this,
      this.api,
      () => this.settings,
      () => this.saveSettings()
    ));

    console.log('Znote Sync plugin loaded');
  }

  onunload() {
    console.log('Znote Sync plugin unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async triggerSync() {
    if (!this.api.isAuthenticated()) {
      new Notice('请先登录 Znote（设置 → Znote Sync）');
      return;
    }

    this.statusBarEl.setText('Znote: 同步中...');

    try {
      const result = await this.syncService.syncAll((msg) => {
        this.statusBarEl.setText(`Znote: ${msg}`);
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
        ? `上次同步: ${this.settings.lastSyncTime.substring(0, 16).replace('T', ' ')}`
        : '未同步';
      this.statusBarEl.setText(`Znote: ${lastSync}`);
    } else {
      this.statusBarEl.setText('Znote: 未登录');
    }
  }
}
