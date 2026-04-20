import { useId, useRef, useState, type MouseEvent } from 'react';
import { Image } from 'antd';
import { MdPreview } from 'md-editor-rt';

import {
  collectMarkdownPreviewImageUrls,
  normalizeMarkdownValue,
  resolveMarkdownPreviewImageIndex,
  toggleMarkdownTodoByIndex,
} from './helpers';
import type {
  KMarkdownPreviewProps,
  MarkdownTodoTogglePayload,
} from './types';

/**
 * Markdown 预览面板。
 *
 * 该组件复用编辑器同款的预览样式，避免详情态与编辑态出现割裂。
 * 同时通过 DOM 代理接管图片点击事件，让说明中的图片可以直接放大预览。
 */
const KMarkdownPreview = (props: KMarkdownPreviewProps) => {
  const previewId = useId().replace(/:/g, '');
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewCurrent, setPreviewCurrent] = useState(0);

  const value = normalizeMarkdownValue(props.value);

  let height: number | string = 'auto';
  if (props.height !== undefined) {
    height = props.height;
  }

  /**
   * 每次预览内容重绘后重新抓取图片地址，保证弹窗数据与页面展示一致。
   */
  const syncPreviewImages = () => {
    const nextPreviewImages = collectMarkdownPreviewImageUrls(
      previewContainerRef.current,
    );
    syncPreviewImageCue(previewContainerRef.current);
    syncTodoTextDecoration(previewContainerRef.current);
    syncTodoCheckboxState(previewContainerRef.current, Boolean(props.onTodoToggle));
    setPreviewImages(nextPreviewImages);
    return nextPreviewImages;
  };

  /**
   * 通过点击事件代理识别 Markdown 预览里的图片，并打开受控预览弹窗。
   */
  const handlePreviewClick = (event: MouseEvent<HTMLDivElement>) => {
    const eventTarget = event.target;
    if (!(eventTarget instanceof HTMLElement)) {
      return;
    }

    const todoCheckbox = eventTarget.closest(
      'input[type="checkbox"]',
    );
    if (todoCheckbox instanceof HTMLInputElement) {
      void handleTodoToggle(todoCheckbox);
      return;
    }

    const resolvedImageElement = resolvePreviewImageElement(eventTarget);
    if (!(resolvedImageElement instanceof HTMLImageElement)) {
      return;
    }

    const currentImageUrl = resolvedImageElement.getAttribute('src');
    if (!currentImageUrl) {
      return;
    }

    let nextPreviewImages = previewImages;
    if (
      nextPreviewImages.length === 0 ||
      !nextPreviewImages.includes(currentImageUrl)
    ) {
      nextPreviewImages = syncPreviewImages();
    }

    const imageIndex = resolveMarkdownPreviewImageIndex(
      nextPreviewImages,
      currentImageUrl,
    );
    if (imageIndex < 0) {
      return;
    }

    setPreviewCurrent(imageIndex);
    setPreviewVisible(true);
  };

  /**
   * 处理 Markdown 预览里的待办点击。
   *
   * 组件内部只负责把“点击了第几个待办项”转换成新的 Markdown 内容，
   * 具体是否保存、如何提示和失败后怎么回滚，交给外层事件决定。
   */
  const handleTodoToggle = async (checkboxElement: HTMLInputElement) => {
    if (!props.onTodoToggle || !previewContainerRef.current) {
      return;
    }

    const todoCheckboxElements = Array.from(
      previewContainerRef.current.querySelectorAll('input[type="checkbox"]'),
    );
    const todoIndex = todoCheckboxElements.findIndex((item) => {
      return item === checkboxElement;
    });

    if (todoIndex < 0) {
      return;
    }

    const toggleResult = toggleMarkdownTodoByIndex(value, todoIndex);
    if (!toggleResult) {
      return;
    }

    const payload: MarkdownTodoTogglePayload = {
      todoIndex,
      checked: toggleResult.checked,
      nextValue: toggleResult.nextValue,
    };
    await props.onTodoToggle(payload);
  };

  return (
    <>
      <div
        ref={previewContainerRef}
        onClick={handlePreviewClick}
        style={buildMarkdownPreviewWrapperStyle(height)}
      >
        <MdPreview
          id={previewId}
          value={value}
          previewTheme="github"
          /**
           * 关闭编辑器自带的 medium-zoom，避免与 antd 预览组叠加出双层弹窗。
           */
          noImgZoomIn
          onHtmlChanged={() => {
            syncPreviewImages();
          }}
        />
      </div>

      <div style={{ display: 'none' }}>
        <Image.PreviewGroup
          items={previewImages}
          preview={{
            visible: previewVisible,
            current: previewCurrent,
            /**
             * 受控模式下同步当前索引，确保预览弹窗内可正常切换上一张/下一张。
             */
            onChange: (current) => {
              setPreviewCurrent(current);
            },
            onVisibleChange: (visible) => {
              setPreviewVisible(visible);
            },
          }}
        />
      </div>
    </>
  );
};

