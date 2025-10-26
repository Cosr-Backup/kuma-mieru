#!/usr/bin/env bun

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const magicString =
  '{"baseUrl":"https://whimsical-sopapillas-78abba.netlify.app","pageId":"demo","pageIds":["demo"],"pages":[{"id":"demo","siteMeta":{"title":"Uptime Kuma","description":"A beautiful and modern uptime monitoring dashboard","icon":"https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg"}}],"siteMeta":{"title":"Uptime Kuma","description":"A beautiful and modern uptime monitoring dashboard","icon":"https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg"},"isPlaceholder":false,"isEditThisPage":false,"isShowStarButton":true}';

function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function safeReplace(content: string, oldConfig: string, newConfig: string): string {
  if (!isValidJson(newConfig)) {
    throw new Error('New config is not valid JSON');
  }

  const parts = content.split(oldConfig);
  if (parts.length < 2) {
    return content;
  }

  const result = parts.join(newConfig);
  if (result.includes('undefined') || result.includes('null,null')) {
    throw new Error('Replacement would cause invalid JS syntax');
  }

  return result;
}

function searchFiles(dir: string): string[] {
  const results: string[] = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...searchFiles(fullPath));
    } else {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        if (content.includes(magicString)) {
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
    let newConfig = readFileSync(configPath, 'utf-8').trim();

    newConfig = JSON.stringify(JSON.parse(newConfig));

    const nextDir = join(process.cwd(), '.next');
    const files = searchFiles(nextDir);

    if (files.length === 0) {
      console.log("[WARN]: Don't find any files to update");
      return;
    }

    for (const file of files) {
      try {
        let content = readFileSync(file, 'utf-8');

        content = safeReplace(content, magicString, newConfig);

        if (!content.includes(newConfig)) {
          console.warn(`[WARN]: Could not verify replacement in ${file}`);
          continue;
        }

        writeFileSync(file, content);
        console.log(`[INFO]: Updated file ${file}`);
      } catch (err) {
        console.error(`[ERROR]: Error updating file ${file}:`, err);
      }
    }

    console.log('[INFO]: All files updated successfully');
  } catch (err) {
    console.error('[ERROR]: Error reading or writing files:', err);
    process.exit(1);
  }
}

main().catch(console.error);
