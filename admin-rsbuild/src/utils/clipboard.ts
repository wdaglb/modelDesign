/**
 * 复制文本到系统剪贴板。
 *
 * 说明：
 * - 优先使用浏览器原生 clipboard API；
 * - 不可用时回退为 textarea + execCommand，兼容旧环境与测试环境。
 *
 * @param text 待复制文本
 */
export async function copyTextToClipboard(text: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'readonly');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