/**
 * 构造 Markdown 预览容器外层样式。
 *
 * 预览态直接对齐编辑态的外框 token，保证只读与可编辑场景的边框观感一致。
 */
export function buildMarkdownPreviewWrapperStyle(height: number | string) {
  return {
    height,
    overflow: 'auto',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--ant-colorBorder, #d9d9d9)',
    borderRadius: 'var(--ant-borderRadius, 8px)',
    padding: 16,
    backgroundColor: 'var(--ant-colorBgContainer, #fff)',
  };
}

/**
 * 同步 Markdown 预览中的待办复选框交互状态。
 *
 * 第三方预览器通常会把任务列表复选框渲染为 disabled，默认只能展示不能点击。
 * 当外层显式传入待办切换事件时，这里移除 disabled 并补充可点击光标，
 * 让“预览态可勾选”只在需要的场景启用，不影响其他只读场景。
 */
function syncTodoCheckboxState(
  container: HTMLElement | null,
  interactive: boolean,
) {
  if (!container) {
    return;
  }

  const todoCheckboxes = Array.from(
    container.querySelectorAll('input[type="checkbox"]'),
  );

  todoCheckboxes.forEach((checkboxElement) => {
    if (!(checkboxElement instanceof HTMLInputElement)) {
      return;
    }

    if (interactive) {
      checkboxElement.removeAttribute('disabled');
      checkboxElement.style.cursor = 'pointer';
      return;
    }

    checkboxElement.style.removeProperty('cursor');
  });
}

/**
 * 同步待办事项文本的完成态样式。
 *
 * Markdown 预览库对任务列表的 DOM 结构并不完全稳定，
 * 这里优先查找复选框后的相邻文本容器；若不存在，则回退到 label / li 容器。
 * 这样既能兼容当前抽屉预览，也能避免把删除线逻辑泄漏到外层页面。
 */
function syncTodoTextDecoration(container: HTMLElement | null) {
  if (!container) {
    return;
  }

  const todoCheckboxes = Array.from(
    container.querySelectorAll('input[type="checkbox"]'),
  );

  todoCheckboxes.forEach((checkboxElement) => {
    if (!(checkboxElement instanceof HTMLInputElement)) {
      return;
    }

    const textContainer = resolveTodoTextContainer(checkboxElement);
    if (!textContainer) {
      return;
    }

    if (checkboxElement.checked) {
      textContainer.style.textDecoration = 'line-through';
      return;
    }

    textContainer.style.textDecoration = 'none';
  });
}

/**
 * 解析待办项文本容器。
 *
 * @param checkboxElement 待办复选框
 * @return 文本容器
 */
function resolveTodoTextContainer(checkboxElement: HTMLInputElement) {
  const siblingElement = checkboxElement.nextElementSibling;
  if (siblingElement instanceof HTMLElement) {
    return siblingElement;
  }

  const labelElement = checkboxElement.closest('label');
  if (labelElement instanceof HTMLElement) {
    return labelElement;
  }

  const listItemElement = checkboxElement.closest('li');
  if (listItemElement instanceof HTMLElement) {
    return listItemElement;
  }

  return null;
}

/**
 * 同步 Markdown 图片的可放大提示。
 *
 * 预览区图片默认虽然支持点击放大，但缺少足够明确的 hover 提示。
 * 这里在组件内部补充统一的壳层、角标和悬停动画，让用户更容易感知该能力。
 *
 * @param container 预览容器
 */
function syncPreviewImageCue(container: HTMLElement | null) {
  if (!container) {
    return;
  }

  const imageElements = Array.from(container.querySelectorAll('img'));

  imageElements.forEach((imageElement) => {
    if (!(imageElement instanceof HTMLImageElement)) {
      return;
    }

    const imageShell = ensurePreviewImageShell(imageElement);
    const imageBadge = ensurePreviewImageBadge(imageShell);

    imageElement.title = '点击放大查看';
    imageElement.style.cursor = 'zoom-in';
    imageElement.style.display = 'block';
    imageElement.style.maxWidth = '100%';
    imageElement.style.transition =
      'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease';

    imageShell.onmouseenter = () => {
      imageElement.style.transform = 'scale(1.008)';
      imageElement.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
      imageElement.style.opacity = '0.97';
      imageBadge.style.opacity = '1';
      imageBadge.style.transform = 'translateY(0) scale(1)';
    };

    imageShell.onmouseleave = () => {
      imageElement.style.transform = 'scale(1)';
      imageElement.style.boxShadow = 'none';
      imageElement.style.opacity = '1';
      imageBadge.style.opacity = '0';
      imageBadge.style.transform = 'translateY(-4px) scale(0.98)';
    };
  });
}

