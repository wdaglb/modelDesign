import { pinyin } from 'pinyin-pro';

export function getPinyinInitials(name: string): string {
  if (!name) return '';
  const result: string[] = [];
  const chars = [...name];
  for (const char of chars) {
    if (/[\u4e00-\u9fa5]/.test(char)) {
      const py = pinyin(char, { pattern: 'initial' });
      result.push(py.toUpperCase());
    } else if (/[a-zA-Z0-9]/.test(char)) {
      result.push(char.toUpperCase());
    }
  }
  return result.join('');
}
