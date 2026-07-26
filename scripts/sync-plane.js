/**
 * sync-plane.js — Sincroniza issues de Plane.so con specs locales
 *
 * Uso:
 *   node scripts/sync-plane.js pull     # Trae issues abiertos → docs/specs/
 *   node scripts/sync-plane.js push     # Sube cambios locales → Plane.so
 *   node scripts/sync-plane.js status   # Muestra diferencias
 *
 * Variables de entorno requeridas:
 *   PLANE_API_KEY   — Token de API de Plane.so
 *   PLANE_PROJECT   — ID del proyecto en Plane (ej: "abc123")
 *   PLANE_WORKSPACE — Slug del workspace
 *
 * Opcional:
 *   PLANE_API_URL   — Default: https://api.plane.so
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const PLANE_API_URL = process.env.PLANE_API_URL || 'https://api.plane.so';
const PLANE_API_KEY = process.env.PLANE_API_KEY;
const PLANE_WORKSPACE = process.env.PLANE_WORKSPACE;
const PLANE_PROJECT = process.env.PLANE_PROJECT;

const SPECS_DIR = require('path').join(__dirname, '..', 'docs', 'specs');
const fs = require('fs');
const path = require('path');

if (!PLANE_API_KEY || !PLANE_WORKSPACE || !PLANE_PROJECT) {
  console.error('❌ Faltan variables de entorno: PLANE_API_KEY, PLANE_WORKSPACE, PLANE_PROJECT');
  console.error('   Crea un archivo .env o configúralas en el entorno.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': PLANE_API_KEY,
};

async function api(path, options = {}) {
  const url = `${PLANE_API_URL}/api/v1/workspaces/${PLANE_WORKSPACE}/projects/${PLANE_PROJECT}/${path}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Plane API error ${res.status}: ${text}`);
  }
  return res.json();
}

function extractResults(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function pull() {
  console.log('⬇️  Pulling issues from Plane.so...');
  const data = await api('work-items/');
  const issues = extractResults(data);

  let count = 0;
  for (const issue of issues) {
    const title = issue.name || issue.title || 'Untitled';
    const slug = slugify(title);
    const filename = `${slug}.md`;
    const filepath = path.join(SPECS_DIR, filename);

    if (fs.existsSync(filepath)) {
      console.log(`  ⏭  ${filename} ya existe, saltando`);
      continue;
    }

    const spec = generateSpec(issue);
    fs.writeFileSync(filepath, spec, 'utf-8');
    console.log(`  ✅ ${filename} (ID: ${issue.id})`);
    count++;
  }

  console.log(`\n📥 ${count} spec(s) descargada(s) a docs/specs/`);
}

function generateSpec(issue) {
  const title = issue.name || issue.title || 'Sin título';
  const description = (issue.description_html || issue.description || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const labels = (issue.labels || []).map(l => l.name || l).join(', ');

  return `# Spec: ${title}

**Plane Issue:** ${issue.id}
**Prioridad:** ${labels || 'Media'}
**Estado:** ${issue.state_name || 'backlog'}

---

## Descripción

${description}

## Criterios de aceptación

${(issue.acceptance_criteria || issue.acceptance_criteria || '')
  .split('\n')
  .filter(l => l.trim())
  .map(l => `- [ ] ${l.trim()}`)
  .join('\n') || '- [ ] Pendiente de definir'}

---

> ⚡ Sincronizado desde Plane.so el ${new Date().toISOString().split('T')[0]}
`;
}

async function push() {
  console.log('⬆️  Pushing local specs to Plane.so...');
  const files = fs.readdirSync(SPECS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'ISSUE_TEMPLATE.md');

  for (const file of files) {
    const content = fs.readFileSync(path.join(SPECS_DIR, file), 'utf-8');
    const title = content.split('\n')[0].replace('# Spec: ', '').trim();

    const planeId = content.match(/Plane Issue:\s*(\S+)/);
    if (!planeId) {
      console.log(`  ⏭  ${file} no tiene Plane Issue ID, creando issue...`);
      await createIssue(title, content);
      continue;
    }

    console.log(`  ⏭  ${file} ya tiene ID ${planeId[1]}, actualizar no implementado aún`);
  }
}

async function createIssue(title, body) {
  try {
    const result = await api('work-items/', {
      method: 'POST',
      body: JSON.stringify({
        name: title,
        description_html: body.replace(/\n/g, '<br>'),
      }),
    });
    console.log(`  ✅ Issue creado: ${result.id}`);
  } catch (err) {
    console.error(`  ❌ Error creando issue: ${err.message}`);
  }
}

async function status() {
  console.log('📊 Plane.so Sync Status\n');

  const files = fs.readdirSync(SPECS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'ISSUE_TEMPLATE.md');

  console.log(`📁 ${files.length} spec(s) local(es):`);
  for (const file of files) {
    const content = fs.readFileSync(path.join(SPECS_DIR, file), 'utf-8');
    const hasId = /Plane Issue:\s*\S+/.test(content);
    console.log(`  ${hasId ? '🔗' : '⚠️'} ${file}${hasId ? '' : ' (sin Plane ID)'}`);
  }

  try {
    const data = await api('work-items/');
    const issues = extractResults(data);
    console.log(`\n🌐 ${issues.length} issue(s) en Plane.so:`);
    for (const issue of issues) {
      console.log(`  📌 ${issue.name || issue.title} (${issue.state_name || '?'})`);
    }
  } catch (err) {
    console.log(`\n  ❌ No se pudo conectar con Plane.so: ${err.message}`);
  }
}

const command = process.argv[2];
if (!command || !['pull', 'push', 'status'].includes(command)) {
  console.log('Uso: node scripts/sync-plane.js <pull|push|status>');
  process.exit(1);
}

switch (command) {
  case 'pull': pull().catch(err => { console.error(err); process.exit(1); }); break;
  case 'push': push().catch(err => { console.error(err); process.exit(1); }); break;
  case 'status': status().catch(err => { console.error(err); process.exit(1); }); break;
}
