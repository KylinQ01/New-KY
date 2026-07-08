/**
 * 从 MySQL API 拉取文章 → 生成 .md 文件到 src/content/posts/
 * 在本地运行，不在服务器运行
 *
 * 用法: node scripts/sync-posts.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, '../src/content/posts');
const API_URL = process.env.API_URL || 'https://api.kylinqaq.xyz/api/public';

async function syncPosts() {
  console.log('📡 正在从 API 拉取文章...');

  // 拉取所有文章列表
  const res = await fetch(`${API_URL}/posts?limit=1000`);
  const json = await res.json();
  const posts = json.data?.posts || [];

  if (!posts.length) {
    console.log('⚠️ 没有找到文章');
    return;
  }

  console.log(`📄 找到 ${posts.length} 篇文章`);

  // 确保目录存在
  fs.mkdirSync(POSTS_DIR, { recursive: true });

  // 生成 .md 文件
  for (const post of posts) {
    const filename = `${post.slug}.md`;
    const filepath = path.join(POSTS_DIR, filename);

    // 构建 frontmatter
    const tags = Array.isArray(post.tags) ? post.tags : (post.tags ? post.tags.split(',').map((t) => t.trim()) : []);
    const date = post.published_at || post.created_at;

    const frontmatter = `---
title: ${JSON.stringify(post.title)}
published: ${new Date(date).toISOString()}
${post.updated_at ? `updated: ${new Date(post.updated_at).toISOString()}` : ''}
description: ${JSON.stringify(post.description || '')}
image: ${JSON.stringify(post.image || '')}
tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]
category: ${JSON.stringify(post.category || '')}
pinned: ${post.pinned ? 'true' : 'false'}
comment: true
---

${post.content || ''}
`;

    fs.writeFileSync(filepath, frontmatter, 'utf-8');
    console.log(`  ✅ ${filename}`);
  }

  // 删除本地存在但 API 中已删除的文章
  const apiSlugs = new Set(posts.map((p) => p.slug));
  const localFiles = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  for (const file of localFiles) {
    const slug = file.replace(/\.md$/, '');
    if (!apiSlugs.has(slug)) {
      fs.unlinkSync(path.join(POSTS_DIR, file));
      console.log(`  🗑️ 删除 ${file}`);
    }
  }

  console.log('✅ 同步完成');
}

syncPosts().catch((err) => {
  console.error('❌ 同步失败:', err.message);
  process.exit(1);
});
