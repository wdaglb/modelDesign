package io.github.modelDesign;

import org.dromara.x.file.storage.spring.EnableFileStorage;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableFileStorage
public class ModelDesignApplication {

    public static void main(String[] args) {
        SpringApplication.run(ModelDesignApplication.class, args);
    }

}
