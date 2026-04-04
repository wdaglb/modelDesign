import AgileBoardTaskCard, {
  AgileBoardTaskCardPreview,
} from './components/AgileBoardTaskCard';

export { AgileBoardTaskCardPreview };

/**
 * 兼容旧导出名称，避免现有引用路径断裂。
 */
export const AgileBoardCardPreview = AgileBoardTaskCardPreview;

export default AgileBoardTaskCard;
