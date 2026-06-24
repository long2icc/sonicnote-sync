import { Recording, TranscriptSegment, SummaryData, StudyReportData, SonicNotePluginSettings } from './types';

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'untitled';
}

export function formatFileName(recording: Recording): string {
  const displayName = recording.recordNickName || recording.recordName || '未命名录音';
  return sanitizeFileName(displayName);
}

export function generateFrontmatter(recording: Recording, syncTime: string, settings: SonicNotePluginSettings): string {
  const fields = settings.frontmatterFields;
  const lines: string[] = ['---'];

  if (fields.audio_id !== false) {
    lines.push(`audio_id: "${recording.audioId}"`);
  }
  if (fields.record_name !== false) {
    lines.push(`record_name: "${recording.recordName || ''}"`);
  }
  if (fields.record_nick_name !== false) {
    lines.push(`record_nick_name: "${(recording.recordNickName || '').replace(/"/g, '\\"')}"`);
  }
  if (fields.duration !== false) {
    lines.push(`duration: "${recording.duration || '0'}"`);
  }
  if (fields.record_time !== false) {
    lines.push(`record_time: "${recording.recordTime || ''}"`);
  }
  if (fields.record_type !== false) {
    lines.push(`record_type: "${recording.recordType || ''}"`);
  }
  if (fields.device_name !== false) {
    lines.push(`device_name: "${recording.deviceName || ''}"`);
  }
  if (fields.audio_url !== false && recording.audioUrl) {
    lines.push(`audio_url: "${recording.audioUrl}"`);
  }
  if (fields.tags !== false) {
    lines.push('tags:');
    lines.push('  - sonicnote');
    const recordTypeLabel = recording.recordType === '00' ? '通话' : '录音';
    lines.push(`  - ${recordTypeLabel}`);
  }
  if (fields.sync_time !== false) {
    lines.push(`sync_time: "${syncTime}"`);
  }

  // Custom frontmatter fields
  for (const custom of settings.customFrontmatter) {
    lines.push(`${custom.key}: "${custom.value.replace(/"/g, '\\"')}"`);
  }

  lines.push('---');
  return lines.join('\n');
}

export function formatTranscript(segments: TranscriptSegment[]): string {
  if (!segments || segments.length === 0) return '';

  return segments.map(seg => {
    const time = seg.time || '00:00';
    const speaker = seg.spokesperson || '未知';
    return `**[${time}] ${speaker}：** ${seg.text}`;
  }).join('\n\n');
}

export function toMarkdown(
  recording: Recording,
  transcript: TranscriptSegment[] | null,
  summary: SummaryData | null,
  studyReport: StudyReportData | null,
  note: string,
  syncTime: string,
  settings: SonicNotePluginSettings
): string {
  const parts: string[] = [];

  // Frontmatter
  parts.push(generateFrontmatter(recording, syncTime, settings));
  parts.push('');

  // Title
  const title = recording.recordNickName || recording.recordName || '未命名录音';
  parts.push(`# ${title}`);
  parts.push('');

  // Note section
  if (note && note.trim()) {
    parts.push('## 笔记');
    parts.push('');
    parts.push(note.trim());
    parts.push('');
  }

  // Summary section (before transcript)
  if (summary && summary.summaryContent) {
    parts.push('## AI 总结');
    parts.push('');
    parts.push(summary.summaryContent.trim());
    parts.push('');
  }

  // Study report section (before transcript)
  if (studyReport && studyReport.status === 2) {
    parts.push('## 学习总结');
    parts.push('');
    if (studyReport.knowledgePanorama) {
      parts.push(`![知识全景图](${studyReport.knowledgePanorama})`);
      parts.push('');
    }
    if (studyReport.coreGains) {
      parts.push('### 核心收获');
      parts.push('');
      parts.push(studyReport.coreGains.trim());
      parts.push('');
    }
    if (studyReport.consolidation) {
      parts.push('### 课后巩固');
      parts.push('');
      parts.push(studyReport.consolidation.trim());
      parts.push('');
    }
  }

  // Transcript section
  if (transcript && transcript.length > 0) {
    parts.push('## 转录内容');
    parts.push('');
    parts.push(formatTranscript(transcript));
    parts.push('');
  }

  return parts.join('\n');
}
