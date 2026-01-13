package com.sdecloud.springai.alibaba.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web 配置类 - 支持前端静态资源访问
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // 静态资源处理
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(false);
    }

    @Override
    public void addViewControllers(@NonNull ViewControllerRegistry registry) {
        // 所有前端路由都指向 index.html，由 Vue Router 处理
        registry.addViewController("/").setViewName("forward:/index.html");
        registry.addViewController("/agent").setViewName("forward:/index.html");
    }
}

