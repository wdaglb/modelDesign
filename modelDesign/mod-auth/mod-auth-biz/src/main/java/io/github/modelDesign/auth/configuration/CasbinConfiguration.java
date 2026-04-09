package io.github.modelDesign.auth.configuration;

import org.casbin.adapter.JDBCAdapter;
import org.casbin.jcasbin.main.Enforcer;
import org.casbin.jcasbin.model.Model;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.sql.DataSource;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Casbin 权限配置。
 */
@Configuration
public class CasbinConfiguration {

    /**
     * 创建 Casbin 执行器，从 classpath:casbin/model.conf 加载模型文本，
     * 使用 JDBCAdapter 持久化策略到数据库。
     *
     * @param dataSource Spring 管理的数据源
     * @return Casbin 执行器
     */
    @Bean
    public Enforcer casbinEnforcer(DataSource dataSource) throws Exception {
        ClassPathResource resource = new ClassPathResource("casbin/model.conf");
        String modelText;
        try (InputStream inputStream = resource.getInputStream()) {
            modelText = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }

        Model model = new Model();
        model.loadModelFromText(modelText);

        JDBCAdapter adapter = new JDBCAdapter(dataSource);
        return new Enforcer(model, adapter);
    }
}
