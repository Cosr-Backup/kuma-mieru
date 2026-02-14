#!/usr/bin/env bun

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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

interface TaggedPattern {
  text: string;
  kind: 'json' | 'js';
}

/**
 * Build placeholder config patterns from known Docker build-time env vars.
 *
 * The Dockerfile builds with fixed placeholder values (demo base URL, demo page ID, etc.).
 * We construct the exact placeholder JSON that generate-config.ts would produce,
 * then derive both JSON and JS object literal forms for matching.
 *
 * This is computed dynamically so schema changes (new fields, reordering) are handled
 * automatically — no need to maintain hardcoded magic strings.
 */
function buildPlaceholderPatterns(): TaggedPattern[] {
  const PLACEHOLDER_BASE_URL = 'https://whimsical-sopapillas-78abba.netlify.app';
  const PLACEHOLDER_PAGE_ID = 'demo';
  const PLACEHOLDER_TITLE = 'Uptime Kuma';
  const PLACEHOLDER_DESCRIPTION = 'A beautiful and modern uptime monitoring dashboard';

  const baseSiteMeta = {
    title: PLACEHOLDER_TITLE,
    description: PLACEHOLDER_DESCRIPTION,
    icon: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg',
    iconCandidates: [
      'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f914.svg',
      '/icon.svg',
    ],
  };

  const configVariants = [
    // Old schema (no pages[].baseUrl)
    {
      baseUrl: PLACEHOLDER_BASE_URL,
      pageId: PLACEHOLDER_PAGE_ID,
      pageIds: [PLACEHOLDER_PAGE_ID],
      pages: [{ id: PLACEHOLDER_PAGE_ID, siteMeta: baseSiteMeta }],
      siteMeta: baseSiteMeta,
      isPlaceholder: false,
      isEditThisPage: false,
      isShowStarButton: true,
    },
    // New schema (with pages[].baseUrl)
    {
      baseUrl: PLACEHOLDER_BASE_URL,
      pageId: PLACEHOLDER_PAGE_ID,
      pageIds: [PLACEHOLDER_PAGE_ID],
      pages: [{ id: PLACEHOLDER_PAGE_ID, baseUrl: PLACEHOLDER_BASE_URL, siteMeta: baseSiteMeta }],
      siteMeta: baseSiteMeta,
      isPlaceholder: false,
      isEditThisPage: false,
      isShowStarButton: true,
    },
  ];

  const patterns: TaggedPattern[] = [];
  for (const config of configVariants) {
    const json = JSON.stringify(config);
    patterns.push({ text: json, kind: 'json' });
    patterns.push({ text: jsonToJsObject(json), kind: 'js' });
  }

  return patterns;
}

function safeReplace(
  content: string,
  oldPatterns: TaggedPattern[],
  newConfigJson: string,
  newConfigJsObject: string
): { content: string; replaced: boolean } {
  let result = content;
  let replacedAny = false;

  for (const pattern of oldPatterns) {
    if (!result.includes(pattern.text)) continue;

    const replacement = pattern.kind === 'json' ? newConfigJson : newConfigJsObject;
    result = result.replaceAll(pattern.text, replacement);
    replacedAny = true;
  }

  return { content: result, replaced: replacedAny };
}

function searchFiles(dir: string, patterns: TaggedPattern[]): string[] {
  const results: string[] = [];
  const patternTexts = patterns.map(p => p.text);

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...searchFiles(fullPath, patterns));
      continue;
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');
      if (patternTexts.some(text => content.includes(text))) {
        results.push(fullPath);
      }
    } catch (err) {
      console.error(`[ERROR]: Cannot read file ${fullPath}:`, err);
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
    const placeholderPatterns = buildPlaceholderPatterns();

    console.log(`[INFO]: Searching for ${placeholderPatterns.length} placeholder patterns`);

    const files = searchFiles(nextDir, placeholderPatterns);

    if (files.length === 0) {
      console.error('[ERROR]: No files containing placeholder config found in .next output');
      console.error('[ERROR]: Docker runtime config replacement failed — aborting startup');
      process.exit(1);
    }

    console.log(`[INFO]: Found ${files.length} files to update`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        const { content: newContent, replaced } = safeReplace(
          content,
          placeholderPatterns,
          newConfigJson,
          newConfigJsObject
        );

        if (!replaced) {
          console.warn(`[WARN]: Could not find config pattern in ${file}`);
          failedCount++;
          continue;
        }

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

    if (updatedCount === 0) {
      console.error('[ERROR]: All file replacements failed — aborting startup');
      process.exit(1);
    }
  } catch (err) {
    console.error('[ERROR]: Error reading or writing files:', err);
    process.exit(1);
  }
}

main().catch(console.error);
