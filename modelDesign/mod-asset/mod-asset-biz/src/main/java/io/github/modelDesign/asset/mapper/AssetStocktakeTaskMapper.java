package io.github.modelDesign.asset.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.asset.domain.AssetStocktakeTask;
import org.apache.ibatis.annotations.Mapper;

/**
 * 盘点任务 Mapper。
 */
@Mapper
public interface AssetStocktakeTaskMapper extends BaseMapper<AssetStocktakeTask> {
}
