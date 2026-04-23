package io.github.modelDesign.asset.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.asset.domain.AssetCategory;
import org.apache.ibatis.annotations.Mapper;

/**
 * 设备分类 Mapper。
 */
@Mapper
public interface AssetCategoryMapper extends BaseMapper<AssetCategory> {
}
