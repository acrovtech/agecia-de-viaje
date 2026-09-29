import { describe, expect, it } from 'vitest';
import { normalizeHost } from './host-normalizer';

describe('Authoritative Host Normalizer', () => {
  describe('Valid hosts', () => {
    it('normalizes uppercase hostnames to lowercase', () => {
      expect(normalizeHost('CUSCO.Example.com')).toBe('cusco.example.com');
      expect(normalizeHost('INCA-BOUND.COM')).toBe('inca-bound.com');
    });

    it('trims leading and trailing whitespace', () => {
      expect(normalizeHost('   cusco.example.com   ')).toBe('cusco.example.com');
    });

    it('strips safe HTTP / HTTPS ports', () => {
      expect(normalizeHost('CUSCO.Example.com:443')).toBe('cusco.example.com');
      expect(normalizeHost('cusco.example.com:80')).toBe('cusco.example.com');
      expect(normalizeHost('localhost:3000')).toBe('localhost');
      expect(normalizeHost('127.0.0.1:8080')).toBe('127.0.0.1');
    });

    it('strips a trailing FQDN dot', () => {
      expect(normalizeHost('cusco.example.com.')).toBe('cusco.example.com');
      expect(normalizeHost('CUSCO.EXAMPLE.COM.:443')).toBe('cusco.example.com');
    });

    it('handles IPv6 literals with and without port', () => {
      expect(normalizeHost('[::1]')).toBe('[::1]');
      expect(normalizeHost('[::1]:3000')).toBe('[::1]');
      expect(normalizeHost('[2001:db8::1]:8080')).toBe('[2001:db8::1]');
    });

    it('canonicalizes internationalized domain names (IDN / Punycode)', () => {
      expect(normalizeHost('mañana.com')).toBe('xn--maana-pta.com');
      expect(normalizeHost('xn--maana-pta.com')).toBe('xn--maana-pta.com');
    });

    it('handles platform subdomains and multi-level subdomains', () => {
      expect(normalizeHost('inca.travel.example.com')).toBe('inca.travel.example.com');
      expect(normalizeHost('agency-123.platform.example')).toBe('agency-123.platform.example');
    });
  });

  describe('Security rejections (malformed / spoofing / injection)', () => {
    it('rejects multiple-host header injection (commas)', () => {
      expect(normalizeHost('evil.com, trusted.com')).toBeNull();
      expect(normalizeHost('evil.com,trusted.com')).toBeNull();
    });

    it('rejects whitespace inside the host', () => {
      expect(normalizeHost('evil .com')).toBeNull();
      expect(normalizeHost('evil\t.com')).toBeNull();
      expect(normalizeHost('evil\n.com')).toBeNull();
    });

    it('rejects control characters', () => {
      expect(normalizeHost('evil\x00.com')).toBeNull();
      expect(normalizeHost('evil\x1F.com')).toBeNull();
      expect(normalizeHost('evil\x7F.com')).toBeNull();
    });

    it('rejects URLs with schemes', () => {
      expect(normalizeHost('https://trusted.com')).toBeNull();
      expect(normalizeHost('http://trusted.com')).toBeNull();
      expect(normalizeHost('ftp://trusted.com')).toBeNull();
      expect(normalizeHost('//trusted.com')).toBeNull();
    });

    it('rejects URLs with paths or query strings', () => {
      expect(normalizeHost('trusted.com/path')).toBeNull();
      expect(normalizeHost('trusted.com/')).toBeNull();
      expect(normalizeHost('trusted.com?query=1')).toBeNull();
    });

    it('rejects userinfo injection', () => {
      expect(normalizeHost('user@trusted.com')).toBeNull();
      expect(normalizeHost('admin:pass@trusted.com')).toBeNull();
    });

    it('rejects empty or whitespace-only inputs', () => {
      expect(normalizeHost('')).toBeNull();
      expect(normalizeHost('   ')).toBeNull();
      expect(normalizeHost(null)).toBeNull();
      expect(normalizeHost(undefined)).toBeNull();
      expect(normalizeHost(123)).toBeNull();
    });

    it('rejects hostnames exceeding RFC 1035 max length (253 chars)', () => {
      const longHost = 'a'.repeat(250) + '.com'; // > 253
      expect(normalizeHost(longHost)).toBeNull();
    });

    it('rejects labels exceeding 63 characters', () => {
      const longLabel = 'a'.repeat(64) + '.com';
      expect(normalizeHost(longLabel)).toBeNull();
    });

    it('rejects labels starting or ending with a hyphen', () => {
      expect(normalizeHost('-bad.com')).toBeNull();
      expect(normalizeHost('bad-.com')).toBeNull();
      expect(normalizeHost('sub.-bad.com')).toBeNull();
    });

    it('rejects consecutive dots or empty labels', () => {
      expect(normalizeHost('a..b.com')).toBeNull();
      expect(normalizeHost('..com')).toBeNull();
      expect(normalizeHost('.')).toBeNull();
    });

    it('rejects invalid port numbers', () => {
      expect(normalizeHost('example.com:0')).toBeNull();
      expect(normalizeHost('example.com:70000')).toBeNull();
      expect(normalizeHost('example.com:abc')).toBeNull();
      expect(normalizeHost('example.com:')).toBeNull();
    });
  });
});
