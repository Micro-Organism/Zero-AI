# 图表工具和ConvLSTM模型集成方案

> **分析时间**: 2025年
> 
> **核心问题**:
> 1. 图表工具能否作为MCP工具，由Spring AI Alibaba调用？
> 2. ConvLSTM模型能否在Python训练后，直接集成到Java项目中，不调用Python服务？

---

## 📋 目录

- [1. 图表工具MCP方案](#1-图表工具mcp方案)
- [2. ConvLSTM模型集成方案](#2-convlstm模型集成方案)
- [3. 方案对比与推荐](#3-方案对比与推荐)
- [4. 实施步骤](#4-实施步骤)
- [5. 代码示例](#5-代码示例)

---

## 1. 图表工具MCP方案

### 1.1 方案概述

**核心思想**: 将图表生成功能封装为MCP工具，Spring AI Alibaba通过MCP客户端调用。

**架构设计**:
```
┌─────────────────────────────────────────────────────────────┐
│              Spring AI Alibaba 应用                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Agent / Graph 工作流                                │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  MCP Client                                     │ │   │
│  │  │  - 发现图表工具                                  │ │   │
│  │  │  - 调用图表工具                                  │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ MCP Protocol (HTTP/SSE)
┌────────────────────┴────────────────────────────────────────┐
│              图表生成 MCP 服务器                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MCP Server                                            │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  @McpTool("generate_line_chart")                │ │   │
│  │  │  @McpTool("generate_bar_chart")                 │ │   │
│  │  │  @McpTool("generate_scatter_chart")             │ │   │
│  │  │  @McpTool("generate_pie_chart")                 │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  图表生成引擎                                     │ │   │
│  │  │  - JFreeChart (Java)                            │ │   │
│  │  │  - 或调用 Python Matplotlib/Plotly 服务         │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 方案优势

✅ **通用性**: 图表工具作为独立的MCP服务，可以被任何支持MCP的客户端调用  
✅ **解耦**: 图表生成逻辑与业务逻辑分离  
✅ **可扩展**: 可以轻松添加新的图表类型  
✅ **统一接口**: 通过MCP协议统一调用方式  
✅ **灵活性**: 可以使用Java或Python实现图表生成引擎

### 1.3 实现方案

#### 方案A: Java原生图表库（推荐）

**技术栈**:
- MCP Server: Spring AI Alibaba MCP Server Boot Starter
- 图表库: JFreeChart / Chart.js Java

**优点**:
- 完全Java化，无需跨语言调用
- 性能好，响应快
- 部署简单

**缺点**:
- 图表样式可能不如Python库丰富
- 需要重新实现图表生成逻辑

#### 方案B: Python图表服务（过渡方案）

**技术栈**:
- MCP Server: Python MCP Server（使用mcp库）
- 图表库: Matplotlib / Plotly

**优点**:
- 可以复用现有的Python图表代码
- 图表样式丰富

**缺点**:
- 需要维护Python服务
- 跨语言调用有性能开销

#### 方案C: 混合方案（最佳实践）

**技术栈**:
- 简单图表: Java原生（JFreeChart）
- 复杂图表: Python服务（Matplotlib/Plotly）

**优点**:
- 兼顾性能和功能
- 灵活选择实现方式

### 1.4 MCP工具定义

```java
// 图表生成MCP工具定义
@McpTool(
    name = "generate_line_chart",
    description = "生成折线图，用于展示时间序列数据趋势"
)
public class LineChartTool {
    
    @ToolParam(name = "data", description = "图表数据，格式: [{\"x\": value, \"y\": value}, ...]")
    private String data;
    
    @ToolParam(name = "title", description = "图表标题")
    private String title;
    
    @ToolParam(name = "xLabel", description = "X轴标签")
    private String xLabel;
    
    @ToolParam(name = "yLabel", description = "Y轴标签")
    private String yLabel;
    
    @ToolParam(name = "outputFormat", description = "输出格式: base64, url, file")
    private String outputFormat = "base64";
    
    public ChartResult generate() {
        // 生成图表逻辑
        byte[] chartBytes = chartService.generateLineChart(data, title, xLabel, yLabel);
        
        if ("base64".equals(outputFormat)) {
            return ChartResult.builder()
                .format("base64")
                .data(Base64.getEncoder().encodeToString(chartBytes))
                .build();
        } else if ("url".equals(outputFormat)) {
            String url = minioService.uploadChart(chartBytes);
            return ChartResult.builder()
                .format("url")
                .data(url)
                .build();
        }
        // ...
    }
}
```

---

## 2. ConvLSTM模型集成方案

### 2.1 方案概述

**核心问题**: 能否将Python训练的ConvLSTM模型直接集成到Java项目中，不调用Python服务？

**答案**: ✅ **可以！** 有多种方案可以实现。

**推荐方案排序**:
1. ⭐⭐⭐⭐⭐ **DJL (Deep Java Library)** - AWS开发，直接加载PyTorch模型，最推荐
2. ⭐⭐⭐⭐ **ONNX Runtime** - 需要模型转换，但性能好
3. ⭐⭐⭐ **模型服务化（MCP）** - 灵活性高，但需要Python服务

### 2.2 方案对比

| 方案 | 技术栈 | 优点 | 缺点 | 推荐度 |
|------|--------|------|------|--------|
| **方案1: DJL (推荐)** | PyTorch → TorchScript → DJL | ✅ 直接加载PyTorch模型<br>✅ AWS官方支持<br>✅ 纯Java实现<br>✅ 易用性好 | ⚠️ 需要转换为TorchScript<br>⚠️ 性能略低于ONNX | ⭐⭐⭐⭐⭐ |
| **方案2: ONNX Runtime** | PyTorch → ONNX → ONNX Runtime Java | ✅ 性能最好<br>✅ 跨平台<br>✅ 官方支持 | ⚠️ 需要模型转换<br>⚠️ 可能有兼容性问题 | ⭐⭐⭐⭐ |
| **方案3: 模型服务化（MCP）** | PyTorch → Python服务 → MCP | ✅ 无需转换<br>✅ 灵活性高 | ❌ 需要Python服务<br>❌ 有网络延迟 | ⭐⭐⭐ |
| **方案4: TensorFlow Java** | PyTorch → TensorFlow → TensorFlow Java | ✅ 官方支持 | ❌ 转换复杂<br>❌ 可能有精度损失 | ⭐⭐⭐ |

### 2.3 方案1: DJL (Deep Java Library) - 最推荐 ⭐

#### 2.3.1 方案说明

**工作流程**:
```
Python训练 → 导出TorchScript模型 → Java使用DJL加载 → 推理
```

**技术栈**:
- Python端: PyTorch → `torch.jit.trace()` 或 `torch.jit.script()`
- Java端: DJL (Deep Java Library) - AWS开发

**优势**:
- ✅ **直接加载PyTorch模型**：无需转换为ONNX，直接使用`.pth`文件
- ✅ **纯Java实现**：无需Python环境，简化部署
- ✅ **AWS官方支持**：成熟稳定，社区活跃
- ✅ **易用性好**：API简洁，文档完善
- ✅ **支持多种框架**：PyTorch、TensorFlow、MXNet等

#### 2.3.2 实施步骤

**步骤1: Python端导出TorchScript模型**

基于实际的 `models_predict` 代码，创建导出脚本：

```python
# export_torchscript_models.py
import torch
import torch.jit
import os
from models_predict.ConvLSTM import ConvLSTMRegressor

# 模型参数配置（与实际代码一致）
input_channels = 9
convlstm_hidden_dim = 27
num_layers = 2
kernel_size = (3, 3)

# 模型文件路径
models_dir = "models_predict/models_file"
output_dir = "models_predict/models_file_torchscript"
os.makedirs(output_dir, exist_ok=True)

# 准备示例输入（与实际数据格式一致）
# 输入形状: (batch=1, time_steps=12, channels=9, height=3, width=3)
dummy_input = torch.randn(1, 12, 9, 3, 3).float()

# 导出6个模型为TorchScript格式
for i in range(1, 7):
    model_file = f"convlstm_regressor_model_12_27_2_{i}.pth"
    torchscript_file = f"convlstm_regressor_model_12_27_2_{i}.pt"
    
    print(f"正在导出模型 {i}/6: {model_file}")
    
    # 创建模型实例
    model = ConvLSTMRegressor(
        input_dim=input_channels,
        hidden_dim=[convlstm_hidden_dim] * num_layers,
        kernel_size=kernel_size,
        num_layers=num_layers
    )
    
    # 加载训练好的参数
    model_path = os.path.join(models_dir, model_file)
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    model.eval()
    
    # 方法1: 使用trace（推荐，更稳定，适合无控制流的模型）
    try:
        traced_model = torch.jit.trace(model, dummy_input)
        # 验证trace的模型
        traced_model(dummy_input)
        
        # 保存TorchScript模型
        torchscript_path = os.path.join(output_dir, torchscript_file)
        traced_model.save(torchscript_path)
        print(f"✓ 模型 {i} 已导出为TorchScript: {torchscript_file}")
        
    except Exception as e:
        print(f"✗ 模型 {i} trace失败: {e}")
        # 如果trace失败，尝试script方法
        try:
            scripted_model = torch.jit.script(model)
            torchscript_path = os.path.join(output_dir, torchscript_file)
            scripted_model.save(torchscript_path)
            print(f"✓ 模型 {i} 已导出为TorchScript (script方法): {torchscript_file}")
        except Exception as e2:
            print(f"✗ 模型 {i} script也失败: {e2}")

print("\n所有模型导出完成！")
print(f"TorchScript模型保存在: {output_dir}")
```

**运行导出脚本**:
```bash
cd /path/to/environment
python export_torchscript_models.py
```

**步骤2: Java端使用DJL加载和推理**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>ai.djl</groupId>
    <artifactId>api</artifactId>
    <version>0.27.0</version>
</dependency>
<dependency>
    <groupId>ai.djl.pytorch</groupId>
    <artifactId>pytorch-engine</artifactId>
    <version>0.27.0</version>
</dependency>
<!-- CPU版本 -->
<dependency>
    <groupId>ai.djl.pytorch</groupId>
    <artifactId>pytorch-native-cpu</artifactId>
    <version>2.0.1</version>
    <scope>runtime</scope>
</dependency>
<!-- GPU版本（可选，如果使用GPU） -->
<!--
<dependency>
    <groupId>ai.djl.pytorch</groupId>
    <artifactId>pytorch-native-cu118</artifactId>
    <version>2.0.1</version>
    <scope>runtime</scope>
</dependency>
-->
```

**完整的Java实现**:

```java
package com.sdecloud.springai.alibaba.service.impl;

import ai.djl.*;
import ai.djl.inference.Predictor;
import ai.djl.ndarray.*;
import ai.djl.ndarray.types.Shape;
import ai.djl.repository.zoo.*;
import ai.djl.translate.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.nio.file.Paths;
import java.util.*;

/**
 * ConvLSTM模型预测服务 - DJL实现
 * 直接加载PyTorch模型，无需转换为ONNX
 */
@Service
@Slf4j
public class ConvLSTMPredictServiceDJL {
    
    private List<Model> models;  // 6个模型
    private List<Predictor<NDList, NDList>> predictors;  // 6个预测器
    private static final int NUM_MODELS = 6;
    
    // 模型参数（与实际Python代码一致）
    private static final int INPUT_CHANNELS = 9;
    private static final int SEQUENCE_LENGTH = 12;
    private static final int HEIGHT = 3;
    private static final int WIDTH = 3;
    
    @PostConstruct
    public void init() throws Exception {
        models = new ArrayList<>();
        predictors = new ArrayList<>();
        
        // 加载6个TorchScript模型
        for (int i = 1; i <= NUM_MODELS; i++) {
            String modelFileName = String.format("convlstm_regressor_model_12_27_2_%d.pt", i);
            String modelPath = getClass().getResource("/models/" + modelFileName).getPath();
            
            // 使用DJL加载TorchScript模型
            Criteria<NDList, NDList> criteria = Criteria.builder()
                .setTypes(NDList.class, NDList.class)
                .optModelPath(Paths.get(modelPath))
                .optEngine("PyTorch")
                .optDevice(Device.cpu())  // 或 Device.gpu() 如果使用GPU
                .build();
            
            Model model = criteria.loadModel();
            models.add(model);
            
            // 创建预测器
            Predictor<NDList, NDList> predictor = model.newPredictor(
                new Translator<NDList, NDList>() {
                    @Override
                    public NDList processInput(TranslatorContext ctx, NDList input) {
                        // 输入已经是NDList，直接返回
                        return input;
                    }
                    
                    @Override
                    public NDList processOutput(TranslatorContext ctx, NDList output) {
                        // 输出已经是NDList，直接返回
                        return output;
                    }
                }
            );
            predictors.add(predictor);
            
            log.info("模型 {} 加载成功: {}", i, modelFileName);
        }
        
        log.info("所有ConvLSTM模型加载完成，共{}个模型", NUM_MODELS);
    }
    
    /**
     * 执行预测（6个模型集成）
     * 
     * @param inputData 输入数据，形状: (1, 12, 9, 3, 3) = (batch, time_steps, channels, height, width)
     * @return 6个模型的预测结果列表
     */
    public List<Float> predict(float[][][][][] inputData) throws Exception {
        List<Float> predictions = new ArrayList<>();
        
        // 确保输入形状正确
        if (inputData.length != 1 || 
            inputData[0].length != SEQUENCE_LENGTH ||
            inputData[0][0].length != INPUT_CHANNELS ||
            inputData[0][0][0].length != HEIGHT ||
            inputData[0][0][0][0].length != WIDTH) {
            throw new IllegalArgumentException("输入数据形状不正确");
        }
        
        // 将5维数组转换为NDArray
        NDManager manager = NDManager.newBaseManager();
        try {
            // 展平为1维数组
            float[] flatInput = flattenInput(inputData);
            
            // 创建NDArray，形状: (1, 12, 9, 3, 3)
            NDArray inputArray = manager.create(flatInput, new Shape(1, SEQUENCE_LENGTH, INPUT_CHANNELS, HEIGHT, WIDTH));
            NDList inputList = new NDList(inputArray);
            
            // 对6个模型分别进行推理
            for (int i = 0; i < NUM_MODELS; i++) {
                Predictor<NDList, NDList> predictor = predictors.get(i);
                
                // 执行推理
                NDList outputList = predictor.predict(inputList);
                NDArray outputArray = outputList.singletonOrThrow();
                
                // 获取预测值（标量）
                float prediction = outputArray.toFloatArray()[0];
                predictions.add(prediction);
                
                // 清理输出资源
                outputList.close();
            }
            
            // 清理输入资源
            inputList.close();
            inputArray.close();
            
        } finally {
            manager.close();
        }
        
        return predictions;
    }
    
    /**
     * 将5维数组展平为1维数组
     */
    private float[] flattenInput(float[][][][][] input) {
        int totalSize = input.length * 
                       input[0].length * 
                       input[0][0].length * 
                       input[0][0][0].length * 
                       input[0][0][0][0].length;
        
        float[] flat = new float[totalSize];
        int idx = 0;
        
        for (float[][][][] batch : input) {
            for (float[][][] timeStep : batch) {
                for (float[][] channel : timeStep) {
                    for (float[] row : channel) {
                        for (float val : row) {
                            flat[idx++] = val;
                        }
                    }
                }
            }
        }
        
        return flat;
    }
    
    /**
     * 计算6个模型预测结果的平均值（集成预测）
     */
    public float predictEnsemble(float[][][][][] inputData) throws Exception {
        List<Float> predictions = predict(inputData);
        
        // 计算平均值
        double sum = predictions.stream().mapToDouble(Float::doubleValue).sum();
        return (float) (sum / NUM_MODELS);
    }
    
    @PreDestroy
    public void cleanup() {
        try {
            // 关闭所有预测器
            for (Predictor<NDList, NDList> predictor : predictors) {
                if (predictor != null) {
                    predictor.close();
                }
            }
            predictors.clear();
            
            // 关闭所有模型
            for (Model model : models) {
                if (model != null) {
                    model.close();
                }
            }
            models.clear();
            
            log.info("ConvLSTM模型资源已清理");
        } catch (Exception e) {
            log.error("清理资源时出错", e);
        }
    }
}
```

**步骤3: 使用方式（与ONNX版本相同）**

数据预处理服务和MCP工具封装与ONNX版本完全相同，只需替换服务类：

```java
@Autowired
private ConvLSTMPredictServiceDJL predictService;  // 使用DJL版本

// 其他代码完全相同
```

#### 2.3.3 DJL vs ONNX Runtime 对比

| 特性 | DJL | ONNX Runtime |
|------|-----|--------------|
| **模型转换** | TorchScript (.pt) | ONNX (.onnx) |
| **转换复杂度** | 简单（trace/script） | 中等（可能有兼容性问题） |
| **直接加载PyTorch** | ✅ 是 | ❌ 需要转换 |
| **性能** | 好 | 最好 |
| **易用性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **AWS官方支持** | ✅ 是 | ❌ 否（Microsoft） |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**推荐**: 优先使用 **DJL**，因为：
- 直接加载PyTorch模型，无需转换
- AWS官方支持，成熟稳定
- 纯Java实现，部署简单
- 易用性好，API简洁

### 2.4 方案2: ONNX Runtime

#### 2.3.1 方案说明

**工作流程**:
```
Python训练 → 导出ONNX模型 → Java加载ONNX模型 → 推理
```

**技术栈**:
- Python端: PyTorch → `torch.onnx.export()`
- Java端: ONNX Runtime Java

#### 2.3.2 实施步骤

**步骤1: Python端导出ONNX模型**

基于实际的 `models_predict` 代码结构，需要导出6个模型。创建导出脚本：

```python
# export_onnx_models.py
import torch
import torch.onnx
import os
from models_predict.ConvLSTM import ConvLSTMRegressor

# 模型参数配置（与实际代码一致）
input_channels = 9     # 输入数据的通道数 (C)
height = 3             # 输入数据的高度 (H)
width = 3              # 输入数据的宽度 (W)
sequence_length = 12   # 时间序列长度 (T)
convlstm_hidden_dim = 27  # ConvLSTM 隐藏层维度
num_layers = 2         # ConvLSTM 层数
kernel_size = (3, 3)   # 卷积核大小

# 模型文件路径
models_dir = "models_predict/models_file"
output_dir = "models_predict/models_file_onnx"
os.makedirs(output_dir, exist_ok=True)

# 准备示例输入（与实际数据格式一致）
# 输入形状: (batch=1, time_steps=12, channels=9, height=3, width=3)
dummy_input = torch.randn(1, 12, 9, 3, 3).float()

# 导出6个模型
for i in range(1, 7):
    model_file = f"convlstm_regressor_model_12_27_2_{i}.pth"
    onnx_file = f"convlstm_regressor_model_12_27_2_{i}.onnx"
    
    print(f"正在导出模型 {i}/6: {model_file}")
    
    # 创建模型实例
    model = ConvLSTMRegressor(
        input_dim=input_channels,
        hidden_dim=[convlstm_hidden_dim] * num_layers,
        kernel_size=kernel_size,
        num_layers=num_layers
    )
    
    # 加载训练好的参数
    model_path = os.path.join(models_dir, model_file)
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    model.eval()
    
    # 导出为ONNX格式
    onnx_path = os.path.join(output_dir, onnx_file)
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},  # 允许动态batch
            'output': {0: 'batch_size'}
        },
        opset_version=13,  # 使用ONNX opset 13（更好的ConvLSTM支持）
        do_constant_folding=True,  # 常量折叠优化
        export_params=True,  # 导出参数
        verbose=False
    )
    
    print(f"✓ 模型 {i} 已导出: {onnx_file}")

print("\n所有模型导出完成！")
print(f"ONNX模型保存在: {output_dir}")

# 验证ONNX模型
try:
    import onnx
    print("\n验证ONNX模型...")
    for i in range(1, 7):
        onnx_file = f"convlstm_regressor_model_12_27_2_{i}.onnx"
        onnx_path = os.path.join(output_dir, onnx_file)
        onnx_model = onnx.load(onnx_path)
        onnx.checker.check_model(onnx_model)
        print(f"✓ 模型 {i} 验证通过")
    print("\n所有模型验证成功！")
except ImportError:
    print("警告: 未安装onnx包，跳过验证。安装命令: pip install onnx")
```

**运行导出脚本**:
```bash
cd /path/to/environment
python export_onnx_models.py
```

**注意事项**:
- 确保输入形状为 `(1, 12, 9, 3, 3)`，与实际推理时一致
- 使用 `opset_version=13` 以获得更好的ConvLSTM支持
- 导出后验证模型完整性
- 6个模型需要分别导出，用于集成预测

**步骤2: Java端加载和推理**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.microsoft.onnxruntime</groupId>
    <artifactId>onnxruntime</artifactId>
    <version>1.16.0</version>
</dependency>
```

**完整的Java实现**（基于实际模型结构）:

```java
package com.sdecloud.springai.alibaba.service.impl;

import ai.onnxruntime.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.nio.file.Paths;
import java.util.*;

/**
 * ConvLSTM模型预测服务
 * 基于ONNX Runtime实现，支持6个模型集成预测
 */
@Service
@Slf4j
public class ConvLSTMPredictService {
    
    private OrtEnvironment env;
    private List<OrtSession> sessions;  // 6个模型会话
    private static final int NUM_MODELS = 6;
    
    // 模型参数（与实际Python代码一致）
    private static final int INPUT_CHANNELS = 9;
    private static final int SEQUENCE_LENGTH = 12;
    private static final int HEIGHT = 3;
    private static final int WIDTH = 3;
    
    @PostConstruct
    public void init() throws OrtException {
        env = OrtEnvironment.getEnvironment();
        sessions = new ArrayList<>();
        
        OrtSession.SessionOptions opts = new OrtSession.SessionOptions();
        
        // 可选：使用GPU加速
        try {
            opts.addCUDA(0);
            log.info("使用GPU加速推理");
        } catch (OrtException e) {
            log.warn("GPU不可用，使用CPU推理: {}", e.getMessage());
        }
        
        // 设置线程数（CPU推理时）
        opts.setIntraOpNumThreads(4);
        opts.setInterOpNumThreads(4);
        
        // 加载6个ONNX模型
        for (int i = 1; i <= NUM_MODELS; i++) {
            String modelFileName = String.format("convlstm_regressor_model_12_27_2_%d.onnx", i);
            String modelPath = getClass().getResource("/models/" + modelFileName).getPath();
            
            OrtSession session = env.createSession(modelPath, opts);
            sessions.add(session);
            log.info("模型 {} 加载成功: {}", i, modelFileName);
        }
        
        log.info("所有ConvLSTM模型加载完成，共{}个模型", NUM_MODELS);
    }
    
    /**
     * 执行预测（6个模型集成）
     * 
     * @param inputData 输入数据，形状: (1, 12, 9, 3, 3) = (batch, time_steps, channels, height, width)
     * @return 6个模型的预测结果列表
     */
    public List<Float> predict(float[][][][][] inputData) throws OrtException {
        List<Float> predictions = new ArrayList<>();
        
        // 确保输入形状正确
        if (inputData.length != 1 || 
            inputData[0].length != SEQUENCE_LENGTH ||
            inputData[0][0].length != INPUT_CHANNELS ||
            inputData[0][0][0].length != HEIGHT ||
            inputData[0][0][0][0].length != WIDTH) {
            throw new IllegalArgumentException(
                String.format("输入数据形状不正确，期望: (1, %d, %d, %d, %d), 实际: (%d, %d, %d, %d, %d)",
                    SEQUENCE_LENGTH, INPUT_CHANNELS, HEIGHT, WIDTH,
                    inputData.length,
                    inputData.length > 0 ? inputData[0].length : 0,
                    inputData.length > 0 && inputData[0].length > 0 ? inputData[0][0].length : 0,
                    inputData.length > 0 && inputData[0].length > 0 && inputData[0][0].length > 0 ? inputData[0][0][0].length : 0,
                    inputData.length > 0 && inputData[0].length > 0 && inputData[0][0].length > 0 && inputData[0][0][0].length > 0 ? inputData[0][0][0][0].length : 0
                )
            );
        }
        
        // 将5维数组转换为1维数组（ONNX Runtime需要）
        float[] flatInput = flattenInput(inputData);
        
        // 创建输入Tensor
        // 形状: (1, 12, 9, 3, 3)
        long[] shape = {1, SEQUENCE_LENGTH, INPUT_CHANNELS, HEIGHT, WIDTH};
        OnnxTensor inputTensor = OnnxTensor.createTensor(env, flatInput, shape);
        
        try {
            // 对6个模型分别进行推理
            for (int i = 0; i < NUM_MODELS; i++) {
                OrtSession session = sessions.get(i);
                
                // 执行推理
                Map<String, OnnxValue> inputs = Collections.singletonMap("input", inputTensor);
                OrtSession.Result result = session.run(inputs);
                
                // 获取输出（形状: (1, 1)）
                OnnxValue outputValue = result.get(0);
                float[][] output = (float[][]) outputValue.getValue();
                
                // 提取预测值（标量）
                float prediction = output[0][0];
                predictions.add(prediction);
                
                // 清理资源
                result.close();
            }
        } finally {
            inputTensor.close();
        }
        
        return predictions;
    }
    
    /**
     * 将5维数组展平为1维数组
     * 输入形状: (batch, time_steps, channels, height, width)
     */
    private float[] flattenInput(float[][][][][] input) {
        int totalSize = input.length * 
                       input[0].length * 
                       input[0][0].length * 
                       input[0][0][0].length * 
                       input[0][0][0][0].length;
        
        float[] flat = new float[totalSize];
        int idx = 0;
        
        for (float[][][][] batch : input) {
            for (float[][][] timeStep : batch) {
                for (float[][] channel : timeStep) {
                    for (float[] row : channel) {
                        for (float val : row) {
                            flat[idx++] = val;
                        }
                    }
                }
            }
        }
        
        return flat;
    }
    
    /**
     * 计算6个模型预测结果的平均值（集成预测）
     */
    public float predictEnsemble(float[][][][][] inputData) throws OrtException {
        List<Float> predictions = predict(inputData);
        
        // 计算平均值
        double sum = predictions.stream().mapToDouble(Float::doubleValue).sum();
        return (float) (sum / NUM_MODELS);
    }
    
    @PreDestroy
    public void cleanup() {
        try {
            // 关闭所有会话
            for (OrtSession session : sessions) {
                if (session != null) {
                    session.close();
                }
            }
            sessions.clear();
            
            // 关闭环境
            if (env != null) {
                env.close();
            }
            
            log.info("ConvLSTM模型资源已清理");
        } catch (OrtException e) {
            log.error("清理资源时出错", e);
        }
    }
}
```

**步骤3: 数据预处理服务实现**

基于 `data_preprocessing.py` 的逻辑，实现Java版本的数据预处理：

```java
package com.sdecloud.springai.alibaba.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * ConvLSTM数据预处理服务
 * 将数据库查询的数据转换为模型输入格式: (1, 12, 9, 3, 3)
 */
@Service
@Slf4j
public class ConvLSTMDataPreprocessingService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    private static final int SEQUENCE_LENGTH = 12;
    private static final int INPUT_CHANNELS = 9;
    private static final int GRID_SIZE = 3;
    
    /**
     * 生成模型输入数据
     * 
     * @param staCode 监测站点代码
     * @param predictStartTime 预测开始时间，格式: "YYYY-MM-DD HH:MM:SS"
     * @return 模型输入数据，形状: (1, 12, 9, 3, 3)
     */
    public float[][][][][] generateModelInput(String staCode, String predictStartTime) {
        try {
            // 1. 查询站点对应的网格ID
            String gridId = getStationGridId(staCode);
            if (gridId == null) {
                throw new RuntimeException("未找到站点对应的网格信息: " + staCode);
            }
            
            // 2. 构建3×3网格列表（中心网格+8个相邻网格）
            List<String> gridList = buildGridList(gridId);
            
            // 3. 计算时间范围（过去12小时）
            LocalDateTime endTime = LocalDateTime.parse(
                predictStartTime, 
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            );
            LocalDateTime startTime = endTime.minusHours(11);
            
            // 4. 查询历史数据
            Map<LocalDateTime, Map<String, float[]>> gridDataMap = 
                queryHistoricalData(gridList, startTime, endTime);
            
            // 5. 数据补全和插值
            Map<LocalDateTime, float[][]> completeGridData = 
                completeAndInterpolateData(gridDataMap, startTime, endTime);
            
            // 6. 转换为模型输入格式: (1, 12, 9, 3, 3)
            float[][][][][] modelInput = convertToModelInput(completeGridData, gridList);
            
            return modelInput;
            
        } catch (Exception e) {
            log.error("数据预处理失败", e);
            throw new RuntimeException("数据预处理失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 查询站点对应的网格ID
     */
    private String getStationGridId(String staCode) {
        String sql = "SELECT sta_grid_id FROM sta_jinan WHERE sta_code = ? LIMIT 1";
        try {
            return jdbcTemplate.queryForObject(sql, String.class, staCode);
        } catch (Exception e) {
            log.error("查询站点网格ID失败: {}", staCode, e);
            return null;
        }
    }
    
    /**
     * 构建3×3网格列表
     */
    private List<String> buildGridList(String centerGridId) {
        String[] parts = centerGridId.split("-");
        int centerX = Integer.parseInt(parts[0]);
        int centerY = Integer.parseInt(parts[1]);
        
        List<String> gridList = new ArrayList<>();
        // 按照Python代码的顺序: [-1,1], [0,1], [1,1], [-1,0], [0,0], [1,0], [-1,-1], [0,-1], [1,-1]
        int[][] offsets = {{-1, 1}, {0, 1}, {1, 1}, {-1, 0}, {0, 0}, {1, 0}, {-1, -1}, {0, -1}, {1, -1}};
        
        for (int[] offset : offsets) {
            gridList.add((centerX + offset[0]) + "-" + (centerY + offset[1]));
        }
        
        return gridList;
    }
    
    /**
     * 查询历史数据
     */
    private Map<LocalDateTime, Map<String, float[]>> queryHistoricalData(
            List<String> gridList, LocalDateTime startTime, LocalDateTime endTime) {
        
        // 构建SQL查询（简化版，实际需要根据数据库结构调整）
        String sql = """
            SELECT 
                a.sta_code,
                a.data_time,
                a.aqi,
                a.o3,
                a.co,
                a.so2,
                a.no2,
                a.pm25,
                a.pm10,
                a.wind_direction_degree,
                a.wind_speed,
                a.air_temperature
            FROM data_daq_sta_hour_audit_weather_new a
            WHERE a.data_time BETWEEN ? AND ?
            ORDER BY a.data_time
            """;
        
        // 执行查询并处理结果（需要根据实际数据结构实现）
        // 这里简化处理，实际需要：
        // 1. 查询所有相关站点的数据
        // 2. 按网格聚合数据
        // 3. 计算9个特征：O3, CO*1000, SO2, NO2, PM2.5, PM10, 
        //    wind_speed*sin(wind_direction), wind_speed*cos(wind_direction), air_temperature
        
        Map<LocalDateTime, Map<String, float[]>> result = new HashMap<>();
        // TODO: 实现具体的数据查询和聚合逻辑
        // 参考 data_preprocessing.py 的 df_data_process 函数
        
        return result;
    }
    
    /**
     * 数据补全和插值
     */
    private Map<LocalDateTime, float[][]> completeAndInterpolateData(
            Map<LocalDateTime, Map<String, float[]>> gridDataMap,
            LocalDateTime startTime, LocalDateTime endTime) {
        
        Map<LocalDateTime, float[][]> completeData = new LinkedHashMap<>();
        
        // 对每个时间点进行数据补全
        for (int i = 0; i < SEQUENCE_LENGTH; i++) {
            LocalDateTime currentTime = startTime.plusHours(i);
            
            if (gridDataMap.containsKey(currentTime)) {
                // 数据存在，直接使用
                Map<String, float[]> gridData = gridDataMap.get(currentTime);
                float[][] timeStepData = convertGridDataToArray(gridData);
                completeData.put(currentTime, timeStepData);
            } else {
                // 数据缺失，进行线性插值
                float[][] interpolatedData = interpolateData(
                    gridDataMap, currentTime, startTime, endTime
                );
                completeData.put(currentTime, interpolatedData);
            }
        }
        
        return completeData;
    }
    
    /**
     * 转换为模型输入格式: (1, 12, 9, 3, 3)
     */
    private float[][][][][] convertToModelInput(
            Map<LocalDateTime, float[][]> completeGridData,
            List<String> gridList) {
        
        float[][][][][] modelInput = new float[1][SEQUENCE_LENGTH][INPUT_CHANNELS][GRID_SIZE][GRID_SIZE];
        
        int timeIdx = 0;
        for (Map.Entry<LocalDateTime, float[][]> entry : completeGridData.entrySet()) {
            float[][] timeStepData = entry.getValue();
            
            // timeStepData 形状: (9, 3, 3) - (channels, height, width)
            // 需要转换为 (channels, height, width) 并放入 modelInput
            for (int c = 0; c < INPUT_CHANNELS; c++) {
                for (int h = 0; h < GRID_SIZE; h++) {
                    for (int w = 0; w < GRID_SIZE; w++) {
                        modelInput[0][timeIdx][c][h][w] = timeStepData[c][h][w];
                    }
                }
            }
            
            timeIdx++;
        }
        
        return modelInput;
    }
    
    // 辅助方法实现...
    private float[][] convertGridDataToArray(Map<String, float[]> gridData) {
        // 实现网格数据到数组的转换
        // TODO: 根据实际数据结构实现
        return new float[INPUT_CHANNELS][GRID_SIZE][GRID_SIZE];
    }
    
    private float[][] interpolateData(
            Map<LocalDateTime, Map<String, float[]>> gridDataMap,
            LocalDateTime currentTime,
            LocalDateTime startTime,
            LocalDateTime endTime) {
        // 实现线性插值
        // TODO: 根据实际需求实现
        return new float[INPUT_CHANNELS][GRID_SIZE][GRID_SIZE];
    }
}
```

**步骤4: 封装为MCP工具（可选）**

```java
package com.sdecloud.springai.alibaba.tool;

import com.sdecloud.springai.alibaba.service.impl.ConvLSTMPredictService;
import com.sdecloud.springai.alibaba.service.impl.ConvLSTMDataPreprocessingService;
import com.alibaba.cloud.ai.mcp.annotation.McpTool;
import com.alibaba.cloud.ai.mcp.annotation.ToolParam;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * AQI预测MCP工具
 */
@Component
@Slf4j
@McpTool(
    name = "predict_aqi",
    description = "使用ConvLSTM模型预测未来6小时的AQI值。基于过去12小时的历史数据，使用6个模型集成预测。"
)
public class AqiPredictTool {
    
    @Autowired
    private ConvLSTMPredictService predictService;
    
    @Autowired
    private ConvLSTMDataPreprocessingService preprocessingService;
    
    @ToolParam(
        name = "sta_code",
        description = "监测站点代码，例如: 5063701020020001",
        required = true
    )
    private String staCode;
    
    @ToolParam(
        name = "predict_start_time",
        description = "预测开始时间，格式: YYYY-MM-DD HH:MM:SS，例如: 2025-12-01 17:00:00",
        required = true
    )
    private String predictStartTime;
    
    public AqiPredictResult predict() {
        try {
            log.info("开始AQI预测 - 站点: {}, 时间: {}", staCode, predictStartTime);
            
            // 1. 数据预处理：生成模型输入数据
            float[][][][][] modelInput = preprocessingService.generateModelInput(
                staCode, 
                predictStartTime
            );
            
            // 2. 模型推理：6个模型集成预测
            List<Float> predictions = predictService.predict(modelInput);
            
            // 3. 计算平均值（集成预测）
            double avgPrediction = predictions.stream()
                .mapToDouble(Float::doubleValue)
                .average()
                .orElse(0.0);
            
            // 4. 构建返回结果
            AqiPredictResult result = new AqiPredictResult();
            result.setStaCode(staCode);
            result.setPredictStartTime(predictStartTime);
            result.setPredictions(predictions);
            result.setEnsemblePrediction((float) avgPrediction);
            result.setSuccess(true);
            result.setMessage("预测成功");
            
            log.info("AQI预测完成 - 站点: {}, 集成预测值: {}", staCode, avgPrediction);
            
            return result;
            
        } catch (Exception e) {
            log.error("AQI预测失败", e);
            AqiPredictResult result = new AqiPredictResult();
            result.setSuccess(false);
            result.setMessage("预测失败: " + e.getMessage());
            return result;
        }
    }
    
    @Data
    public static class AqiPredictResult {
        private String staCode;
        private String predictStartTime;
        private List<Float> predictions;  // 6个模型的预测结果
        private Float ensemblePrediction;  // 集成预测值（平均值）
        private boolean success;
        private String message;
    }
}
```

#### 2.3.3 性能优化

```java
// 使用GPU加速（如果可用）
OrtSession.SessionOptions opts = new OrtSession.SessionOptions();
try {
    opts.addCUDA(0);  // 使用第一个GPU
} catch (OrtException e) {
    // GPU不可用，使用CPU
    log.warn("GPU不可用，使用CPU推理");
}

// 使用线程池进行批量推理
@Async
public CompletableFuture<float[]> predictAsync(float[][][][] input) {
    return CompletableFuture.supplyAsync(() -> {
        try {
            return predict(input);
        } catch (OrtException e) {
            throw new RuntimeException(e);
        }
    }, executorService);
}
```

### 2.4 方案2: DJL (Deep Java Library)

#### 2.4.1 方案说明

**工作流程**:
```
Python训练 → 导出TorchScript → Java使用DJL加载 → 推理
```

**技术栈**:
- Python端: PyTorch → `torch.jit.script()` 或 `torch.jit.trace()`
- Java端: DJL PyTorch Engine

#### 2.4.2 实施步骤

**步骤1: Python端导出TorchScript**

```python
import torch

# 加载训练好的模型
model = ConvLSTMRegressor(...)
model.load_state_dict(torch.load('convlstm_model.pth'))
model.eval()

# 准备示例输入
dummy_input = torch.randn(1, 9, 3, 3, 12)

# 方法1: 使用trace（推荐，更稳定）
traced_model = torch.jit.trace(model, dummy_input)
traced_model.save('convlstm_model.pt')

# 方法2: 使用script（如果模型有控制流）
# scripted_model = torch.jit.script(model)
# scripted_model.save('convlstm_model.pt')

print("模型已导出为 convlstm_model.pt")
```

**步骤2: Java端加载和推理**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>ai.djl</groupId>
    <artifactId>pytorch-engine</artifactId>
    <version>0.24.0</version>
</dependency>
<dependency>
    <groupId>ai.djl.pytorch</groupId>
    <artifactId>pytorch-native-cpu</artifactId>
    <version>2.0.1</version>
    <scope>runtime</scope>
</dependency>
```

```java
@Service
public class ConvLSTMPredictService {
    
    private Model model;
    private Predictor<float[][][][], float[]> predictor;
    
    @PostConstruct
    public void init() throws ModelException, IOException {
        // 加载模型
        model = Model.newInstance("ConvLSTM");
        
        // 模型文件放在resources目录下
        Path modelPath = Paths.get(getClass().getResource("/models/convlstm_model.pt").toURI());
        model.load(modelPath);
        
        // 创建预测器
        predictor = model.newPredictor(
            new Translator<float[][][][], float[]>() {
                @Override
                public NDList processInput(TranslatorContext ctx, float[][][][] input) {
                    // 转换为NDArray
                    NDManager manager = ctx.getNDManager();
                    NDArray array = manager.create(input);
                    return new NDList(array);
                }
                
                @Override
                public float[] processOutput(TranslatorContext ctx, NDList list) {
                    // 转换输出
                    NDArray output = list.singletonOrThrow();
                    return output.toFloatArray();
                }
            }
        );
    }
    
    public float[] predict(float[][][][] inputData) throws TranslateException {
        return predictor.predict(inputData);
    }
    
    @PreDestroy
    public void cleanup() {
        if (predictor != null) {
            predictor.close();
        }
        if (model != null) {
            model.close();
        }
    }
}
```

### 2.5 方案3: 模型服务化（MCP工具）

#### 2.5.1 方案说明

如果模型转换有困难，可以将模型封装为MCP工具，通过Python服务提供推理能力。

**工作流程**:
```
Python训练 → Python服务加载模型 → MCP Server暴露工具 → Java MCP Client调用
```

#### 2.5.2 实施步骤

**Python端: MCP Server**

```python
from mcp.server import Server
from mcp.server.models import Tool

app = Server("convlstm-predict-server")

@app.tool()
async def predict_aqi(
    sta_code: str,
    predict_start_time: str
) -> dict:
    """
    使用ConvLSTM模型预测未来6小时的AQI值
    
    Args:
        sta_code: 监测站点代码
        predict_start_time: 预测开始时间
    
    Returns:
        预测结果，包含未来6小时的AQI值
    """
    # 1. 加载模型（全局加载一次）
    if not hasattr(app, 'model'):
        app.model = load_model()
    
    # 2. 获取历史数据
    historical_data = get_historical_data(sta_code, predict_start_time)
    
    # 3. 数据预处理
    preprocessed = preprocess(historical_data)
    
    # 4. 模型推理
    predictions = app.model.predict(preprocessed)
    
    # 5. 后处理
    result = postprocess(predictions)
    
    return {
        "sta_code": sta_code,
        "predict_start_time": predict_start_time,
        "predictions": result
    }

if __name__ == "__main__":
    # 启动MCP服务器
    app.run(port=5002)
```

**Java端: MCP Client调用**

```java
@Service
public class AqiPredictService {
    
    @Autowired
    private McpClient mcpClient;
    
    public AqiPredictResult predict(String staCode, String startTime) {
        // 通过MCP客户端调用Python服务
        Map<String, Object> result = mcpClient.callTool(
            "predict_aqi",
            Map.of(
                "sta_code", staCode,
                "predict_start_time", startTime
            )
        );
        
        return convertToResult(result);
    }
}
```

---

## 3. 方案对比与推荐

### 3.1 图表工具方案推荐

| 方案 | 适用场景 | 推荐度 |
|------|---------|--------|
| **Java原生图表库** | 简单图表、性能要求高 | ⭐⭐⭐⭐⭐ |
| **Python图表服务** | 复杂图表、已有Python代码 | ⭐⭐⭐ |
| **混合方案** | 兼顾性能和功能 | ⭐⭐⭐⭐⭐ |

**最终推荐**: **混合方案**
- 简单图表（折线图、柱状图）使用Java原生库（JFreeChart）
- 复杂图表（3D图表、交互式图表）使用Python服务（Plotly）
- 统一通过MCP协议调用

### 3.2 ConvLSTM模型方案推荐

| 方案 | 适用场景 | 推荐度 |
|------|---------|--------|
| **DJL** | 直接加载PyTorch模型、易用性要求高 | ⭐⭐⭐⭐⭐ |
| **ONNX Runtime** | 生产环境、性能要求最高 | ⭐⭐⭐⭐ |
| **模型服务化** | 模型转换困难、灵活性要求高 | ⭐⭐⭐ |

**最终推荐**: **DJL (Deep Java Library)**
- ✅ 直接加载PyTorch模型，无需转换
- ✅ AWS官方支持，成熟稳定
- ✅ 纯Java实现，部署简单
- ✅ 易用性好，API简洁
- ✅ 性能良好

**备选方案**: 如果对性能要求极高，可以使用ONNX Runtime

### 3.3 图表工具方案推荐

| 方案 | 适用场景 | 推荐度 |
|------|---------|--------|
| **Java原生图表库** | 简单图表、性能要求高 | ⭐⭐⭐⭐⭐ |
| **集成Python脚本** | 复杂图表、已有Python代码 | ⭐⭐⭐⭐ |
| **Python服务** | 复杂图表、已有Python服务 | ⭐⭐⭐ |

**最终推荐**: **混合方案**
- 简单图表（折线图、柱状图）使用Java原生库（JFreeChart/XChart）
- 复杂图表（3D图表、交互式图表）使用集成Python脚本（ProcessBuilder/Jep）
- 统一通过MCP协议调用

---

## 4. 实施步骤

### 4.1 图表工具MCP实施步骤

#### 阶段1: 创建MCP服务器（1周）

1. **创建MCP服务器项目**
   ```bash
   # 使用Spring AI Alibaba MCP Server Boot Starter
   ```

2. **实现图表生成工具**
   ```java
   @McpTool("generate_line_chart")
   @McpTool("generate_bar_chart")
   @McpTool("generate_scatter_chart")
   // ...
   ```

3. **集成图表库**
   - 简单图表: JFreeChart
   - 复杂图表: 调用Python服务（可选）

#### 阶段2: 集成到Spring AI Alibaba（3-5天）

1. **配置MCP客户端**
   ```yaml
   spring:
     ai:
       alibaba:
         mcp:
           clients:
             chart-server:
               url: http://localhost:5000/sse
   ```

2. **在Agent中使用**
   ```java
   @Autowired
   private McpClient chartMcpClient;
   
   public String generateReport() {
       // Agent自动发现并调用图表工具
       // ...
   }
   ```

#### 阶段3: 测试和优化（3-5天）

1. 功能测试
2. 性能测试
3. 错误处理
4. 文档编写

### 4.2 ConvLSTM模型集成实施步骤

#### 阶段1: 模型转换（2-3天）

1. **Python端导出ONNX模型**
   - 创建 `export_onnx_models.py` 脚本（见步骤1代码）
   - 运行脚本导出6个模型为ONNX格式
   - 确保输入形状为 `(1, 12, 9, 3, 3)`

2. **验证ONNX模型**
   ```python
   import onnx
   for i in range(1, 7):
       onnx_file = f"convlstm_regressor_model_12_27_2_{i}.onnx"
       onnx_model = onnx.load(onnx_file)
       onnx.checker.check_model(onnx_model)
       print(f"模型 {i} 验证通过")
   ```

3. **测试ONNX模型推理（Python端验证）**
   ```python
   import onnxruntime as ort
   import numpy as np
   
   # 加载模型
   session = ort.InferenceSession("convlstm_regressor_model_12_27_2_1.onnx")
   
   # 准备输入
   input_data = np.random.randn(1, 12, 9, 3, 3).astype(np.float32)
   
   # 推理
   outputs = session.run(None, {"input": input_data})
   print(f"预测结果: {outputs[0]}")
   ```

#### 阶段2: Java端集成（1-2周）

1. **添加依赖**
   ```xml
   <dependency>
       <groupId>com.microsoft.onnxruntime</groupId>
       <artifactId>onnxruntime</artifactId>
       <version>1.16.0</version>
   </dependency>
   ```

2. **将ONNX模型文件放入resources**
   ```
   src/main/resources/models/
   ├── convlstm_regressor_model_12_27_2_1.onnx
   ├── convlstm_regressor_model_12_27_2_2.onnx
   ├── convlstm_regressor_model_12_27_2_3.onnx
   ├── convlstm_regressor_model_12_27_2_4.onnx
   ├── convlstm_regressor_model_12_27_2_5.onnx
   └── convlstm_regressor_model_12_27_2_6.onnx
   ```

3. **实现推理服务**
   - 创建 `ConvLSTMPredictService`（见步骤2完整代码）
   - 支持6个模型加载和集成预测

4. **实现数据预处理服务**
   - 创建 `ConvLSTMDataPreprocessingService`（见步骤3代码）
   - 实现数据库查询、网格化、数据补全等逻辑

5. **封装为MCP工具（可选）**
   - 创建 `AqiPredictTool`（见步骤4代码）
   - 在Spring AI Alibaba中自动注册为MCP工具

#### 阶段3: 测试和优化（1周）

1. **单元测试**
   - 模型加载测试
   - 推理准确性测试
   - 性能测试

2. **集成测试**
   - 端到端测试
   - 压力测试

3. **优化**
   - GPU加速（如果可用）
   - 批量推理
   - 缓存优化

---

## 5. 代码示例

### 5.1 图表工具MCP服务器完整示例

```java
@SpringBootApplication
@EnableMcpServer
public class ChartMcpServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ChartMcpServerApplication.class, args);
    }
}

@Service
public class ChartService {
    
    public byte[] generateLineChart(ChartData data) {
        // 使用JFreeChart生成图表
        JFreeChart chart = ChartFactory.createLineChart(
            data.getTitle(),
            data.getXLabel(),
            data.getYLabel(),
            createDataset(data),
            PlotOrientation.VERTICAL,
            true, true, false
        );
        
        // 转换为字节数组
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            ChartUtils.writeChartAsPNG(baos, chart, 800, 600);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return baos.toByteArray();
    }
}

@McpTool(
    name = "generate_line_chart",
    description = "生成折线图"
)
public class LineChartTool {
    
    @Autowired
    private ChartService chartService;
    
    @Autowired
    private MinioService minioService;
    
    @ToolParam(name = "data", description = "图表数据JSON")
    private String dataJson;
    
    @ToolParam(name = "title", description = "图表标题")
    private String title;
    
    public ChartResult generate() {
        // 解析数据
        ChartData data = parseData(dataJson);
        data.setTitle(title);
        
        // 生成图表
        byte[] chartBytes = chartService.generateLineChart(data);
        
        // 上传到MinIO
        String url = minioService.uploadChart(chartBytes, "chart_" + UUID.randomUUID() + ".png");
        
        return ChartResult.builder()
            .format("url")
            .data(url)
            .build();
    }
}
```

### 5.2 ConvLSTM ONNX推理完整示例（基于实际代码结构）

**完整的端到端实现**:

```java
package com.sdecloud.springai.alibaba.controller;

import com.sdecloud.springai.alibaba.service.impl.ConvLSTMPredictService;
import com.sdecloud.springai.alibaba.service.impl.ConvLSTMDataPreprocessingService;
import com.sdecloud.springai.alibaba.tool.AqiPredictTool;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AQI预测Controller
 */
@RestController
@RequestMapping("/api/aqi")
public class AqiPredictController {
    
    @Autowired
    private ConvLSTMPredictService predictService;
    
    @Autowired
    private ConvLSTMDataPreprocessingService preprocessingService;
    
    /**
     * AQI预测接口（与Python版本接口一致）
     * 
     * @param request 预测请求
     * @return 预测结果
     */
    @PostMapping("/predict")
    public AqiPredictResponse predict(@RequestBody AqiPredictRequest request) {
        try {
            // 1. 数据预处理
            float[][][][][] modelInput = preprocessingService.generateModelInput(
                request.getStaCode(),
                request.getPredictStartTime()
            );
            
            // 2. 模型推理（6个模型集成）
            List<Float> predictions = predictService.predict(modelInput);
            
            // 3. 计算平均值
            double avgPrediction = predictions.stream()
                .mapToDouble(Float::doubleValue)
                .average()
                .orElse(0.0);
            
            // 4. 构建响应
            AqiPredictResponse response = new AqiPredictResponse();
            response.setCode(200);
            response.setMessage("预测成功");
            response.setData(new AqiPredictData(
                predictions,
                (float) avgPrediction
            ));
            
            return response;
            
        } catch (Exception e) {
            AqiPredictResponse response = new AqiPredictResponse();
            response.setCode(500);
            response.setMessage("预测失败: " + e.getMessage());
            response.setData(null);
            return response;
        }
    }
    
    @Data
    public static class AqiPredictRequest {
        private String staCode;
        private String predictStartTime;
    }
    
    @Data
    public static class AqiPredictResponse {
        private Integer code;
        private String message;
        private AqiPredictData data;
    }
    
    @Data
    @AllArgsConstructor
    public static class AqiPredictData {
        private List<Float> predictions;  // 6个模型的预测结果
        private Float ensemblePrediction;  // 集成预测值
    }
}
```

**使用MCP工具调用**:

```java
// 在Agent或Graph工作流中使用
@Autowired
private McpClient mcpClient;

public void useAqiPredict() {
    Map<String, Object> result = mcpClient.callTool(
        "predict_aqi",
        Map.of(
            "sta_code", "5063701020020001",
            "predict_start_time", "2025-12-01 17:00:00"
        )
    );
    
    // 处理预测结果
    AqiPredictTool.AqiPredictResult predictResult = 
        objectMapper.convertValue(result, AqiPredictTool.AqiPredictResult.class);
    
    System.out.println("集成预测值: " + predictResult.getEnsemblePrediction());
}
```

### 5.3 MCP工具封装示例

```java
@McpTool(
    name = "predict_aqi",
    description = "使用ConvLSTM模型预测未来6小时的AQI值"
)
public class AqiPredictTool {
    
    @Autowired
    private ConvLSTMPredictService predictService;
    
    @ToolParam(
        name = "sta_code",
        description = "监测站点代码，例如: 5063701020020001"
    )
    private String staCode;
    
    @ToolParam(
        name = "predict_start_time",
        description = "预测开始时间，格式: YYYY-MM-DD HH:MM:SS"
    )
    private String predictStartTime;
    
    public AqiPredictResult predict() {
        return predictService.predict(staCode, predictStartTime);
    }
}
```

---

## 6. 总结

### 6.1 图表工具方案

✅ **推荐方案**: 混合方案
- 简单图表使用Java原生库（JFreeChart）
- 复杂图表使用Python服务（Plotly）
- 统一通过MCP协议调用

✅ **优势**:
- 通用性强，可被任何MCP客户端调用
- 解耦性好，图表生成与业务逻辑分离
- 可扩展，易于添加新的图表类型

### 6.2 ConvLSTM模型方案

✅ **推荐方案**: **DJL (Deep Java Library)**
- ✅ 直接加载PyTorch模型，无需转换为ONNX
- ✅ AWS官方支持，成熟稳定
- ✅ 纯Java实现，部署简单
- ✅ 易用性好，API简洁
- ✅ 性能良好

✅ **备选方案**: ONNX Runtime（如果对性能要求极高）
- 性能最好
- 跨平台支持
- 官方维护

✅ **备选方案**: DJL（如果ONNX转换有问题）

✅ **优势**:
- 无需调用Python服务
- 模型直接集成到Java项目中
- 推理性能好

### 6.3 实施建议

1. **先实施图表工具MCP**（相对简单，1-2周）
2. **再实施ConvLSTM模型集成**（需要模型转换，2-3周）
3. **逐步优化和测试**

---

**文档版本**: v1.0  
**最后更新**: 2025年  
**维护者**: AI Assistant

