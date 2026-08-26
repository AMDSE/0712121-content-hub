const baseUrl = 'http://127.0.0.1:8055';

async function request(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${method} ${path} failed (${response.status}): ${detail.slice(0, 500)}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

const login = await request('/auth/login', {
  method: 'POST',
  body: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
});
const token = login.data.access_token;

const choiceOptions = (choices) => ({
  choices: choices.map(([text, value, color]) => ({ text, value, color })),
});

const statusField = (defaultValue = 'draft') => ({
  field: 'status',
  type: 'string',
  meta: {
    interface: 'select-dropdown',
    display: 'labels',
    options: choiceOptions([
      ['草稿', 'draft', 'var(--theme--foreground-subdued)'],
      ['已发布', 'published', 'var(--theme--success)'],
      ['已归档', 'archived', 'var(--theme--warning)'],
    ]),
    width: 'half',
    required: true,
  },
  schema: { default_value: defaultValue, is_nullable: false, max_length: 32 },
});

const sortField = {
  field: 'sort',
  type: 'integer',
  meta: { interface: 'input', hidden: true },
  schema: { is_nullable: true },
};

const createdField = {
  field: 'date_created',
  type: 'timestamp',
  meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true, width: 'half' },
  schema: { is_nullable: true },
};

const updatedField = {
  field: 'date_updated',
  type: 'timestamp',
  meta: { special: ['date-updated'], interface: 'datetime', readonly: true, hidden: true, width: 'half' },
  schema: { is_nullable: true },
};

const stringField = (field, { required = false, unique = false, width = 'full', max = 255, note, interfaceName = 'input' } = {}) => ({
  field,
  type: 'string',
  meta: { interface: interfaceName, width, required, ...(note ? { note } : {}) },
  schema: { is_nullable: !required, is_unique: unique, max_length: max },
});

const textField = (field, { required = false, width = 'full', note, interfaceName = 'input-multiline' } = {}) => ({
  field,
  type: 'text',
  meta: { interface: interfaceName, width, required, ...(note ? { note } : {}) },
  schema: { is_nullable: !required },
});

const collectionDefinitions = [
  {
    collection: 'categories',
    meta: {
      icon: 'category', note: '文章分类与首页知识索引', display_template: '{{name}}',
      archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft', archive_app_filter: true,
      sort_field: 'sort', sort: 1,
      translations: [{ language: 'zh-CN', translation: '分类' }],
    },
    fields: [
      statusField('published'), sortField,
      stringField('name', { required: true, width: 'half', max: 100 }),
      stringField('slug', { required: true, unique: true, width: 'half', max: 120, note: '用于网址，只使用小写字母、数字和短横线' }),
      textField('description'),
      stringField('code', { width: 'half', max: 20 }),
      stringField('color', { width: 'half', max: 30, note: 'lime / blue / orange / pink' }),
      { field: 'display_count', type: 'integer', meta: { interface: 'input', width: 'half', note: '首页展示数量，可按需要手动调整' }, schema: { default_value: 0, is_nullable: false } },
      createdField, updatedField,
    ],
  },
  {
    collection: 'series',
    meta: {
      icon: 'collections_bookmark', note: '持续更新的系列专题', display_template: '{{title}}',
      archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft', archive_app_filter: true,
      sort_field: 'sort', sort: 2,
      translations: [{ language: 'zh-CN', translation: '专题' }],
    },
    fields: [
      statusField(), sortField,
      stringField('title', { required: true }),
      stringField('slug', { required: true, unique: true, width: 'half', max: 120 }),
      stringField('update_label', { width: 'half', max: 60, note: '例如：持续更新、每周更新' }),
      textField('description', { required: true }),
      stringField('accent', { width: 'half', max: 30, note: 'lime / blue / orange / pink' }),
      { field: 'issue_count', type: 'integer', meta: { interface: 'input', width: 'half' }, schema: { default_value: 0, is_nullable: false } },
      createdField, updatedField,
    ],
  },
  {
    collection: 'projects',
    meta: {
      icon: 'science', note: '实验室中的工具、作品与交互项目', display_template: '{{title}}',
      archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft', archive_app_filter: true,
      sort_field: 'sort', sort: 3,
      translations: [{ language: 'zh-CN', translation: '实验与项目' }],
    },
    fields: [
      statusField(), sortField,
      stringField('title', { required: true }),
      stringField('slug', { required: true, unique: true, width: 'half', max: 120 }),
      stringField('label', { width: 'half', max: 60 }),
      textField('description', { required: true }),
      stringField('url', { width: 'full', max: 500, interfaceName: 'input' }),
      stringField('accent', { width: 'half', max: 30, note: 'lime / blue / orange / pink' }),
      stringField('mark', { width: 'half', max: 20, note: '项目卡片使用的符号' }),
      createdField, updatedField,
    ],
  },
  {
    collection: 'posts',
    meta: {
      icon: 'article', note: '网站文章与笔记', display_template: '{{title}}',
      archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft', archive_app_filter: true,
      sort_field: 'sort', sort: 4,
      translations: [{ language: 'zh-CN', translation: '文章' }],
    },
    fields: [
      statusField(), sortField,
      { field: 'featured', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: false, is_nullable: false } },
      stringField('title', { required: true }),
      stringField('slug', { required: true, unique: true, width: 'half', max: 160, note: '文章永久网址，发布后尽量不要修改' }),
      { field: 'published_at', type: 'timestamp', meta: { interface: 'datetime', width: 'half' }, schema: { is_nullable: true } },
      textField('excerpt', { required: true, note: '用于首页卡片、搜索和 SEO，建议 60–120 字' }),
      textField('content', { required: true, interfaceName: 'input-rich-text-html' }),
      { field: 'tags', type: 'json', meta: { interface: 'tags', width: 'full' }, schema: { is_nullable: true } },
      { field: 'reading_time', type: 'integer', meta: { interface: 'input', width: 'half', note: '预计阅读分钟数' }, schema: { default_value: 5, is_nullable: false } },
      stringField('accent', { width: 'half', max: 30, note: 'lime / blue / orange / pink' }),
      createdField, updatedField,
    ],
  },
  {
    collection: 'site_settings',
    meta: {
      icon: 'tune', note: '全站名称、首页主标题与说明文字', singleton: true, sort: 5,
      translations: [{ language: 'zh-CN', translation: '站点设置' }],
    },
    fields: [
      stringField('site_name', { required: true, width: 'half', max: 100 }),
      stringField('site_label', { width: 'half', max: 100 }),
      stringField('hero_kicker', { width: 'half', max: 120 }),
      stringField('hero_title', { required: true, max: 255 }),
      stringField('hero_highlight', { required: true, width: 'half', max: 100 }),
      textField('hero_description', { required: true }),
      textField('about_text'),
      textField('footer_text'),
      { field: 'content_total', type: 'integer', meta: { interface: 'input', width: 'half' }, schema: { default_value: 0, is_nullable: false } },
      updatedField,
    ],
  },
];

