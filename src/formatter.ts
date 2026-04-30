import { Recording, TranscriptSegment, SummaryData } from './types';

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
  const date = recording.recordTime
    ? recording.recordTime.substring(0, 10)
    : new Date().toISOString().substring(0, 10);
  return `${date}-${sanitizeFileName(displayName)}`;
}

function formatDuration(seconds: string | number): string {
  const s = Number(seconds) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatTranscriptTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  return formatDuration(totalSeconds);
}

export function generateFrontmatter(recording: Recording, syncTime: string): string {
  const lines: string[] = [
    '---',
    `audio_id: "${recording.audioId}"`,
    `record_name: "${recording.recordName || ''}"`,
    `record_nick_name: "${(recording.recordNickName || '').replace(/"/g, '\\"')}"`,
    `duration: "${recording.duration || '0'}"`,
    `record_time: "${recording.recordTime || ''}"`,
    `record_type: "${recording.recordType || ''}"`,
    `device_name: "${recording.deviceName || ''}"`,
  ];

  if (recording.audioUrl) {
    lines.push(`audio_url: "${recording.audioUrl}"`);
  }

  lines.push('tags:');
  lines.push('  - znote');

  const recordTypeLabel = recording.recordType === '00' ? '通话' : '录音';
  lines.push(`  - ${recordTypeLabel}`);

  lines.push(`sync_time: "${syncTime}"`);
  lines.push('---');
  return lines.join('\n');
}

export function formatTranscript(segments: TranscriptSegment[]): string {
  if (!segments || segments.length === 0) return '';

  return segments.map(seg => {
    const time = formatTranscriptTime(seg.time);
    const speaker = seg.spokesperson || '未知';
    return `**[${time}] ${speaker}：** ${seg.text}`;
  }).join('\n\n');
}

export function toMarkdown(
  recording: Recording,
  transcript: TranscriptSegment[] | null,
  summary: SummaryData | null,
  note: string,
  syncTime: string
): string {
  const parts: string[] = [];

  // Frontmatter
  parts.push(generateFrontmatter(recording, syncTime));
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

  // Transcript section
  if (transcript && transcript.length > 0) {
    parts.push('## 转录内容');
    parts.push('');
    parts.push(formatTranscript(transcript));
    parts.push('');
  }

  // Summary section
  if (summary && summary.summaryContent) {
    parts.push('## AI 总结');
    parts.push('');
    parts.push(summary.summaryContent.trim());
    parts.push('');
  }

  return parts.join('\n');
}
