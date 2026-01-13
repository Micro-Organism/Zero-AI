package com.sdecloud.springai.alibaba.common.tool;

import org.springframework.ai.tool.annotation.ToolParam;

/**
 * 用户位置工具输入参数
 */
public record UserLocationInput(@ToolParam(description = "用户查询") String query) {

}

