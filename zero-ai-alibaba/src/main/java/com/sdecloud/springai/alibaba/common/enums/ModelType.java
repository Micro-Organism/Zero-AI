package com.sdecloud.springai.alibaba.common.enums;

/**
 * 模型类型枚举
 */
public enum ModelType {
    /**
     * 通义千问 (Qwen)
     */
    QWEN("qwen", "通义千问"),

    /**
     * DeepSeek
     */
    DEEPSEEK("deepseek", "DeepSeek");

    private final String code;
    private final String name;

    ModelType(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    /**
     * 根据代码获取模型类型
     */
    public static ModelType fromCode(String code) {
        for (ModelType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return DEEPSEEK; // 默认返回 DEEPSEEK
    }
}