const existingCollections = new Set((await request('/collections', { token })).data.map((item) => item.collection));

for (const definition of collectionDefinitions) {
  if (existingCollections.has(definition.collection)) {
    console.log(`collection exists: ${definition.collection}`);
    continue;
  }

  await request('/collections', {
    method: 'POST', token,
    body: {
      collection: definition.collection,
      meta: definition.meta,
      schema: { name: definition.collection },
      fields: definition.fields,
    },
  });
  console.log(`collection created: ${definition.collection}`);
}

async function ensureRelationalField(collection, definition) {
  const current = await request(`/fields/${collection}`, { token });
  if (!current.data.some((item) => item.field === definition.field)) {
    await request(`/fields/${collection}`, { method: 'POST', token, body: definition });
    console.log(`field created: ${collection}.${definition.field}`);
  }
}

await ensureRelationalField('posts', {
  field: 'category', type: 'integer',
  meta: { special: ['m2o'], interface: 'select-dropdown-m2o', display: 'related-values', display_options: { template: '{{name}}' }, width: 'half' },
  schema: { is_nullable: true, foreign_key_table: 'categories', foreign_key_column: 'id', on_delete: 'SET NULL' },
});

await ensureRelationalField('posts', {
  field: 'series', type: 'integer',
  meta: { special: ['m2o'], interface: 'select-dropdown-m2o', display: 'related-values', display_options: { template: '{{title}}' }, width: 'half' },
  schema: { is_nullable: true, foreign_key_table: 'series', foreign_key_column: 'id', on_delete: 'SET NULL' },
});

for (const collection of ['posts', 'series', 'projects']) {
  await ensureRelationalField(collection, {
    field: 'cover_image', type: 'uuid',
    meta: { special: ['file'], interface: 'file-image', display: 'image', width: 'full' },
    schema: { is_nullable: true, foreign_key_table: 'directus_files', foreign_key_column: 'id', on_delete: 'SET NULL' },
  });
}

