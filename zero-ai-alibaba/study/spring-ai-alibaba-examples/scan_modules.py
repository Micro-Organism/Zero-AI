#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Spring AI Alibaba Examples 模块扫描脚本
扫描所有模块（包括子模块），识别独立的工程模块
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Set

# 本地 examples 路径
EXAMPLES_PATH = "/Users/rabbit/works/code/github/Repository/spring-ai-alibaba-examples"

def is_module(path: Path) -> bool:
    """判断一个目录是否是独立的工程模块"""
    # 检查是否有 pom.xml 或 build.gradle
    pom_file = path / "pom.xml"
    gradle_file = path / "build.gradle"
    
    # 检查是否有 src 目录
    src_dir = path / "src"
    
    # 检查是否有 application.yml 或 application.properties
    app_yml = path / "src" / "main" / "resources" / "application.yml"
    app_properties = path / "src" / "main" / "resources" / "application.properties"
    
    return (pom_file.exists() or gradle_file.exists()) and (
        src_dir.exists() or app_yml.exists() or app_properties.exists()
    )

def scan_modules(root_path: Path, max_depth: int = 3, current_depth: int = 0) -> Dict[str, List[str]]:
    """
    扫描所有模块
    
    Returns:
        Dict with keys:
            - 'main_modules': 主模块列表
            - 'sub_modules': 子模块列表（格式：父模块/子模块）
            - 'all_modules': 所有模块的完整路径
    """
    main_modules = []
    sub_modules = []
    all_modules = []
    
    if current_depth == 0:
        # 第一层：扫描主模块
        for item in sorted(root_path.iterdir()):
            if item.is_dir() and not item.name.startswith('.'):
                if is_module(item):
                    main_modules.append(item.name)
                    all_modules.append(str(item.relative_to(root_path)))
                elif current_depth < max_depth:
                    # 继续扫描子目录
                    sub_result = scan_modules(item, max_depth, current_depth + 1)
                    for sub_module in sub_result['all_modules']:
                        full_path = f"{item.name}/{sub_module}"
                        sub_modules.append(full_path)
                        all_modules.append(full_path)
    else:
        # 递归扫描子目录
        for item in sorted(root_path.iterdir()):
            if item.is_dir() and not item.name.startswith('.'):
                if is_module(item):
                    all_modules.append(item.name)
                elif current_depth < max_depth:
                    # 继续递归
                    sub_result = scan_modules(item, max_depth, current_depth + 1)
                    for sub_module in sub_result['all_modules']:
                        full_path = f"{item.name}/{sub_module}"
                        all_modules.append(full_path)
    
    return {
        'main_modules': main_modules,
        'sub_modules': sub_modules,
        'all_modules': all_modules
    }

def get_module_info(module_path: Path) -> Dict:
    """获取模块的详细信息"""
    info = {
        'name': module_path.name,
        'path': str(module_path),
        'has_pom': (module_path / "pom.xml").exists(),
        'has_gradle': (module_path / "build.gradle").exists(),
        'has_src': (module_path / "src").exists(),
        'has_readme': (module_path / "README.md").exists() or (module_path / "readme.md").exists(),
        'subdirs': []
    }
    
    # 检查子目录
    if module_path.is_dir():
        for item in module_path.iterdir():
            if item.is_dir() and not item.name.startswith('.') and not item.name in ['target', 'build', 'node_modules', '.git']:
                info['subdirs'].append(item.name)
    
    return info

def main():
    root_path = Path(EXAMPLES_PATH)
    
    if not root_path.exists():
        print(f"错误: 路径不存在: {EXAMPLES_PATH}")
        sys.exit(1)
    
    print("=" * 80)
    print("Spring AI Alibaba Examples 模块扫描")
    print("=" * 80)
    print(f"扫描路径: {EXAMPLES_PATH}\n")
    
    # 扫描所有模块
    result = scan_modules(root_path, max_depth=3)
    
    # 输出主模块
    print("=" * 80)
    print("主模块列表 (第一层目录)")
    print("=" * 80)
    print(f"总计: {len(result['main_modules'])} 个主模块\n")
    for i, module in enumerate(result['main_modules'], 1):
        module_path = root_path / module
        info = get_module_info(module_path)
        print(f"{i:2d}. {module}")
        if info['subdirs']:
            print(f"    子目录: {', '.join(info['subdirs'][:10])}")
            if len(info['subdirs']) > 10:
                print(f"    ... 还有 {len(info['subdirs']) - 10} 个子目录")
        print()
    
    # 输出子模块
    if result['sub_modules']:
        print("=" * 80)
        print("子模块列表 (子目录中的独立模块)")
        print("=" * 80)
        print(f"总计: {len(result['sub_modules'])} 个子模块\n")
        for i, module in enumerate(result['sub_modules'], 1):
            print(f"{i:2d}. {module}")
        print()
    
    # 输出所有模块的完整路径
    print("=" * 80)
    print("所有模块完整路径")
    print("=" * 80)
    print(f"总计: {len(result['all_modules'])} 个模块\n")
    for i, module in enumerate(result['all_modules'], 1):
        print(f"{i:3d}. {module}")
    
    # 检查是否有其他目录
    print("\n" + "=" * 80)
    print("其他目录 (非模块目录)")
    print("=" * 80)
    other_dirs = []
    for item in sorted(root_path.iterdir()):
        if item.is_dir() and not item.name.startswith('.'):
            if item.name not in result['main_modules'] and not any(item.name in sub for sub in result['sub_modules']):
                other_dirs.append(item.name)
    
    if other_dirs:
        for dir_name in other_dirs:
            print(f"  - {dir_name}")
    else:
        print("  无")
    
    # 生成 Markdown 格式的输出
    print("\n" + "=" * 80)
    print("Markdown 格式输出")
    print("=" * 80)
    print("\n```markdown")
    print("## 主模块列表")
    print()
    for i, module in enumerate(result['main_modules'], 1):
        print(f"{i}. `{module}`")
    print()
    if result['sub_modules']:
        print("## 子模块列表")
        print()
        for i, module in enumerate(result['sub_modules'], 1):
            print(f"{i}. `{module}`")
    print("```")
    
    return result

if __name__ == "__main__":
    main()

