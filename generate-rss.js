#!/usr/bin/env node
/**
 * RSS Feed 生成脚本
 * 读取 articles.js 中的文章数据，生成 feed.xml
 * 用法: node generate-rss.js
 */

const fs = require('fs');
const path = require('path');

// 网站配置 - 域名绑定后修改这里
const SITE_URL = 'https://dewai.info';
const FEED_TITLE = '夏之朝露';
const FEED_DESCRIPTION = '记录对 AI、产品与生活的思考。在技术浪潮与人文温度之间，寻找属于自己的表达方式。';
const AUTHOR = '夏之朝露';
const LANGUAGE = 'zh-CN';

// 读取 articles.js
const articlesFile = fs.readFileSync(path.join(__dirname, 'articles.js'), 'utf-8');

// 提取 articles 数组（用 Function 执行）
const extractArticles = new Function(articlesFile + '\nreturn articles;');
const articles = extractArticles();

// XML 转义
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 将文章内容转为 HTML
function contentToHtml(content) {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${escapeXml(line)}</p>`)
    .join('\n');
}

// 生成 RFC 822 日期格式
function toRFC822(dateStr) {
  const date = new Date(dateStr + 'T08:00:00+08:00');
  return date.toUTCString();
}

// 生成 RSS XML
const now = new Date().toUTCString();

const items = articles.map(article => `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(article.url)}</link>
      <guid isPermaLink="true">${escapeXml(article.url)}</guid>
      <pubDate>${toRFC822(article.date)}</pubDate>
      <description><![CDATA[${article.excerpt}]]></description>
      <content:encoded><![CDATA[${contentToHtml(article.content)}]]></content:encoded>
      ${article.tags.map(t => `<category>${escapeXml(t)}</category>`).join('\n      ')}
      <author>${escapeXml(AUTHOR)}</author>
    </item>`).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>${LANGUAGE}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/favicon.png</url>
      <title>${escapeXml(FEED_TITLE)}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>
`;

const outputPath = path.join(__dirname, 'feed.xml');
fs.writeFileSync(outputPath, rss, 'utf-8');
console.log(`✅ RSS feed 已生成: ${outputPath}`);
console.log(`   共 ${articles.length} 篇文章`);
