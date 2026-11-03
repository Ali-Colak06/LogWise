#!/usr/bin/env node
/**
 * Validate data/ex-guides.json and generate the browser global wrapper + mobile projection.
 * Canonical source: data/ex-guides.json
 * Generated outputs:
 * - data/ex-guides.js
 * - logwise-mobile/data/generated/ex-content.ts
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DEFAULT_ROOT = path.join(__dirname, '..');
const GUIDE_FILE = 'data/ex-guides.json';
const WRAPPER_FILE = 'data/ex-guides.js';
const MOBILE_EX_CONTENT_FILE = 'logwise-mobile/data/generated/ex-content.ts';
const MEDIA_ORIGIN = 'https://media.logwise.fit';
const GUIDE_ORIGIN = 'https://logwise.fit';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GUIDE_KEYS = [
  'publish', 'previewReady', 'mediaReady', 'webGuideUrl', 'summary', 'description',
  'formSteps', 'mistakes', 'tips', 'progression', 'muscles', 'media', 'web'
];
const MUSCLE_KEYS = ['primary', 'secondary'];
const MEDIA_KEYS = ['demoMp4', 'demoWebm', 'poster', 'muscleMap', 'demoLabel', 'muscleMapAlt'];
const WEB_KEYS = ['metaTitle', 'metaDescription', 'quickFacts', 'tracking', 'related'];
const QUICK_FACT_KEYS = ['primaryMuscles', 'equipment', 'movementPattern', 'bestFor'];
const DRAFT_MUSCLE_SLUGS = new Set([
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'trapezius',
  'glutes', 'calves', 'forearms', 'core', 'cardiovascular', 'full-body'
]);

function fail(errors) {
  const error = new Error(`Exercise guide validation failed:\n- ${errors.join('\n- ')}`);
  error.validationErrors = errors;
  throw error;
}

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function loadPresetIds(root) {
  const file = path.join(root, 'data/presets-exercises.js');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  return new Set((context.window.LOGWISE_PRESET_EXERCISES || []).map(exercise => exercise.id));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function checkExactKeys(errors, value, allowed, label) {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) errors.push(`${label}.${key} is not part of the exercise-guide contract.`);
  }
  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) errors.push(`${label}.${key} is required.`);
  }
}

function checkLocalizedText(errors, value, label) {
  if (!Array.isArray(value) || value.length !== 2) {
    errors.push(`${label} must be [TR, EN].`);
    return;
  }
  if (!isNonEmptyString(value[0])) errors.push(`${label}[0] must contain Turkish text.`);
  if (!isNonEmptyString(value[1])) errors.push(`${label}[1] must contain English text.`);
}

function checkLocalizedList(errors, value, label) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array.`);
    return;
  }
  value.forEach((item, index) => checkLocalizedText(errors, item, `${label}[${index}]`));
}

function checkSlugList(errors, value, label, presetIds, requireOne) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array.`);
    return;
  }
  if (requireOne && value.length === 0) errors.push(`${label} must contain at least one slug.`);
  const seen = new Set();
  value.forEach((slug, index) => {
    if (!isNonEmptyString(slug) || !SLUG_RE.test(slug)) {
      errors.push(`${label}[${index}] must be a lowercase kebab-case slug.`);
      return;
    }
    if (seen.has(slug)) errors.push(`${label} contains duplicate slug "${slug}".`);
    seen.add(slug);
    if (presetIds && !presetIds.has(slug)) errors.push(`${label}[${index}] references unknown exercise "${slug}".`);
  });
}

function checkMediaUrl(errors, value, label, slug, extension) {
  if (value === null) return;
  if (!isNonEmptyString(value)) {
    errors.push(`${label} must be null or an absolute HTTPS URL.`);
    return;
  }

  let url;
  try {
    url = new URL(value);
  } catch (_) {
    errors.push(`${label} is not a valid URL.`);
    return;
  }

  if (url.origin !== MEDIA_ORIGIN) errors.push(`${label} must use ${MEDIA_ORIGIN}.`);
  if (!url.pathname.startsWith(`/exercises/${slug}/`)) {
    errors.push(`${label} must live under /exercises/${slug}/.`);
  }
  if (!url.pathname.endsWith(extension)) errors.push(`${label} must end with ${extension}.`);

  const filename = url.pathname.split('/').pop();
  const escapedExtension = extension.replace('.', '\\.');
  if (!new RegExp(`-v\\d+${escapedExtension}$`).test(filename)) {
    errors.push(`${label} must use a versioned filename such as demo-v1${extension}.`);
  }
}

function checkWebData(errors, web, label, presetIds) {
  if (!web || typeof web !== 'object' || Array.isArray(web)) {
    errors.push(`${label} must be an object when publish is true.`);
    return;
  }
  checkExactKeys(errors, web, WEB_KEYS, label);
  checkLocalizedText(errors, web.metaTitle, `${label}.metaTitle`);
  checkLocalizedText(errors, web.metaDescription, `${label}.metaDescription`);
  checkLocalizedList(errors, web.tracking, `${label}.tracking`);
  checkSlugList(errors, web.related, `${label}.related`, presetIds, false);

  const facts = web.quickFacts;
  if (!facts || typeof facts !== 'object' || Array.isArray(facts)) {
    errors.push(`${label}.quickFacts must be an object.`);
    return;
  }
  checkExactKeys(errors, facts, QUICK_FACT_KEYS, `${label}.quickFacts`);
  checkLocalizedText(errors, facts.primaryMuscles, `${label}.quickFacts.primaryMuscles`);
  checkLocalizedText(errors, facts.equipment, `${label}.quickFacts.equipment`);
  checkLocalizedText(errors, facts.movementPattern, `${label}.quickFacts.movementPattern`);
  checkLocalizedText(errors, facts.bestFor, `${label}.quickFacts.bestFor`);
}

function isContentReady(guide) {
  const muscles = guide && guide.muscles;
  const muscleSlugs = muscles && Array.isArray(muscles.primary) && Array.isArray(muscles.secondary)
    ? [...muscles.primary, ...muscles.secondary]
    : [];
  return Boolean(
    guide && guide.previewReady &&
    Array.isArray(guide.formSteps) && guide.formSteps.length > 0 &&
    Array.isArray(guide.mistakes) && guide.mistakes.length > 0 &&
    Array.isArray(guide.progression) && guide.progression.length > 0 &&
    guide.web && typeof guide.web === 'object' &&
    muscleSlugs.length > 0 && !muscleSlugs.some(slug => DRAFT_MUSCLE_SLUGS.has(slug))
  );
}

function validateExerciseGuides(guides, presetIds) {
  const errors = [];
  if (!guides || typeof guides !== 'object' || Array.isArray(guides)) {
    fail(['Root value must be an object keyed by exercise slug.']);
  }

  for (const presetId of presetIds) {
    if (!Object.prototype.hasOwnProperty.call(guides, presetId)) {
      errors.push(`guides.${presetId} is required for full preset coverage.`);
    }
  }

  for (const [slug, guide] of Object.entries(guides)) {
    const label = `guides.${slug}`;
    if (!SLUG_RE.test(slug)) errors.push(`${label} has an invalid slug key.`);
    if (!presetIds.has(slug)) errors.push(`${label} does not exist in data/presets-exercises.js.`);
    if (!guide || typeof guide !== 'object' || Array.isArray(guide)) {
      errors.push(`${label} must be an object.`);
      continue;
    }
    checkExactKeys(errors, guide, GUIDE_KEYS, label);

    for (const flag of ['publish', 'previewReady', 'mediaReady']) {
      if (typeof guide[flag] !== 'boolean') errors.push(`${label}.${flag} must be boolean.`);
    }

    const expectedGuideUrl = `${GUIDE_ORIGIN}/library/exercises/${slug}`;
    if (guide.webGuideUrl !== expectedGuideUrl) {
      errors.push(`${label}.webGuideUrl must equal ${expectedGuideUrl}.`);
    }

    checkLocalizedText(errors, guide.summary, `${label}.summary`);
    checkLocalizedText(errors, guide.description, `${label}.description`);
    checkLocalizedList(errors, guide.formSteps, `${label}.formSteps`);
    checkLocalizedList(errors, guide.mistakes, `${label}.mistakes`);
    checkLocalizedList(errors, guide.tips, `${label}.tips`);
    checkLocalizedList(errors, guide.progression, `${label}.progression`);

    const muscles = guide.muscles;
    if (!muscles || typeof muscles !== 'object' || Array.isArray(muscles)) {
      errors.push(`${label}.muscles must be an object.`);
    } else {
      checkExactKeys(errors, muscles, MUSCLE_KEYS, `${label}.muscles`);
      checkSlugList(errors, muscles.primary, `${label}.muscles.primary`, null, true);
      checkSlugList(errors, muscles.secondary, `${label}.muscles.secondary`, null, false);
    }

    const media = guide.media;
    if (!media || typeof media !== 'object' || Array.isArray(media)) {
      errors.push(`${label}.media must be an object.`);
    } else {
      checkExactKeys(errors, media, MEDIA_KEYS, `${label}.media`);
      checkMediaUrl(errors, media.demoMp4, `${label}.media.demoMp4`, slug, '.mp4');
      checkMediaUrl(errors, media.demoWebm, `${label}.media.demoWebm`, slug, '.webm');
      checkMediaUrl(errors, media.poster, `${label}.media.poster`, slug, '.webp');
      checkMediaUrl(errors, media.muscleMap, `${label}.media.muscleMap`, slug, '.webp');
      checkLocalizedText(errors, media.demoLabel, `${label}.media.demoLabel`);
      checkLocalizedText(errors, media.muscleMapAlt, `${label}.media.muscleMapAlt`);
    }

    if (guide.previewReady && (!Array.isArray(guide.tips) || guide.tips.length === 0)) {
      errors.push(`${label}.previewReady requires at least one tip.`);
    }

    if (guide.mediaReady) {
      if (!media || !isNonEmptyString(media.demoMp4)) errors.push(`${label}.mediaReady requires demoMp4.`);
      if (!media || !isNonEmptyString(media.poster)) errors.push(`${label}.mediaReady requires poster.`);
    }

    if (guide.publish) {
      if (!guide.previewReady) errors.push(`${label}.publish requires previewReady.`);
      if (!guide.mediaReady) errors.push(`${label}.publish requires mediaReady.`);
      if (!Array.isArray(guide.formSteps) || guide.formSteps.length === 0) errors.push(`${label}.publish requires formSteps.`);
      if (!Array.isArray(guide.mistakes) || guide.mistakes.length === 0) errors.push(`${label}.publish requires mistakes.`);
      if (!Array.isArray(guide.progression) || guide.progression.length === 0) errors.push(`${label}.publish requires progression.`);
      if (!media || !isNonEmptyString(media.muscleMap)) errors.push(`${label}.publish requires muscleMap.`);
      if (!isContentReady(guide)) errors.push(`${label}.publish requires content-ready anatomical muscle data.`);
      checkWebData(errors, guide.web, `${label}.web`, presetIds);
    } else if (guide.web !== null && guide.web !== undefined) {
      checkWebData(errors, guide.web, `${label}.web`, presetIds);
    }
  }

  if (errors.length) fail(errors);
  return guides;
}

function loadAndValidateExerciseGuides(root = DEFAULT_ROOT) {
  const guides = readJson(path.join(root, GUIDE_FILE));
  return validateExerciseGuides(guides, loadPresetIds(root));
}

function wrapperSource(guides) {
  const json = JSON.stringify(guides, null, 2).replace(/</g, '\\u003c');
  return `// AUTO-GENERATED by scripts/build-ex-guides.js. Do not edit manually.\nwindow.LOGWISE_EX_GUIDES = ${json};\n`.replace(/\n/g, '\r\n');
}

function mobileProjection(guides) {
  const projection = {};
  for (const [slug, guide] of Object.entries(guides)) {
    projection[slug] = {
      summary: guide.summary,
      description: guide.description,
      tips: guide.tips,
      gif: (guide.media && (guide.media.demoMp4 ?? guide.media.demoWebm)) ?? null,
      webGuideUrl: guide.webGuideUrl
    };
  }
  return projection;
}

function mobileExContentSource(guides) {
  const projection = mobileProjection(guides);
  const json = JSON.stringify(projection, null, 2);
  return `/**
 * GENERATED — elle DÜZENLEME. Kaynak: data/ex-guides.json (ince mobil projection).
 * Yeniden üret/doğrula: node scripts/build-ex-guides.js (mobil projection çıktısı + --check)
 *
 * Yalnız mobilin render ettiği alanlar: summary, description, tips, gif, webGuideUrl.
 * muscles/formSteps/mistakes/progression/web DAHİL DEĞİL (taksonomi → Faz 3).
 * Format: JSON.stringify(projection, null, 2) (deterministik).
 */
