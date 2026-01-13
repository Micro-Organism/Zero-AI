package com.sdecloud.springai.alibaba;

import com.alibaba.cloud.ai.autoconfigure.dashscope.DashScopeAgentAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = {DashScopeAgentAutoConfiguration.class})
public class ZeroAiAlibabaApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZeroAiAlibabaApplication.class, args);
    }

}
