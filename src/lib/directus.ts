import type { Accent, Post, Project, Series } from '../data/content';

const DEFAULT_DIRECTUS_URL = 'https://admin.0712121.xyz';
const configuredDirectusUrl = (import.meta.env.DIRECTUS_URL || DEFAULT_DIRECTUS_URL).replace(/\/$/, '');
const DIRECTUS_URL = configuredDirectusUrl === 'https://api.0712121.xyz'
  ? DEFAULT_DIRECTUS_URL
  : configuredDirectusUrl;

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  code: string;
  color: Accent;
  count: number;
  sort: number;
}

export interface SiteSettings {
  siteName: string;
  siteLabel: string;
  heroKicker: string;
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  aboutText: string;
  footerText: string;
  contentTotal: number;
}

export interface SearchItem {
  title: string;
  description: string;
  type: string;
  href: string;
  keywords: string;
}

export interface SiteContent {
  posts: Post[];
  categories: Category[];
  series: Series[];
  projects: Project[];
  settings: SiteSettings;
  searchItems: SearchItem[];
}

interface DirectusResponse<T> { data: T }

interface DirectusPost {
  id: number;
  sort: number | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  category: { id: number; name: string; slug: string } | null;
  series: { id: number; title: string; slug: string } | null;
  tags: string[] | null;
  reading_time: number;
  accent: Accent | null;
  featured: boolean;
  published_at: string;
}

interface DirectusCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  code: string | null;
  color: Accent | null;
  display_count: number;
  sort: number | null;
}

interface DirectusSeries {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover_image: string | null;
  accent: Accent | null;
  issue_count: number;
  update_label: string | null;
  sort: number | null;
}

interface DirectusProject {
  id: number;
  title: string;
  slug: string;
  label: string | null;
  description: string;
  url: string | null;
  cover_image: string | null;
  accent: Accent | null;
  mark: string | null;
  sort: number | null;
}

interface DirectusSettings {
  site_name: string;
  site_label: string | null;
  hero_kicker: string | null;
  hero_title: string;
  hero_highlight: string;
  hero_description: string;
  about_text: string | null;
  footer_text: string | null;
  content_total: number;
}

function localDate(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai',
  }).formatToParts(new Date(value));
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

async function readItems<T>(path: string): Promise<T> {
  const response = await fetch(`${DIRECTUS_URL}${path}`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Directus request failed (${response.status}) ${path}: ${detail.slice(0, 300)}`);
  }
  return (await response.json() as DirectusResponse<T>).data;
}

async function loadSiteContent(): Promise<SiteContent> {
  const [postRows, categoryRows, seriesRows, projectRows, settingsRow] = await Promise.all([
    readItems<DirectusPost[]>('/items/posts?fields=id,sort,title,slug,excerpt,content,cover_image,category.id,category.name,category.slug,series.id,series.title,series.slug,tags,reading_time,accent,featured,published_at&sort=sort'),
    readItems<DirectusCategory[]>('/items/categories?fields=id,name,slug,description,code,color,display_count,sort&sort=sort'),
    readItems<DirectusSeries[]>('/items/series?fields=id,title,slug,description,cover_image,accent,issue_count,update_label,sort&sort=sort'),
    readItems<DirectusProject[]>('/items/projects?fields=id,title,slug,label,description,url,cover_image,accent,mark,sort&sort=sort'),
    readItems<DirectusSettings>('/items/site_settings?fields=site_name,site_label,hero_kicker,hero_title,hero_highlight,hero_description,about_text,footer_text,content_total'),
  ]);

  const posts: Post[] = postRows.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category?.name ?? '未分类',
    categorySlug: row.category?.slug,
    seriesTitle: row.series?.title,
    date: localDate(row.published_at),
    readingTime: `${row.reading_time} min`,
    tags: row.tags ?? [],
    accent: row.accent ?? 'lime',
    featured: row.featured,
    content: row.content,
    coverImage: row.cover_image,
    sort: row.sort,
  }));

  const categories: Category[] = categoryRows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    code: row.code ?? 'INDEX',
    color: row.color ?? 'lime',
    count: row.display_count,
    sort: row.sort ?? 0,
  }));

  const series: Series[] = seriesRows.map((row) => ({
    slug: row.slug,
    title: row.title,
    description: row.description,
    issueCount: row.issue_count,
    status: row.update_label ?? '持续更新',
    accent: row.accent ?? 'lime',
  }));

  const projects: Project[] = projectRows.map((row) => ({
    slug: row.slug,
    title: row.title,
    label: row.label ?? '项目',
    description: row.description,
    accent: row.accent ?? 'lime',
    mark: row.mark ?? '↗',
    url: row.url,
    coverImage: row.cover_image,
  }));

  const settings: SiteSettings = {
    siteName: settingsRow.site_name,
    siteLabel: settingsRow.site_label ?? '个人内容中枢',
    heroKicker: settingsRow.hero_kicker ?? '个人知识与创作索引',
    heroTitle: settingsRow.hero_title,
    heroHighlight: settingsRow.hero_highlight,
    heroDescription: settingsRow.hero_description,
    aboutText: settingsRow.about_text ?? '',
    footerText: settingsRow.footer_text ?? '',
    contentTotal: settingsRow.content_total,
  };

  const searchItems: SearchItem[] = [
    ...posts.map((post) => ({
      title: post.title, description: post.excerpt, type: post.category,
      href: `/notes/${post.slug}/`, keywords: post.tags.join(' '),
    })),
    ...series.map((item) => ({
      title: item.title, description: item.description, type: '专题',
      href: `/series/#${item.slug}`, keywords: item.status,
    })),
    ...projects.map((item) => ({
      title: item.title, description: item.description, type: '实验室',
      href: `/lab/#${item.slug}`, keywords: item.label,
    })),
  ];

  return { posts, categories, series, projects, settings, searchItems };
}

let contentPromise: Promise<SiteContent> | undefined;

export function getSiteContent() {
  contentPromise ??= loadSiteContent();
  return contentPromise;
}
