/**
 * Algoritmo unificado de análisis SEO (estilo Yoast / RankMath) para Tours y Blogs
 */
export function analyzeSeo({
  title = '',
  metaTitle = '',
  metaDescription = '',
  slug = '',
  focusKeyphrase = '',
}: {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  focusKeyphrase?: string;
}) {
  let score = 0;
  const results: { text: string; type: 'good' | 'bad' }[] = [];
  const keyphrase = focusKeyphrase || title;

  if (!keyphrase.trim()) {
    return {
      level: 'Pendiente',
      status: 'Sin clave',
      color: 'text-slate-400',
      badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
      results: [{ text: 'Ingresa palabras clave para activar el análisis SEO', type: 'bad' as const }]
    };
  }

  const STOP_WORDS = new Set(['tour', 'tours', 'de', 'del', 'el', 'la', 'los', 'las', 'en', 'para', 'por', 'un', 'una', 'y', 'a', 'con', 'dia', 'dias', 'full', 'day', 'guia']);

  const normalizeText = (text: string) => 
    text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '');

  const keyphraseNormalized = normalizeText(keyphrase);
  const keyphraseTokens = keyphraseNormalized.split(/\s+/).filter(t => t.length > 0);
  const coreKeyTokens = keyphraseTokens.filter(t => !STOP_WORDS.has(t) && t.length > 1);
  const targetTokens = coreKeyTokens.length > 0 ? coreKeyTokens : keyphraseTokens;

  const titleNormalized = normalizeText(title);
  const descNormalized = normalizeText(metaDescription);
  const slugNormalized = normalizeText(slug);

  // 1. Análisis en el Título
  const titleMatchCount = targetTokens.filter(t => titleNormalized.includes(t)).length;
  const isTitleMatched = targetTokens.length > 0 && titleMatchCount >= Math.ceil(targetTokens.length * 0.7);

  if (isTitleMatched) {
    score += 25;
    results.push({ text: 'Frase clave encontrada en el título principal', type: 'good' });
  } else {
    results.push({ text: 'La frase clave no aparece claramente en el título', type: 'bad' });
  }

  // 2. Longitud del Título SEO
  const displayTitle = metaTitle.trim() || title.trim();
  if (displayTitle.length >= 35 && displayTitle.length <= 65) {
    score += 25;
    results.push({ text: `Longitud del título SEO adecuada (${displayTitle.length} caracteres)`, type: 'good' });
  } else if (displayTitle.length > 0) {
    results.push({ text: `Título SEO fuera de rango óptimo (${displayTitle.length}/60 car.)`, type: 'bad' });
  } else {
    results.push({ text: 'Falta configurar el título SEO', type: 'bad' });
  }

  // 3. Meta Descripción
  const descMatchCount = targetTokens.filter(t => descNormalized.includes(t)).length;
  const isDescMatched = targetTokens.length > 0 && descMatchCount >= Math.ceil(targetTokens.length * 0.5);

  if (metaDescription.length >= 80 && metaDescription.length <= 160 && isDescMatched) {
    score += 25;
    results.push({ text: 'Meta descripción con longitud óptima y palabras clave', type: 'good' });
  } else if (metaDescription.length > 0) {
    score += 10;
    results.push({ text: 'Mejora la meta descripción incluyendo las palabras clave', type: 'bad' });
  } else {
    results.push({ text: 'No has agregado una meta descripción', type: 'bad' });
  }

  // 4. URL / Slug
  const slugMatchCount = targetTokens.filter(t => slugNormalized.includes(t)).length;
  if (targetTokens.length > 0 && slugMatchCount >= Math.ceil(targetTokens.length * 0.5)) {
    score += 25;
    results.push({ text: 'URL / Slug amigable con la palabra clave', type: 'good' });
  } else {
    results.push({ text: 'El slug no contiene los términos clave principales', type: 'bad' });
  }

  if (score >= 75) {
    return { level: 'Bueno', status: 'Optimizado', color: 'text-emerald-600', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200', results };
  } else if (score >= 45) {
    return { level: 'Aceptable', status: 'Mejorable', color: 'text-amber-600', badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200', results };
  } else {
    return { level: 'Pobre', status: 'Necesita trabajo', color: 'text-rose-600', badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200', results };
  }
}
