export type Accent = 'lime' | 'blue' | 'orange' | 'pink';

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: string;
  tags: string[];
  accent: Accent;
  featured?: boolean;
  content?: string;
  coverImage?: string | null;
  categorySlug?: string;
  seriesTitle?: string;
  sort?: number | null;
}

export interface Series {
  slug: string;
  title: string;
  description: string;
  issueCount: number;
  status: string;
  accent: Accent;
}

export interface Project {
  slug: string;
  title: string;
  label: string;
  description: string;
  accent: Accent;
  mark: string;
  url?: string | null;
  coverImage?: string | null;
}

export const posts: Post[] = [
  {
    slug: 'building-a-small-but-serious-server',
    title: '一台 2C2G 小服务器，如何搭出一套认真可用的内容系统',
    excerpt: '从 Directus、PostgreSQL 到 Astro 与 Cloudflare，把后台能力和前台访问彻底拆开。',
    category: '建站日志',
    date: '2026-08-27',
    readingTime: '8 min',
    tags: ['Server', 'Astro', 'Directus'],
    accent: 'lime',
    featured: true,
  },
  {
    slug: 'why-static-first',
    title: '为什么我选择静态优先，而不是把所有请求都压给 VPS',
    excerpt: '一次构建，多地分发。聊聊个人站在速度、成本与维护之间的取舍。',
    category: '技术笔记',
    date: '2026-08-22',
    readingTime: '6 min',
    tags: ['CDN', 'Performance'],
    accent: 'blue',
  },
  {
    slug: 'r2-image-pipeline',
    title: '把图片交给 R2：从上传到文章展示的完整链路',
    excerpt: '让 CMS 负责编辑，让对象存储负责图片，让静态页面保持轻盈。',
    category: '实践手册',
    date: '2026-08-18',
    readingTime: '5 min',
    tags: ['Cloudflare', 'R2'],
    accent: 'orange',
  },
  {
    slug: 'personal-knowledge-hub',
    title: '博客之外：把个人网站变成一座持续生长的知识中枢',
    excerpt: '文章、专题、实验与作品互相连接，比一条时间线更接近真实的思考过程。',
    category: '站点思考',
    date: '2026-08-12',
    readingTime: '7 min',
    tags: ['Design', 'Knowledge'],
    accent: 'pink',
  },
  {
    slug: 'openresty-notes',
    title: 'OpenResty 反向代理与 HTTPS 配置备忘',
    excerpt: '给下一次部署留一份可以快速查阅的清单。',
    category: '速查笔记',
    date: '2026-08-08',
    readingTime: '4 min',
    tags: ['OpenResty', 'HTTPS'],
    accent: 'lime',
  },
  {
    slug: 'ai-as-a-workbench',
    title: '把 AI 当作工作台，而不是答案生成器',
    excerpt: '记录一种更适合长期项目的协作方式。',
    category: 'AIGC',
    date: '2026-08-01',
    readingTime: '9 min',
    tags: ['AI', 'Workflow'],
    accent: 'blue',
  },
];

export const series: Series[] = [
  {
    slug: 'server-from-zero',
    title: '从零搭建个人服务器',
    description: '购买、加固、容器、域名、HTTPS 与自动化部署的完整记录。',
    issueCount: 7,
    status: '持续更新',
    accent: 'lime',
  },
  {
    slug: 'ai-field-notes',
    title: 'AI 使用现场笔记',
    description: '不追逐口号，只记录真正改变工作方式的工具与方法。',
    issueCount: 12,
    status: '每周更新',
    accent: 'blue',
  },
  {
    slug: 'small-web',
    title: '小而美的 Web 实验',
    description: '围绕交互、排版与性能制作的小型可运行作品。',
    issueCount: 5,
    status: '实验中',
    accent: 'orange',
  },
];

export const projects: Project[] = [
  {
    slug: 'content-map',
    title: '内容关系地图',
    label: 'INTERACTIVE',
    description: '用节点和连线探索文章之间隐藏的关联。',
    accent: 'blue',
    mark: '◎',
  },
  {
    slug: 'server-checklist',
    title: '服务器上线清单',
    label: 'TOOLKIT',
    description: '一份不会漏掉 HTTPS、备份与安全设置的检查表。',
    accent: 'lime',
    mark: '✓',
  },
  {
    slug: 'prompt-cards',
    title: '提示词卡片盒',
    label: 'COLLECTION',
    description: '把可复用的提示结构整理成能够组合的卡片。',
    accent: 'pink',
    mark: '✦',
  },
  {
    slug: 'web-performance-lab',
    title: '网页性能实验室',
    label: 'LAB',
    description: '把优化前后的真实指标放在一起比较。',
    accent: 'orange',
    mark: '↗',
  },
];

export const categories = [
  { name: '建站与服务器', count: 18, code: 'SYS' },
  { name: 'AIGC 与工作流', count: 24, code: 'AIGC' },
  { name: '设计与前端', count: 16, code: 'WEB' },
  { name: '随笔与观察', count: 11, code: 'LOG' },
  { name: '工具与资源', count: 9, code: 'KIT' },
];

export const searchItems = [
  ...posts.map((post) => ({
    title: post.title,
    description: post.excerpt,
    type: post.category,
    href: `/notes/${post.slug}/`,
    keywords: post.tags.join(' '),
  })),
  ...series.map((item) => ({
    title: item.title,
    description: item.description,
    type: '专题',
    href: `/series/#${item.slug}`,
    keywords: item.status,
  })),
  ...projects.map((item) => ({
    title: item.title,
    description: item.description,
    type: '实验室',
    href: `/lab/#${item.slug}`,
    keywords: item.label,
  })),
];

export function formatDate(date: string) {
  const value = /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00+08:00` : date;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(value));
}
