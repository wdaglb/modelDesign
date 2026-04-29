/**
 * 复制文本到系统剪贴板。
 *
 * 说明：
 * - 优先使用浏览器原生 clipboard API；
 * - 若浏览器因权限、上下文或实现差异导致原生复制失败，自动回退；
 * - 回退方案使用 textarea + execCommand，兼容旧环境与部分抽屉场景。
 *
 * @param text 待复制文本
 */
export async function copyTextToClipboard(text: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      /**
       * 某些页面虽然暴露了 clipboard API，但在非安全上下文、
       * 权限被拒绝或焦点受限时仍会抛错；这里继续走兼容回退，
       * 避免调用方把“可回退的复制失败”直接表现成业务异常。
       */
    }
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
