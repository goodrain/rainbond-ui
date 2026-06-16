/**
 * Tests for domain validation regex in RouteDrawerHttp component.
 * Validates that domain names starting with numbers are accepted.
 */

// Domain validation regex from RouteDrawerHttp/index.js
const domainRegex = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

describe('Domain validation regex', () => {
  // Valid domain patterns
  const validDomains = [
    'example.com',
    '*.example.com',
    'sub.example.com',
    'a.example.com',
    '123.example.com',           // Domain starting with number
    '1.example.com',             // Single digit start
    '12345.example.com',         // Multiple digits start
    'test123.example.com',       // Alphanumeric start
    '123test.example.com',       // Number then letters
    'a1b2c3.example.com',       // Mixed alphanumeric
    'my-app.example.com',        // Hyphenated
    'app-123.example.com',       // Hyphen with numbers
    'deep.sub.domain.example.com', // Multiple subdomains
    '1.2.3.example.com',         // Multiple numeric subdomains
    'example.co.uk',             // Multiple TLD
    '123.example.co.uk',         // Numeric start with multiple TLD
  ];

  // Invalid domain patterns
  const invalidDomains = [
    '',                          // Empty
    'example',                   // No TLD
    '.example.com',              // Starts with dot
    '-example.com',              // Starts with hyphen
    '*example.com',              // Wildcard without dot
    'example..com',              // Double dot
    'example.com.',              // Ends with dot
    'example.com:8080',          // Port included
    'http://example.com',        // Protocol included
    'example com',               // Space
    'exam ple.com',              // Space in middle
  ];

  test('should accept valid domains', () => {
    validDomains.forEach(domain => {
      expect(domainRegex.test(domain)).toBe(true);
    });
  });

  test('should reject invalid domains', () => {
    invalidDomains.forEach(domain => {
      expect(domainRegex.test(domain)).toBe(false);
    });
  });

  test('should accept domain names starting with numbers (RFC 952/1123)', () => {
    // This is the key fix for issue #2481
    const numericStartDomains = [
      '1.com',
      '12.example.com',
      '123.example.com',
      '1234567890.example.com',
      '1a.example.com',
      '123abc.example.com',
      '999.999.example.com',
    ];

    numericStartDomains.forEach(domain => {
      expect(domainRegex.test(domain)).toBe(true);
    });
  });

  test('should accept wildcard domains', () => {
    const wildcardDomains = [
      '*.example.com',
      '*.sub.example.com',
      '*.123.example.com',        // Wildcard with numeric subdomain
    ];

    wildcardDomains.forEach(domain => {
      expect(domainRegex.test(domain)).toBe(true);
    });
  });

  test('should reject domains with invalid characters', () => {
    const invalidCharDomains = [
      'exam ple.com',            // Space
      'exam@ple.com',            // @ symbol
      'exam_ple.com',            // Underscore
      'exam+ple.com',            // Plus
      'exam!ple.com',            // Exclamation
    ];

    invalidCharDomains.forEach(domain => {
      expect(domainRegex.test(domain)).toBe(false);
    });
  });
});
