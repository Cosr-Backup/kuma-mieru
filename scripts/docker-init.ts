#!/usr/bin/env bun

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// 将 JSON 转换为 JS 对象字面量格式（用于 Next.js 16）
function jsonToJsObject(jsonStr: string): string {
  const obj = JSON.parse(jsonStr);

  function stringify(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'void 0';
    if (typeof value === 'boolean') return value ? '!0' : '!1';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') return JSON.stringify(value);
    if (Array.isArray(value)) {
      return '[' + value.map(stringify).join(',') + ']';
    }
    if (typeof value === 'object') {
      const pairs = Object.entries(value).map(
        ([k, v]) =>
          `${/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k)}:${stringify(v)}`
      );
      return '{' + pairs.join(',') + '}';
    }
    return String(value);
  }

  return stringify(obj);
}

// Docker 构建后的配置（JSON 格式）
// 同时兼容旧结构（pages[].baseUrl 不存在）和新结构（pages[].baseUrl 存在）
const magicStringJsonCandidates = [
  '{"baseUrl":"https://whimsical-sopapillas-78abba.netlify.app","pageId":"demo","pageIds":["demo"],"pages":[{"id":"demo","siteMeta":{"title":"Uptime Kuma","description":"A beautiful and modern uptime monitoring dashboard","icon":"https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg","iconCandidates":["https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg","/icon.svg"]}}],"siteMeta":{"title":"Uptime Kuma","description":"A beautiful and modern uptime monitoring dashboard","icon":"https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg","iconCandidates":["https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg","/icon.svg"]},"isPlaceholder":false,"isEditThisPage":false,"isShowStarButton":true}',
  '{"baseUrl":"https://whimsical-sopapillas-78abba.netlify.app","pageId":"demo","pageIds":["demo"],"pages":[{"id":"demo","baseUrl":"https://whimsical-sopapillas-78abba.netlify.app","siteMeta":{"title":"Uptime Kuma","description":"A beautiful and modern uptime monitoring dashboard","icon":"https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg","iconCandidates":["https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg","/icon.svg"]}}],"siteMeta":{"title":"Uptime Kuma","description":"A beautiful and modern uptime monitoring dashboard","icon":"https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg","iconCandidates":["https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg","/icon.svg"]},"isPlaceholder":false,"isEditThisPage":false,"isShowStarButton":true}',
];

const magicStringPatterns = magicStringJsonCandidates.flatMap(json => [json, jsonToJsObject(json)]);

function safeReplace(
  content: string,
  oldConfigPatterns: string[],
  newConfigJson: string,
  newConfigJsObject: string
): { content: string; replaced: boolean } {
  for (const pattern of oldConfigPatterns) {
    if (!content.includes(pattern)) continue;

    const isJson = pattern.trim().startsWith('{') && pattern.includes('"baseUrl"');
    const replacement = isJson ? newConfigJson : newConfigJsObject;

    return {
      content: content.replaceAll(pattern, replacement),
      replaced: true,
    };
  }

  return { content, replaced: false };
}

function searchFiles(dir: string, searchPatterns: string[]): string[] {
  const results: string[] = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...searchFiles(fullPath, searchPatterns));
    } else {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        // 检查是否包含任何搜索模式
        if (searchPatterns.some(pattern => content.includes(pattern))) {
          results.push(fullPath);
        }
      } catch (err) {
        console.error(`[ERROR]: Cannot read file ${fullPath}:`, err);
      }
    }
  }

  return results;
}

async function main() {
  try {
    const configPath = join(process.cwd(), 'config/generated-config.json');
    const newConfigJson = JSON.stringify(JSON.parse(readFileSync(configPath, 'utf-8').trim()));
    const newConfigJsObject = jsonToJsObject(newConfigJson);

    const nextDir = join(process.cwd(), '.next');

    // 搜索包含任一格式配置的文件
    const files = searchFiles(nextDir, magicStringPatterns);

    if (files.length === 0) {
      console.log("[WARN]: Don't find any files to update");
      return;
    }

    console.log(`[INFO]: Found ${files.length} files to update`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        const { content: newContent, replaced } = safeReplace(
          content,
          magicStringPatterns,
          newConfigJson,
          newConfigJsObject
        );

        if (!replaced) {
          console.warn(`[WARN]: Could not find config pattern in ${file}`);
          failedCount++;
          continue;
        }

        // 验证替换是否成功
        const hasNewConfig =
          newContent.includes(newConfigJsObject) || newContent.includes(newConfigJson);

        if (!hasNewConfig) {
          console.warn(`[WARN]: Could not verify replacement in ${file}`);
          failedCount++;
          continue;
        }

        writeFileSync(file, newContent);
        console.log(`[INFO]: Updated file ${file}`);
        updatedCount++;
      } catch (err) {
        console.error(`[ERROR]: Error updating file ${file}:`, err);
        failedCount++;
      }
    }

    console.log(`[INFO]: Update complete: ${updatedCount} succeeded, ${failedCount} failed`);
  } catch (err) {
    console.error('[ERROR]: Error reading or writing files:', err);
    process.exit(1);
  }
}

main().catch(console.error);
