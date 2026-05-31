import type { ExtractedTags, TodoItem } from './types';

export const PROJECT_TAG_PATTERN = /^\+([^\s+]+)$/;
export const CONTEXT_TAG_PATTERN = /^@([^\s@]+)$/;
export const METADATA_TAG_PATTERN = /^([A-Za-z][\w-]*):(\S+)$/;

export const extractTags = (raw: string): ExtractedTags => {
  const tokens = raw.trim().split(/\s+/);
  const projects: string[] = [];
  const contexts: string[] = [];
  const metadata: TodoItem['metadata'] = [];
  const words: string[] = [];

  for (const token of tokens) {
    const projectMatch = token.match(PROJECT_TAG_PATTERN);
    if (projectMatch) {
      const [, project] = projectMatch;
      if (project != null) {
        projects.push(project);
      }

      continue;
    }

    const contextMatch = token.match(CONTEXT_TAG_PATTERN);
    if (contextMatch) {
      const [, context] = contextMatch;
      if (context != null) {
        contexts.push(context);
      }

      continue;
    }

    const metadataMatch = token.match(METADATA_TAG_PATTERN);
    if (metadataMatch) {
      const [, key, value] = metadataMatch;
      if (key != null && value != null) {
        metadata.push({ key, value });
        continue;
      }
    }

    words.push(token);
  }

  return { description: words.join(' '), projects, contexts, metadata };
};