async function ensureRelation(collection, field, relatedCollection) {
  const current = await request('/relations', { token });
  if (current.data.some((item) => item.collection === collection && item.field === field)) return;

  await request('/relations', {
    method: 'POST', token,
    body: {
      collection,
      field,
      related_collection: relatedCollection,
      meta: {
        many_collection: collection,
        many_field: field,
        one_collection: relatedCollection,
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: { on_delete: 'SET NULL' },
    },
  });
  console.log(`relation created: ${collection}.${field} -> ${relatedCollection}`);
}

await ensureRelation('posts', 'category', 'categories');
await ensureRelation('posts', 'series', 'series');
await ensureRelation('posts', 'cover_image', 'directus_files');
await ensureRelation('series', 'cover_image', 'directus_files');
await ensureRelation('projects', 'cover_image', 'directus_files');

const categories = [
  { name: '建站与服务器', slug: 'server', description: '服务器、部署、网络与安全实践。', code: 'SYS', color: 'lime', display_count: 18, sort: 1 },
  { name: 'AIGC 与工作流', slug: 'aigc', description: '人工智能工具、方法与工作流记录。', code: 'AIGC', color: 'blue', display_count: 24, sort: 2 },
  { name: '设计与前端', slug: 'web-design', description: '视觉设计、交互与前端开发。', code: 'WEB', color: 'orange', display_count: 16, sort: 3 },
  { name: '随笔与观察', slug: 'journal', description: '数字生活中的想法与观察。', code: 'LOG', color: 'pink', display_count: 11, sort: 4 },
  { name: '工具与资源', slug: 'toolkit', description: '可以复用的工具、清单和资源。', code: 'KIT', color: 'lime', display_count: 9, sort: 5 },
];

const seriesItems = [
  { title: '从零搭建个人服务器', slug: 'server-from-zero', description: '购买、加固、容器、域名、HTTPS 与自动化部署的完整记录。', issue_count: 7, update_label: '持续更新', accent: 'lime', sort: 1 },
  { title: 'AI 使用现场笔记', slug: 'ai-field-notes', description: '不追逐口号，只记录真正改变工作方式的工具与方法。', issue_count: 12, update_label: '每周更新', accent: 'blue', sort: 2 },
  { title: '小而美的 Web 实验', slug: 'small-web', description: '围绕交互、排版与性能制作的小型可运行作品。', issue_count: 5, update_label: '实验中', accent: 'orange', sort: 3 },
];

const projectItems = [
  { title: '内容关系地图', slug: 'content-map', label: '交互实验', description: '用节点和连线探索文章之间隐藏的关联。', accent: 'blue', mark: '◎', sort: 1 },
  { title: '服务器上线清单', slug: 'server-checklist', label: '工具箱', description: '一份不会漏掉 HTTPS、备份与安全设置的检查表。', accent: 'lime', mark: '✓', sort: 2 },
  { title: '提示词卡片盒', slug: 'prompt-cards', label: '资料集', description: '把可复用的提示结构整理成能够组合的卡片。', accent: 'pink', mark: '✦', sort: 3 },
  { title: '网页性能实验室', slug: 'web-performance-lab', label: '实验室', description: '把优化前后的真实指标放在一起比较。', accent: 'orange', mark: '↗', sort: 4 },
];

async function ensureItem(collection, slug, item) {
  const params = new URLSearchParams({ 'filter[slug][_eq]': slug, limit: '1' });
  const current = await request(`/items/${collection}?${params}`, { token });
  if (Array.isArray(current.data) && current.data.length > 0) return current.data[0];
  const created = await request(`/items/${collection}`, { method: 'POST', token, body: { status: 'published', ...item } });
  console.log(`item created: ${collection}/${slug}`);
  return created.data;
}

const categoryMap = new Map();
for (const item of categories) categoryMap.set(item.slug, await ensureItem('categories', item.slug, item));
const seriesMap = new Map();
for (const item of seriesItems) seriesMap.set(item.slug, await ensureItem('series', item.slug, item));
for (const item of projectItems) await ensureItem('projects', item.slug, item);

const posts = [
  {
    title: '一台 2C2G 小服务器，如何搭出一套认真可用的内容系统', slug: 'building-a-small-but-serious-server',
    excerpt: '从 Directus、PostgreSQL 到 Astro 与 Cloudflare，把后台能力和前台访问彻底拆开。',
    content: '<p>这套系统把内容管理、静态生成与全球分发拆成清晰的三层。</p><h2>为什么这样设计</h2><p>CMS 负责编辑，数据库负责保存，Astro 负责生成，CDN 负责访问。</p>',
    category: categoryMap.get('server').id, series: seriesMap.get('server-from-zero').id,
    tags: ['Server', 'Astro', 'Directus'], reading_time: 8, accent: 'lime', featured: true, published_at: '2026-08-27T00:00:00+08:00', sort: 1,
  },
  {
    title: '为什么我选择静态优先，而不是把所有请求都压给 VPS', slug: 'why-static-first',
    excerpt: '一次构建，多地分发。聊聊个人站在速度、成本与维护之间的取舍。',
    content: '<p>静态优先并不代表没有动态能力，而是把动态能力留给真正需要它的地方。</p>',
    category: categoryMap.get('server').id, series: seriesMap.get('server-from-zero').id,
    tags: ['CDN', 'Performance'], reading_time: 6, accent: 'blue', published_at: '2026-08-22T00:00:00+08:00', sort: 2,
  },
  {
    title: '把图片交给 R2：从上传到文章展示的完整链路', slug: 'r2-image-pipeline',
    excerpt: '让 CMS 负责编辑，让对象存储负责图片，让静态页面保持轻盈。',
    content: '<p>图片进入 R2 后，不再占用 VPS 的磁盘空间和出口带宽。</p>',
    category: categoryMap.get('server').id, series: seriesMap.get('server-from-zero').id,
    tags: ['Cloudflare', 'R2'], reading_time: 5, accent: 'orange', published_at: '2026-08-18T00:00:00+08:00', sort: 3,
  },
  {
    title: '博客之外：把个人网站变成一座持续生长的知识中枢', slug: 'personal-knowledge-hub',
    excerpt: '文章、专题、实验与作品互相连接，比一条时间线更接近真实的思考过程。',
    content: '<p>内容中枢允许文章、专题和项目互相连接，让旧内容也能持续被发现。</p>',
    category: categoryMap.get('web-design').id,
    tags: ['Design', 'Knowledge'], reading_time: 7, accent: 'pink', published_at: '2026-08-12T00:00:00+08:00', sort: 4,
  },
  {
    title: 'OpenResty 反向代理与 HTTPS 配置备忘', slug: 'openresty-notes',
    excerpt: '给下一次部署留一份可以快速查阅的清单。',
    content: '<p>记录反向代理、证书续期与 Cloudflare 严格模式的关键配置。</p>',
    category: categoryMap.get('server').id,
    tags: ['OpenResty', 'HTTPS'], reading_time: 4, accent: 'lime', published_at: '2026-08-08T00:00:00+08:00', sort: 5,
  },
  {
    title: '把 AI 当作工作台，而不是答案生成器', slug: 'ai-as-a-workbench',
    excerpt: '记录一种更适合长期项目的协作方式。',
    content: '<p>长期项目需要可复查的过程、明确的边界和持续更新的上下文。</p>',
    category: categoryMap.get('aigc').id, series: seriesMap.get('ai-field-notes').id,
    tags: ['AI', 'Workflow'], reading_time: 9, accent: 'blue', published_at: '2026-08-01T00:00:00+08:00', sort: 6,
  },
];

for (const item of posts) await ensureItem('posts', item.slug, item);

const currentSettings = await request('/items/site_settings', { token });
const settingsExist = Array.isArray(currentSettings.data)
  ? currentSettings.data.length > 0
  : currentSettings.data?.id != null;
if (!settingsExist) {
  await request('/items/site_settings', {
    method: 'PATCH', token,
    body: {
      site_name: '0712121', site_label: '个人内容中枢', hero_kicker: '个人知识与创作索引',
      hero_title: '在数字世界里，建一座持续生长的个人资料库。', hero_highlight: '持续生长',
      hero_description: '记录建站、人工智能、设计与数字生活。把零散的发现连成线，让每一次思考都有地方继续生长。',
      about_text: '这里用来保存那些不应该被信息流冲走的东西。',
      footer_text: '让这里成为一座持续生长的资料库。', content_total: 78,
    },
  });
  console.log('item created: site_settings');
}

const policies = await request('/policies?limit=-1', { token });
const publicPolicy = policies.data.find((item) => item.name === '$t:public_label' || (!item.admin_access && !item.app_access));
if (!publicPolicy) throw new Error('Public policy was not found.');

const publicRules = [
  ['posts', { status: { _eq: 'published' } }, ['id','sort','title','slug','excerpt','content','cover_image','category','series','tags','reading_time','accent','featured','published_at','date_created']],
  ['categories', { status: { _eq: 'published' } }, ['id','name','slug','description','code','color','display_count','sort']],
  ['series', { status: { _eq: 'published' } }, ['id','title','slug','description','cover_image','accent','issue_count','update_label','sort']],
  ['projects', { status: { _eq: 'published' } }, ['id','title','slug','label','description','url','cover_image','accent','mark','sort']],
  ['site_settings', {}, ['site_name','site_label','hero_kicker','hero_title','hero_highlight','hero_description','about_text','footer_text','content_total']],
];

const existingPermissions = await request('/permissions?limit=-1', { token });
for (const [collection, permissions, fields] of publicRules) {
  const existing = existingPermissions.data.find((item) => item.policy === publicPolicy.id && item.collection === collection && item.action === 'read');
  if (existing) {
    await request(`/permissions/${existing.id}`, {
      method: 'PATCH', token,
      body: { permissions, fields },
    });
    console.log(`public read updated: ${collection}`);
    continue;
  }
  await request('/permissions', {
    method: 'POST', token,
    body: { policy: publicPolicy.id, collection, action: 'read', permissions, validation: null, presets: null, fields },
  });
  console.log(`public read enabled: ${collection}`);
}

console.log('DIRECTUS_BOOTSTRAP_COMPLETE');
