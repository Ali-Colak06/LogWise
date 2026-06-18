#!/usr/bin/env node
/**
 * Validate local exercise MP4 files and deployed R2 media responses.
 *
 * Usage:
 *   node scripts/validate-exercise-media.js --local path/to/demo-v1.mp4
 *   node scripts/validate-exercise-media.js --remote bench-press
 *   node scripts/validate-exercise-media.js --remote-ready
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const GUIDE_FILE = path.join(ROOT, 'data/ex-guides.json');
const EXPECTED_ORIGIN = 'https://logwise.fit';
const CACHE_SECONDS = 31536000;

function usage() {
  console.log('Usage:');
  console.log('  node scripts/validate-exercise-media.js --local <demo-vN.mp4>');
  console.log('  node scripts/validate-exercise-media.js --remote <exercise-slug>');
  console.log('  node scripts/validate-exercise-media.js --remote-ready');
}

function fail(errors) {
  const error = new Error(`Exercise media validation failed:\n- ${errors.join('\n- ')}`);
  error.validationErrors = errors;
  throw error;
}

function parseRate(value) {
  if (!value || typeof value !== 'string') return NaN;
  const parts = value.split('/').map(Number);
  if (parts.length === 1) return parts[0];
  return parts[1] ? parts[0] / parts[1] : NaN;
}

function hasFastStart(file) {
  const size = fs.statSync(file).size;
  const length = Math.min(size, 4 * 1024 * 1024);
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.alloc(length);
  try {
    fs.readSync(fd, buffer, 0, length, 0);
  } finally {
    fs.closeSync(fd);
  }
  const moov = buffer.indexOf(Buffer.from('moov'));
  const mdat = buffer.indexOf(Buffer.from('mdat'));
  return moov !== -1 && (mdat === -1 || moov < mdat);
}

function ffprobe(file) {
  const probe = spawnSync('ffprobe', [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    file
  ], { encoding: 'utf8' });

  if (probe.error && probe.error.code === 'ENOENT') {
    throw new Error('ffprobe is not installed or is not available on PATH. Install FFmpeg before validating local MP4 files.');
  }
  if (probe.status !== 0) {
    throw new Error(`ffprobe failed for ${file}: ${(probe.stderr || '').trim()}`);
  }
  return JSON.parse(probe.stdout);
}

function validateLocalMp4(file) {
  const errors = [];
  const resolved = path.resolve(file);
  if (!fs.existsSync(resolved)) fail([`Local file does not exist: ${resolved}`]);
  if (!/-v\d+\.mp4$/i.test(path.basename(resolved))) {
    errors.push('MP4 filename must be versioned, for example demo-v1.mp4.');
  }

  const probe = ffprobe(resolved);
  const streams = Array.isArray(probe.streams) ? probe.streams : [];
  const video = streams.find(stream => stream.codec_type === 'video');
  const audio = streams.find(stream => stream.codec_type === 'audio');
  if (!video) errors.push('MP4 must contain one video stream.');
  if (audio) errors.push('MP4 must not contain an audio stream.');

  if (video) {
    if (video.codec_name !== 'h264') errors.push(`Video codec must be H.264; received ${video.codec_name || 'unknown'}.`);
    if (video.profile !== 'Main') errors.push(`H.264 profile must be Main; received ${video.profile || 'unknown'}.`);
    if (Number(video.level) !== 31) errors.push(`H.264 level must be 3.1; received ${video.level || 'unknown'}.`);
    if (video.pix_fmt !== 'yuv420p') errors.push(`Pixel format must be yuv420p; received ${video.pix_fmt || 'unknown'}.`);

    const width = Number(video.width || 0);
    const height = Number(video.height || 0);
    const longEdge = Math.max(width, height);
    const shortEdge = Math.min(width, height);
    if (!width || !height) errors.push('Video dimensions could not be read.');
    if (longEdge > 1280 || shortEdge > 720) {
      errors.push(`Video exceeds the 720p envelope: ${width}x${height}.`);
    }

    const fps = parseRate(video.avg_frame_rate || video.r_frame_rate);
    if (!Number.isFinite(fps) || fps <= 0 || fps > 30.5) {
      errors.push(`Frame rate must be at most 30 FPS; received ${Number.isFinite(fps) ? fps.toFixed(2) : 'unknown'}.`);
    }
  }

  const duration = Number((probe.format && probe.format.duration) || (video && video.duration) || 0);
  if (!duration || duration < 3.8 || duration > 6.2) {
    errors.push(`Duration must be approximately 4-6 seconds; received ${duration ? duration.toFixed(2) : 'unknown'} seconds.`);
  }

  const bitRate = Number((video && video.bit_rate) || (probe.format && probe.format.bit_rate) || 0);
  if (!bitRate || bitRate < 750000 || bitRate > 2500000) {
    errors.push(`Bitrate must stay near 1-2 Mbps; received ${bitRate ? Math.round(bitRate / 1000) + ' kbps' : 'unknown'}.`);
  }

  if (!hasFastStart(resolved)) errors.push('MP4 must place the moov atom before mdat (-movflags +faststart).');
  if (errors.length) fail(errors);

  return {
    file: resolved,
    codec: video.codec_name,
    profile: video.profile,
    level: video.level,
    dimensions: `${video.width}x${video.height}`,
    duration: Number(duration.toFixed(2)),
    bitrateKbps: Math.round(bitRate / 1000)
  };
}

function expectedContentType(field) {
  if (field === 'demoMp4') return 'video/mp4';
  if (field === 'demoWebm') return 'video/webm';
  return 'image/webp';
}

function checkCacheControl(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  const maxAge = lower.match(/max-age=(\d+)/);
  return lower.includes('public') && lower.includes('immutable') && maxAge && Number(maxAge[1]) >= CACHE_SECONDS;
}

async function cancelBody(response) {
  if (response.body && typeof response.body.cancel === 'function') {
    await response.body.cancel().catch(() => {});
  }
}

async function validateRemoteAsset(slug, field, url) {
  const errors = [];
  const contentType = expectedContentType(field);
  const headers = { Origin: EXPECTED_ORIGIN };
  const head = await fetch(url, { method: 'HEAD', headers, redirect: 'follow' });

  if (!head.ok) errors.push(`${slug}.${field} HEAD returned ${head.status}.`);
  const receivedType = (head.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (receivedType !== contentType) errors.push(`${slug}.${field} Content-Type must be ${contentType}; received ${receivedType || 'missing'}.`);
  if (!checkCacheControl(head.headers.get('cache-control'))) {
    errors.push(`${slug}.${field} must return public, max-age=${CACHE_SECONDS}, immutable cache headers.`);
  }

  const cors = head.headers.get('access-control-allow-origin');
  if (cors !== '*' && cors !== EXPECTED_ORIGIN) {
    errors.push(`${slug}.${field} CORS must allow ${EXPECTED_ORIGIN}; received ${cors || 'missing'}.`);
  }

  if (field === 'demoMp4') {
    const range = await fetch(url, {
      method: 'GET',
      headers: { ...headers, Range: 'bytes=0-1023' },
      redirect: 'follow'
    });
    if (range.status !== 206) errors.push(`${slug}.${field} range request must return 206; received ${range.status}.`);
    const contentRange = range.headers.get('content-range') || '';
    if (!/^bytes 0-\d+\/\d+$/.test(contentRange)) {
      errors.push(`${slug}.${field} returned invalid Content-Range: ${contentRange || 'missing'}.`);
    }
    await cancelBody(range);
  }

  await cancelBody(head);
  if (errors.length) fail(errors);
  return { slug, field, url, contentType };
}

function loadGuides() {
  return JSON.parse(fs.readFileSync(GUIDE_FILE, 'utf8'));
}

async function validateRemoteGuide(slug, guide) {
  const media = guide.media || {};
  const fields = ['demoMp4', 'demoWebm', 'poster', 'muscleMap'].filter(field => media[field]);
  if (!fields.length) fail([`${slug} has no remote media URLs to validate.`]);
  const results = [];
  for (const field of fields) {
    results.push(await validateRemoteAsset(slug, field, media[field]));
  }
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help')) {
    usage();
    return;
  }

  const localIndex = args.indexOf('--local');
  if (localIndex !== -1) {
    const file = args[localIndex + 1];
    if (!file) throw new Error('--local requires an MP4 path.');
    const result = validateLocalMp4(file);
    console.log(`Local MP4 OK: ${result.file}`);
    console.log(`  ${result.codec} ${result.profile} level ${result.level}, ${result.dimensions}, ${result.duration}s, ${result.bitrateKbps} kbps`);
  }

  const guides = loadGuides();
  const remoteIndex = args.indexOf('--remote');
  if (remoteIndex !== -1) {
    const slug = args[remoteIndex + 1];
    if (!slug) throw new Error('--remote requires an exercise slug.');
    if (!guides[slug]) throw new Error(`Unknown exercise guide slug: ${slug}`);
    const results = await validateRemoteGuide(slug, guides[slug]);
    console.log(`Remote media OK: ${slug} (${results.length} assets)`);
  }

  if (args.includes('--remote-ready')) {
    const ready = Object.entries(guides).filter(([, guide]) => guide.mediaReady);
    if (!ready.length) {
      console.log('No mediaReady exercise guides to validate.');
    } else {
      for (const [slug, guide] of ready) {
        const results = await validateRemoteGuide(slug, guide);
        console.log(`Remote media OK: ${slug} (${results.length} assets)`);
      }
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  validateLocalMp4,
  validateRemoteAsset,
  validateRemoteGuide
};
