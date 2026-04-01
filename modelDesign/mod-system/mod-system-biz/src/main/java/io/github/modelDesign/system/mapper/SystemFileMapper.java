package io.github.modelDesign.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.system.domain.SystemFile;
import org.apache.ibatis.annotations.Mapper;

/**
 * 系统文件 Mapper。
 */
@Mapper
public interface SystemFileMapper extends BaseMapper<SystemFile> {
}
