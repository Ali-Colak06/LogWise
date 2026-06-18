#!/usr/bin/env node
/**
 * Validate data/ex-guides.json and generate the browser global wrapper.
 * Canonical source: data/ex-guides.json
 * Generated output: data/ex-guides.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DEFAULT_ROOT = path.join(__dirname, '..');
const GUIDE_FILE = 'data/ex-guides.json';
const WRAPPER_FILE = 'data/ex-guides.js';
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
  return `// AUTO-GENERATED by scripts/build-ex-guides.js. Do not edit manually.\nwindow.LOGWISE_EX_GUIDES = ${json};\n`;
}

function buildExerciseGuides(options = {}) {
  const root = options.root || DEFAULT_ROOT;
  const guides = loadAndValidateExerciseGuides(root);
  const outputPath = path.join(root, WRAPPER_FILE);
  const output = wrapperSource(guides);
  const previous = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : null;
  if (previous !== output) fs.writeFileSync(outputPath, output, 'utf8');
  return {
    total: Object.keys(guides).length,
    previewReady: Object.values(guides).filter(guide => guide.previewReady).length,
    mediaReady: Object.values(guides).filter(guide => guide.mediaReady).length,
    published: Object.values(guides).filter(guide => guide.publish).length,
    changed: previous !== output
  };
}

if (require.main === module) {
  const checkOnly = process.argv.includes('--check');
  const result = checkOnly
    ? (() => {
        const guides = loadAndValidateExerciseGuides();
        return {
          total: Object.keys(guides).length,
          previewReady: Object.values(guides).filter(guide => guide.previewReady).length,
          mediaReady: Object.values(guides).filter(guide => guide.mediaReady).length,
          published: Object.values(guides).filter(guide => guide.publish).length
        };
      })()
    : buildExerciseGuides();
  const mode = checkOnly ? 'validated' : 'generated';
  console.log(`Exercise guides ${mode}: ${result.total} total, ${result.previewReady} preview-ready, ${result.mediaReady} media-ready, ${result.published} published.`);
}

module.exports = {
  buildExerciseGuides,
  loadAndValidateExerciseGuides,
  validateExerciseGuides
};
