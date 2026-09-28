import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { POST } from './route';

describe('Next.js IPN Proxy Route (Actual Route Implementation)', () => {
  const originalFetch = global.fetch;
  const mockApiUrl = 'http://127.0.0.1:3002';

  beforeEach(() => {
    process.env.API_INTERNAL_URL = mockApiUrl;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('preserva el valor de kr-answer y reenvía kr-hash para peticiones form-urlencoded', async () => {
    const rawAnswer = JSON.stringify({
      orderStatus: 'PAID',
      orderDetails: { orderId: 'IB-ORDER123', orderTotalAmount: 15000, orderCurrency: 'USD' },
      transactions: [{ uuid: 'tx-uuid-12345' }],
    });
    const secret = 'izipay_test_secret_key';
    const computedHash = crypto.createHmac('sha256', secret).update(rawAnswer).digest('hex');

    const formBody = new URLSearchParams({
      'kr-answer': rawAnswer,
      'kr-hash': computedHash,
    }).toString();

    let capturedUrl: string | undefined;
    let capturedOptions: RequestInit | undefined;

    global.fetch = vi.fn().mockImplementation(async (url: string, options: RequestInit) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          reservationCode: 'IB-ORDER123',
          status: 'PAID',
          paidMinor: 15000,
        }),
      };
    });

    const request = new Request('http://localhost:3000/api/payments/izipay/ipn', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': String(Buffer.byteLength(formBody)),
      },
      body: formBody,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const resJson = await response.json();
    expect(resJson.success).toBe(true);
    expect(resJson.status).toBe('PAID');

    // 1. Probar que llama al endpoint NestJS de producción
    expect(capturedUrl).toBe(`${mockApiUrl}/v1/payments/izipay/ipn`);

    // 2. Probar que kr-answer exacto es preservado
    const forwardedBody = JSON.parse(capturedOptions?.body as string);
    expect(forwardedBody['kr-answer']).toBe(rawAnswer);

    // 3. Probar que kr-hash es reenviado idénticamente
    expect(forwardedBody['kr-hash']).toBe(computedHash);
    expect((capturedOptions?.headers as any)['kr-hash']).toBe(computedHash);
  });

  it('propaga el fallo HTTP 400 cuando la firma es rechazada por el backend central', async () => {
    const rawAnswer = JSON.stringify({ orderStatus: 'PAID' });
    const forgedHash = 'deadbeefbadhash1234567890abcdef';
    const formBody = new URLSearchParams({
      'kr-answer': rawAnswer,
      'kr-hash': forgedHash,
    }).toString();

    global.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          statusCode: 400,
          message: 'Firma HMAC del webhook inválida',
        }),
      };
    });

    const request = new Request('http://localhost:3000/api/payments/izipay/ipn', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const resJson = await response.json();
    expect(resJson.message).toBe('Firma HMAC del webhook inválida');
  });

  it('procesa correctamente payloads en formato application/json', async () => {
    const rawAnswer = JSON.stringify({
      orderStatus: 'PAID',
      orderDetails: { orderId: 'IB-JSON123', orderTotalAmount: 20000, orderCurrency: 'USD' },
      transactions: [{ uuid: 'tx-uuid-json' }],
    });
    const secret = 'izipay_test_secret_key';
    const computedHash = crypto.createHmac('sha256', secret).update(rawAnswer).digest('hex');

    const jsonBody = JSON.stringify({
      'kr-answer': rawAnswer,
      'kr-hash': computedHash,
    });

    let capturedUrl: string | undefined;
    let capturedOptions: RequestInit | undefined;

    global.fetch = vi.fn().mockImplementation(async (url: string, options: RequestInit) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          reservationCode: 'IB-JSON123',
          status: 'PAID',
          paidMinor: 20000,
        }),
      };
    });

    const request = new Request('http://localhost:3000/api/payments/izipay/ipn', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: jsonBody,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const resJson = await response.json();
    expect(resJson.success).toBe(true);
    expect(resJson.status).toBe('PAID');
    expect(capturedUrl).toBe(`${mockApiUrl}/v1/payments/izipay/ipn`);

    const forwardedBody = JSON.parse(capturedOptions?.body as string);
    expect(forwardedBody['kr-answer']).toBe(rawAnswer);
    expect(forwardedBody['kr-hash']).toBe(computedHash);
  });

  it('rechaza con HTTP 400 cuando el payload JSON está malformado', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const malformedJson = '{"kr-answer": {"invalid": ';

    const request = new Request('http://localhost:3000/api/payments/izipay/ipn', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: malformedJson,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const resJson = await response.json();
    expect(resJson.error).toBe('Payload de webhook malformado');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rechaza con HTTP 413 payloads que exceden el límite de 64KB sin Content-Length header', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const hugePayload = JSON.stringify({
      'kr-answer': 'Z'.repeat(70000),
      'kr-hash': 'fakehash',
    });

    // Request sin encabezado content-length
    const request = new Request('http://localhost:3000/api/payments/izipay/ipn', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: hugePayload,
    });

    const response = await POST(request);
    expect(response.status).toBe(413);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