import type { ExContent } from '../ex-content.types';

export const EX_CONTENT: Readonly<Record<string, ExContent>> = ${json};
`;
}

function generatedOutputs(root, guides) {
  return [
    {
      file: WRAPPER_FILE,
      path: path.join(root, WRAPPER_FILE),
      source: wrapperSource(guides)
    },
    {
      file: MOBILE_EX_CONTENT_FILE,
      path: path.join(root, MOBILE_EX_CONTENT_FILE),
      source: mobileExContentSource(guides)
    }
  ];
}

function writeGeneratedOutputs(root, guides) {
  const outputs = generatedOutputs(root, guides);
  const changed = [];
  for (const output of outputs) {
    const previous = fs.existsSync(output.path) ? fs.readFileSync(output.path, 'utf8') : null;
    if (previous !== output.source) {
      fs.writeFileSync(output.path, output.source, 'utf8');
      changed.push(output.file);
    }
  }
  return changed;
}

function checkGeneratedOutputs(root, guides) {
  const stale = [];
  for (const output of generatedOutputs(root, guides)) {
    // Git checkout satır sonlarını platforma göre dönüştürebilir; içerik aynıysa drift yoktur.
    const current = fs.existsSync(output.path) ? fs.readFileSync(output.path, 'utf8') : null;
    if (current === null || current.replace(/\r\n/g, '\n') !== output.source.replace(/\r\n/g, '\n')) {
      stale.push(output.file);
    }
  }
  if (stale.length) {
    const error = new Error(`Exercise guide generated outputs are stale:\n- ${stale.join('\n- ')}\nRun: node scripts/build-ex-guides.js`);
    error.staleOutputs = stale;
    throw error;
  }
}

function buildExerciseGuides(options = {}) {
  const root = options.root || DEFAULT_ROOT;
  const guides = loadAndValidateExerciseGuides(root);
  const changedOutputs = writeGeneratedOutputs(root, guides);
  return {
    total: Object.keys(guides).length,
    previewReady: Object.values(guides).filter(guide => guide.previewReady).length,
    contentReady: Object.values(guides).filter(isContentReady).length,
    mediaReady: Object.values(guides).filter(guide => guide.mediaReady).length,
    published: Object.values(guides).filter(guide => guide.publish).length,
    changed: changedOutputs.length > 0,
    changedOutputs
  };
}

if (require.main === module) {
  const checkOnly = process.argv.includes('--check');
  const result = checkOnly
    ? (() => {
        const guides = loadAndValidateExerciseGuides();
        checkGeneratedOutputs(DEFAULT_ROOT, guides);
        return {
          total: Object.keys(guides).length,
          previewReady: Object.values(guides).filter(guide => guide.previewReady).length,
          contentReady: Object.values(guides).filter(isContentReady).length,
          mediaReady: Object.values(guides).filter(guide => guide.mediaReady).length,
          published: Object.values(guides).filter(guide => guide.publish).length
        };
      })()
    : buildExerciseGuides();
  const mode = checkOnly ? 'validated' : 'generated';
  console.log(`Exercise guides ${mode}: ${result.total} total, ${result.previewReady} preview-ready, ${result.contentReady} content-ready, ${result.mediaReady} media-ready, ${result.published} published.`);
}

module.exports = {
  buildExerciseGuides,
  isContentReady,
  loadAndValidateExerciseGuides,
  validateExerciseGuides
};
