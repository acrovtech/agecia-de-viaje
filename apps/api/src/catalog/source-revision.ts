import { createHash } from 'node:crypto';

export interface SourceTranslatableContent {
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  itineraries?: Array<{ title?: string | null; content?: string | null }> | null;
  inclusions?: Array<{ content?: string | null }> | null;
  exclusions?: Array<{ content?: string | null }> | null;
  recommendations?: Array<{ content?: string | null }> | null;
  faqs?: Array<{ question?: string | null; answer?: string | null }> | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyphrase?: string | null;
}

export function computeSourceRevision(data: SourceTranslatableContent): string {
  const canonical = {
    title: data.title?.trim() || '',
    slug: data.slug?.trim() || '',
    description: data.description?.trim() || '',
    itineraries: (data.itineraries || []).map((i) => ({
      title: i.title?.trim() || '',
      content: i.content?.trim() || '',
    })),
    inclusions: (data.inclusions || []).map((i) => ({
      content: i.content?.trim() || '',
    })),
    exclusions: (data.exclusions || []).map((i) => ({
      content: i.content?.trim() || '',
    })),
    recommendations: (data.recommendations || []).map((i) => ({
      content: i.content?.trim() || '',
    })),
    faqs: (data.faqs || []).map((f) => ({
      question: f.question?.trim() || '',
      answer: f.answer?.trim() || '',
    })),
    metaTitle: data.metaTitle?.trim() || '',
    metaDescription: data.metaDescription?.trim() || '',
    focusKeyphrase: data.focusKeyphrase?.trim() || '',
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
