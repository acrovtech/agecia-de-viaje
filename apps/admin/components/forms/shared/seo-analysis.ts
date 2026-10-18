/**
 * Motor determinista de Diagnóstico SEO para Tours
 * Evalúa el contenido real introducido sin fabricar métricas ni prometer rankings garantizados.
 */

export interface SeoAnalysisInput {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  focusKeyphrase?: string;
  description?: string;
  itinerariesCount?: number;
  faqsCount?: number;
  imagesWithAltCount?: number;
  totalImagesCount?: number;
}

export interface SeoCheckResult {
  text: string;
  type: 'good' | 'bad' | 'warning';
  category?: 'content' | 'metadata' | 'snippets';
}

export interface SeoAnalysisOutput {
  label: string; // 'Diagnóstico SEO' | 'Salud SEO'
  score: number;
  level: 'Excelente' | 'Aceptable' | 'Requiere atención' | 'Pendiente';
  status: string;
  color: string;
  badgeClass: string;
  results: SeoCheckResult[];
}

const STOP_WORDS = new Set([
  'tour', 'tours', 'de', 'del', 'el', 'la', 'los', 'las', 'en', 'para',
  'por', 'un', 'una', 'y', 'a', 'con', 'dia', 'dias', 'full', 'day', 'guia',
]);

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '');

