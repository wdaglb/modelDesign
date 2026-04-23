package io.github.modelDesign.asset.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.asset.domain.AssetStocktakeItem;
import org.apache.ibatis.annotations.Mapper;

/**
 * 盘点明细 Mapper。
 */
@Mapper
public interface AssetStocktakeItemMapper extends BaseMapper<AssetStocktakeItem> {
}
