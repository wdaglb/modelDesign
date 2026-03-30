package io.github.modelDesign.auth.configuration;

import org.casbin.adapter.JDBCAdapter;
import org.casbin.jcasbin.main.Enforcer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.sql.DataSource;

/**
 * Casbin 权限配置。
 */
@Configuration
public class CasbinConfiguration {

    /**
     * 创建 Casbin 执行器，从 classpath:casbin/model.conf 加载模型，
     * 使用 JDBCAdapter 持久化策略到数据库。
     *
     * @param dataSource Spring 管理的数据源
     * @return Casbin 执行器
     */
    @Bean
    public Enforcer casbinEnforcer(DataSource dataSource) throws Exception {
        String modelPath = new ClassPathResource("casbin/model.conf").getFile().getAbsolutePath();
        JDBCAdapter adapter = new JDBCAdapter(dataSource);
        return new Enforcer(modelPath, adapter);
    }
}
