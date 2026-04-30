import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ZnoteApiClient } from './api';
import { ZnotePluginSettings, DEFAULT_SETTINGS } from './types';

export class ZnoteSettingTab extends PluginSettingTab {
  private api: ZnoteApiClient;
  private getSettings: () => ZnotePluginSettings;
  private saveSettings: () => Promise<void>;

  constructor(
    app: App,
    plugin: Plugin,
    api: ZnoteApiClient,
    getSettings: () => ZnotePluginSettings,
    saveSettings: () => Promise<void>
  ) {
    super(app, plugin);
    this.api = api;
    this.getSettings = getSettings;
    this.saveSettings = saveSettings;
  }

  display(): void {
    const { containerEl } = this;
    const settings = this.getSettings();
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Znote Sync 设置' });

    // Server URL
    new Setting(containerEl)
      .setName('服务器地址')
      .setDesc('智音笔记后端服务地址')
      .addText(text => text
        .setPlaceholder('http://localhost:8048')
        .setValue(settings.serverUrl)
        .onChange(async (value) => {
          settings.serverUrl = value;
          await this.saveSettings();
        }));

    // Sync folder
    new Setting(containerEl)
      .setName('同步文件夹')
      .setDesc('录音 Markdown 文件存放的文件夹（相对于 Vault 根目录）')
      .addText(text => text
        .setPlaceholder('ZnoteSync')
        .setValue(settings.syncFolder)
        .onChange(async (value) => {
          settings.syncFolder = value;
          await this.saveSettings();
        }));

    // Login status & actions
    const loginSection = containerEl.createDiv();
    loginSection.createEl('h3', { text: '账号' });

    if (this.api.isAuthenticated()) {
      new Setting(loginSection)
        .setName('登录状态')
        .setDesc(`已登录: ${settings.phoneNumber}`)
        .addButton(btn => btn
          .setButtonText('登出')
          .setWarning()
          .onClick(async () => {
            settings.token = '';
            settings.phoneNumber = '';
            await this.saveSettings();
            new Notice('已登出');
            this.display();
          }));
    } else {
      new Setting(loginSection)
        .setName('登录')
        .setDesc('使用手机号和验证码登录智音笔记')
        .addButton(btn => btn
          .setButtonText('登录')
          .onClick(() => {
            new LoginModal(this.app, this.api, this.getSettings, this.saveSettings, () => this.display()).open();
          }));
    }
  }
}

class LoginModal extends Modal {
  private api: ZnoteApiClient;
  private getSettings: () => ZnotePluginSettings;
  private saveSettings: () => Promise<void>;
  private onCloseCallback: () => void;

  constructor(
    app: App,
    api: ZnoteApiClient,
    getSettings: () => ZnotePluginSettings,
    saveSettings: () => Promise<void>,
    onCloseCallback: () => void
  ) {
    super(app);
    this.api = api;
    this.getSettings = getSettings;
    this.saveSettings = saveSettings;
    this.onCloseCallback = onCloseCallback;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '登录智音笔记' });

    let phone = '';
    let code = '';

    new Setting(contentEl)
      .setName('手机号')
      .addText(text => text
        .setPlaceholder('请输入手机号')
        .onChange((value) => { phone = value; }));

    new Setting(contentEl)
      .setName('验证码')
      .addText(text => text
        .setPlaceholder('请输入验证码')
        .onChange((value) => { code = value; }));

    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText('登录')
        .setCta()
        .onClick(async () => {
          if (!phone || !code) {
            new Notice('请输入手机号和验证码');
            return;
          }
          try {
            btn.setButtonText('登录中...');
            btn.setDisabled(true);
            const result = await this.api.login(phone, code);
            const settings = this.getSettings();
            settings.token = result.token;
            settings.phoneNumber = phone;
            await this.saveSettings();
            new Notice('登录成功');
            this.close();
          } catch (e) {
            new Notice(`登录失败: ${e instanceof Error ? e.message : '未知错误'}`);
            btn.setButtonText('登录');
            btn.setDisabled(false);
          }
        }));
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    this.onCloseCallback();
  }
}
