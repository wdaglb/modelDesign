import { useId, useRef, useState, type MouseEvent } from 'react';
import { Image } from 'antd';
import { MdPreview } from 'md-editor-rt';

import {
  collectMarkdownPreviewImageUrls,
  normalizeMarkdownValue,
  resolveMarkdownPreviewImageIndex,
} from './helpers';
import type { KMarkdownPreviewProps } from './types';

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

    const imageElement = eventTarget.closest('img');
    if (!(imageElement instanceof HTMLImageElement)) {
      return;
    }

    const currentImageUrl = imageElement.getAttribute('src');
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

  return (
    <>
      <div
        ref={previewContainerRef}
        onClick={handlePreviewClick}
        style={{
          height,
          overflow: 'auto',
          border: '1px solid var(--ant-colorBorder)',
          borderRadius: 8,
          padding: 16,
          backgroundColor: 'var(--ant-colorBgContainer)',
        }}
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

export default KMarkdownPreview;