export function analyzeSeo({
  title = '',
  metaTitle = '',
  metaDescription = '',
  slug = '',
  focusKeyphrase = '',
  description = '',
  itinerariesCount = 0,
  faqsCount = 0,
  imagesWithAltCount = 0,
  totalImagesCount = 0,
}: SeoAnalysisInput): SeoAnalysisOutput {
  const results: SeoCheckResult[] = [];
  let score = 0;
  const maxPossibleScore = 100;

  const keyphrase = focusKeyphrase.trim();
  const titleClean = title.trim();
  const descClean = description.trim();
  const metaDescClean = metaDescription.trim();
  const slugClean = slug.trim();

  // 1. Frase Clave Objetivo
  if (!keyphrase) {
    results.push({
      text: 'Define una frase clave objetivo para orientar el contenido y la búsqueda',
      type: 'bad',
      category: 'metadata',
    });
  } else {
    score += 10;
    results.push({
      text: `Frase clave definida: "${keyphrase}"`,
      type: 'good',
      category: 'metadata',
    });
  }

  const keyphraseNormalized = normalizeText(keyphrase || titleClean);
  const keyphraseTokens = keyphraseNormalized.split(/\s+/).filter((t) => t.length > 0);
  const coreKeyTokens = keyphraseTokens.filter((t) => !STOP_WORDS.has(t) && t.length > 1);
  const targetTokens = coreKeyTokens.length > 0 ? coreKeyTokens : keyphraseTokens;

  const titleNormalized = normalizeText(titleClean);
  const descNormalized = normalizeText(descClean);
  const metaDescNormalized = normalizeText(metaDescClean);
  const slugNormalized = normalizeText(slugClean);

  // 2. Título Principal
  if (!titleClean) {
    results.push({ text: 'Falta ingresar el título del tour', type: 'bad', category: 'content' });
  } else if (titleClean.length < 15) {
    score += 5;
    results.push({ text: 'El título es muy breve (se recomiendan al menos 15 caracteres)', type: 'warning', category: 'content' });
  } else {
    score += 15;
    results.push({ text: 'Título con longitud adecuada', type: 'good', category: 'content' });
  }

  // 3. Frase Clave en el Título
  if (keyphrase && targetTokens.length > 0) {
    const titleMatchCount = targetTokens.filter((t) => titleNormalized.includes(t)).length;
    if (titleMatchCount >= Math.ceil(targetTokens.length * 0.7)) {
      score += 10;
      results.push({ text: 'La frase clave aparece de forma natural en el título', type: 'good', category: 'content' });
    } else {
      results.push({ text: 'Incluye la frase clave o sus términos principales en el título', type: 'bad', category: 'content' });
    }
  }

  // 4. Título SEO (Meta Title)
  const effectiveMetaTitle = metaTitle.trim() || titleClean;
  if (effectiveMetaTitle.length >= 35 && effectiveMetaTitle.length <= 65) {
    score += 10;
    results.push({ text: `Título SEO con extensión óptima (${effectiveMetaTitle.length}/60 caracteres)`, type: 'good', category: 'metadata' });
  } else if (effectiveMetaTitle.length > 65) {
    score += 5;
    results.push({ text: `Título SEO demasiado extenso (${effectiveMetaTitle.length} car.), los buscadores podrían truncarlo`, type: 'warning', category: 'metadata' });
  } else if (effectiveMetaTitle.length > 0) {
    score += 5;
    results.push({ text: `Título SEO breve (${effectiveMetaTitle.length} car.), amplíalo hasta ~50-60 car.`, type: 'warning', category: 'metadata' });
  }

  // 5. Meta Descripción
  if (!metaDescClean) {
    results.push({ text: 'No se ha redactado una meta descripción para buscadores', type: 'bad', category: 'metadata' });
  } else if (metaDescClean.length >= 80 && metaDescClean.length <= 160) {
    score += 15;
    const descMatchCount = targetTokens.filter((t) => metaDescNormalized.includes(t)).length;
    if (keyphrase && descMatchCount >= Math.ceil(targetTokens.length * 0.5)) {
      results.push({ text: 'Meta descripción con longitud óptima e incluye términos clave', type: 'good', category: 'metadata' });
    } else {
      results.push({ text: `Meta descripción con longitud adecuada (${metaDescClean.length} caracteres)`, type: 'good', category: 'metadata' });
    }
  } else if (metaDescClean.length > 160) {
    score += 5;
    results.push({ text: `Meta descripción supera 160 caracteres (${metaDescClean.length} car.), será recortada en resultados`, type: 'warning', category: 'metadata' });
  } else {
    score += 5;
    results.push({ text: `Meta descripción muy corta (${metaDescClean.length} car.), se recomiendan entre 120 y 160 car.`, type: 'warning', category: 'metadata' });
  }

  // 6. Descripción Sustantiva de Contenido
  if (descClean.length >= 300) {
    score += 15;
    results.push({ text: `Descripción amplia y detallada (${descClean.length} caracteres)`, type: 'good', category: 'content' });
  } else if (descClean.length >= 100) {
    score += 8;
    results.push({ text: `Descripción básica (${descClean.length} car.), añade más detalles del servicio para mejorar comprensión`, type: 'warning', category: 'content' });
  } else if (descClean.length > 0) {
    score += 3;
    results.push({ text: 'Descripción muy escasa, describe los atractivos y logística del tour', type: 'bad', category: 'content' });
  } else {
    results.push({ text: 'Falta descripción general del tour', type: 'bad', category: 'content' });
  }

  // 7. Frase clave en el Slug / URL
  if (slugClean) {
    if (keyphrase && targetTokens.length > 0) {
      const slugMatchCount = targetTokens.filter((t) => slugNormalized.includes(t)).length;
      if (slugMatchCount >= Math.ceil(targetTokens.length * 0.5)) {
        score += 10;
        results.push({ text: 'El slug es legible e incluye términos clave', type: 'good', category: 'snippets' });
      } else {
        score += 5;
        results.push({ text: 'El slug no contiene los términos clave principales', type: 'warning', category: 'snippets' });
      }
    } else {
      score += 5;
      results.push({ text: `Slug legible configurado: /${slugClean}`, type: 'good', category: 'snippets' });
    }
  } else {
    results.push({ text: 'Falta definir un slug legible para la URL', type: 'bad', category: 'snippets' });
  }

  // 8. Contenido Estructurado: Itinerario y FAQs
  if (itinerariesCount > 0) {
    score += 10;
    results.push({ text: `Itinerario programado (${itinerariesCount} día(s)/paso(s))`, type: 'good', category: 'content' });
  } else {
    results.push({ text: 'Añade al menos un paso o día de itinerario para completar la ficha', type: 'warning', category: 'content' });
  }

  if (faqsCount > 0) {
    score += 5;
    results.push({ text: `Preguntas frecuentes añadidas (${faqsCount} FAQs)`, type: 'good', category: 'content' });
  }

  // 9. Cobertura de Texto Alternativo (ALT) en Imágenes
  if (totalImagesCount > 0) {
    if (imagesWithAltCount >= totalImagesCount) {
      score += 5;
      results.push({ text: 'Todas las imágenes cuentan con texto alternativo (ALT)', type: 'good', category: 'content' });
    } else {
      results.push({ text: `${totalImagesCount - imagesWithAltCount} imagen(es) carecen de texto descriptivo ALT`, type: 'warning', category: 'content' });
    }
  }

  // Deterministic Level
  const finalScore = Math.min(maxPossibleScore, Math.max(0, score));

  if (finalScore >= 75) {
    return {
      label: 'Diagnóstico SEO',
      score: finalScore,
      level: 'Excelente',
      status: 'Salud SEO Óptima',
      color: 'text-emerald-600',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      results,
    };
  } else if (finalScore >= 45) {
    return {
      label: 'Diagnóstico SEO',
      score: finalScore,
      level: 'Aceptable',
      status: 'Salud SEO Mejorable',
      color: 'text-amber-600',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      results,
    };
  } else {
    return {
      label: 'Diagnóstico SEO',
      score: finalScore,
      level: 'Requiere atención',
      status: 'Salud SEO Incompleta',
      color: 'text-rose-600',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
      results,
    };
  }
}
