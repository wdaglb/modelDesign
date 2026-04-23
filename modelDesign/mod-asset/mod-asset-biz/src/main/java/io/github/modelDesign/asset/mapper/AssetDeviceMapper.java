package io.github.modelDesign.asset.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.asset.domain.AssetDevice;
import org.apache.ibatis.annotations.Mapper;

/**
 * 设备台账 Mapper。
 */
@Mapper
public interface AssetDeviceMapper extends BaseMapper<AssetDevice> {
}
