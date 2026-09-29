import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateImageFile } from '../dist/media/validation/image-validator.js';
import { MAX_MEDIA_FILE_SIZE_BYTES } from '../dist/media/media.types.js';

// Valid file header buffers
const VALID_JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
  Buffer.alloc(50, 0x12),
]);

const VALID_PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]),
  Buffer.alloc(50, 0x34),
]);

const VALID_WEBP = Buffer.concat([
  Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
  Buffer.alloc(50, 0x56),
]);

const VALID_AVIF = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]),
  Buffer.alloc(50, 0x78),
]);

test('Image Validator: Magic Bytes & Format Verification', async (t) => {
  await t.test('accepts valid JPEG buffer with .jpg extension', () => {
    const result = validateImageFile(VALID_JPEG, 'photo.jpg', 'image/jpeg');
    assert.equal(result.mimeType, 'image/jpeg');
    assert.equal(result.extension, 'jpg');
    assert.equal(result.byteSize, VALID_JPEG.length);
  });

  await t.test('accepts valid JPEG buffer with .jpeg extension', () => {
    const result = validateImageFile(VALID_JPEG, 'photo.jpeg', 'image/jpeg');
    assert.equal(result.mimeType, 'image/jpeg');
    assert.equal(result.extension, 'jpg');
  });

  await t.test('accepts valid PNG buffer with .png extension', () => {
    const result = validateImageFile(VALID_PNG, 'graphic.png', 'image/png');
    assert.equal(result.mimeType, 'image/png');
    assert.equal(result.extension, 'png');
  });

  await t.test('accepts valid WEBP buffer with .webp extension', () => {
    const result = validateImageFile(VALID_WEBP, 'banner.webp', 'image/webp');
    assert.equal(result.mimeType, 'image/webp');
    assert.equal(result.extension, 'webp');
  });

  await t.test('accepts valid AVIF buffer with .avif extension', () => {
    const result = validateImageFile(VALID_AVIF, 'hero.avif', 'image/avif');
    assert.equal(result.mimeType, 'image/avif');
    assert.equal(result.extension, 'avif');
  });

  await t.test('rejects empty buffer', () => {
    assert.throws(
      () => validateImageFile(Buffer.alloc(0), 'empty.jpg', 'image/jpeg'),
      /vac[ií]o/i
    );
  });

  await t.test('rejects truncated buffer (< 12 bytes)', () => {
    assert.throws(
      () => validateImageFile(Buffer.from([0xff, 0xd8, 0xff]), 'small.jpg', 'image/jpeg'),
      /no soportado o inv[aá]lido/i
    );
  });

  await t.test('rejects oversized buffer (> 8 MiB)', () => {
    const oversized = Buffer.alloc(MAX_MEDIA_FILE_SIZE_BYTES + 1);
    assert.throws(
      () => validateImageFile(oversized, 'huge.jpg', 'image/jpeg'),
      /excede el tama[ñn]o m[aá]ximo/i
    );
  });

  await t.test('rejects fake JPEG (plain text renamed to .jpg)', () => {
    const fake = Buffer.from('This is a text file posing as an image. Definitely not JPEG.');
    assert.throws(
      () => validateImageFile(fake, 'fake.jpg', 'image/jpeg'),
      /no soportado o inv[aá]lido/i
    );
  });

  await t.test('rejects SVG content', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
    assert.throws(
      () => validateImageFile(svg, 'vector.svg', 'image/svg+xml'),
      /SVG, HTML o scripts no est[aá] permitido/i
    );
  });

  await t.test('rejects HTML and script content', () => {
    const html = Buffer.from('<!doctype html><html><script>alert("xss")</script></html>');
    assert.throws(
      () => validateImageFile(html, 'page.html', 'text/html'),
      /SVG, HTML o scripts no est[aá] permitido/i
    );
  });

  await t.test('rejects XML declaration', () => {
    const xml = Buffer.from('<?xml version="1.0"?><data>test</data>');
    assert.throws(
      () => validateImageFile(xml, 'doc.xml', 'text/xml'),
      /SVG, HTML o scripts no est[aá] permitido/i
    );
  });

  await t.test('rejects extension mismatch (JPEG buffer named .png)', () => {
    assert.throws(
      () => validateImageFile(VALID_JPEG, 'mismatched.png', 'image/jpeg'),
      /no coincide con el formato real/i
    );
  });

  await t.test('rejects executable extension (.exe) with valid JPEG bytes', () => {
    assert.throws(
      () => validateImageFile(VALID_JPEG, 'malicious.exe', 'image/jpeg'),
      /no coincide con el formato real/i
    );
  });

  await t.test('rejects missing file extension', () => {
    assert.throws(
      () => validateImageFile(VALID_JPEG, 'no_extension', 'image/jpeg'),
      /debe incluir una extensi[oó]n v[aá]lida/i
    );
  });

  await t.test('rejects declared MIME mismatch (declared image/png but buffer is JPEG)', () => {
    assert.throws(
      () => validateImageFile(VALID_JPEG, 'photo.jpg', 'image/png'),
      /Discrepancia entre el tipo MIME declarado/i
    );
  });
});