/**
 * 解析预览点击事件对应的图片节点。
 *
 * 当用户点击图片壳层或“放大查看”角标时，事件目标不再是 img 本身，
 * 因此需要统一回溯到真正的图片节点，保证点击任意提示区域都能触发放大。
 *
 * @param eventTarget 点击事件目标
 * @return 图片节点
 */
function resolvePreviewImageElement(eventTarget: HTMLElement) {
  const imageShell = eventTarget.closest(
    '[data-markdown-preview-image-shell="true"]',
  );
  if (imageShell instanceof HTMLElement) {
    const nestedImage = imageShell.querySelector('img');
    if (nestedImage instanceof HTMLImageElement) {
      return nestedImage;
    }
  }

  const imageElement = eventTarget.closest('img');
  if (imageElement instanceof HTMLImageElement) {
    return imageElement;
  }

  return null;
}

/**
 * 保证图片存在统一的 hover 壳层。
 *
 * @param imageElement 图片节点
 * @return 壳层节点
 */
function ensurePreviewImageShell(imageElement: HTMLImageElement) {
  const currentParent = imageElement.parentElement;
  if (
    currentParent instanceof HTMLElement &&
    currentParent.dataset.markdownPreviewImageShell === 'true'
  ) {
    return currentParent;
  }

  const imageShell = document.createElement('span');
  imageShell.dataset.markdownPreviewImageShell = 'true';
  imageShell.style.position = 'relative';
  imageShell.style.display = 'inline-block';
  imageShell.style.maxWidth = '100%';
  imageShell.style.cursor = 'zoom-in';
  imageShell.style.borderRadius = '12px';
  imageShell.style.overflow = 'hidden';
  imageShell.style.verticalAlign = 'top';

  currentParent?.insertBefore(imageShell, imageElement);
  imageShell.appendChild(imageElement);
  return imageShell;
}

/**
 * 保证图片存在“放大查看”角标。
 *
 * @param imageShell 图片壳层
 * @return 角标节点
 */
function ensurePreviewImageBadge(imageShell: HTMLElement) {
  const currentBadge = imageShell.querySelector(
    '[data-markdown-preview-image-badge="true"]',
  );
  if (currentBadge instanceof HTMLSpanElement) {
    return currentBadge;
  }

  const imageBadge = document.createElement('span');
  imageBadge.dataset.markdownPreviewImageBadge = 'true';
  imageBadge.style.display = 'inline-flex';
  imageBadge.style.alignItems = 'center';
  imageBadge.style.gap = '6px';
  imageBadge.style.position = 'absolute';
  imageBadge.style.top = '12px';
  imageBadge.style.right = '12px';
  imageBadge.style.padding = '6px 10px';
  imageBadge.style.borderRadius = '999px';
  imageBadge.style.background =
    'linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.62))';
  imageBadge.style.backdropFilter = 'blur(12px)';
  imageBadge.style.webkitBackdropFilter = 'blur(12px)';
  imageBadge.style.border = '1px solid rgba(255, 255, 255, 0.68)';
  imageBadge.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.08)';
  imageBadge.style.color = 'rgba(0, 0, 0, 0.88)';
  imageBadge.style.fontSize = '12px';
  imageBadge.style.lineHeight = '18px';
  imageBadge.style.fontWeight = '500';
  imageBadge.style.pointerEvents = 'none';
  imageBadge.style.opacity = '0';
  imageBadge.style.transform = 'translateY(-4px) scale(0.98)';
  imageBadge.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

  const imageBadgeIcon = document.createElement('span');
  imageBadgeIcon.dataset.markdownPreviewImageBadgeIcon = 'true';
  imageBadgeIcon.innerHTML =
    '<svg viewBox="0 0 1024 1024" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M448 192a256 256 0 1 0 0 512a256 256 0 0 0 0-512Zm0 64a192 192 0 1 1 0 384a192 192 0 0 1 0-384Z" fill="#1677ff"/>' +
    '<path d="M675.2 630.016a32 32 0 0 1 45.248 0l134.4 134.4a32 32 0 1 1-45.248 45.248l-134.4-134.4a32 32 0 0 1 0-45.248Z" fill="#1677ff"/>' +
    '</svg>';

  const imageBadgeLabel = document.createElement('span');
  imageBadgeLabel.dataset.markdownPreviewImageBadgeLabel = 'true';
  imageBadgeLabel.textContent = '预览';

  imageBadge.appendChild(imageBadgeIcon);
  imageBadge.appendChild(imageBadgeLabel);
  imageShell.appendChild(imageBadge);
  return imageBadge;
}

export default KMarkdownPreview;
