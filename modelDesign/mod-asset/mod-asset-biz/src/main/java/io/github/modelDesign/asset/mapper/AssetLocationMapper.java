package io.github.modelDesign.asset.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.asset.domain.AssetLocation;
import org.apache.ibatis.annotations.Mapper;

/**
 * 设备位置 Mapper。
 */
@Mapper
public interface AssetLocationMapper extends BaseMapper<AssetLocation> {
}
