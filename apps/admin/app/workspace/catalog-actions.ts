'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { centralRequest, centralSession, CentralApiError } from '../../lib/central-api';
import { canEditCatalog, catalogDetailSchema } from '../../lib/catalog-editor';

export async function saveCatalogAction(_previous: { error: string } | null, form: FormData): Promise<{ error: string }> {
  const kind = form.get('kind');
  if (kind !== 'tours' && kind !== 'transfers') return { error: 'Tipo de servicio inválido.' };
  const id = form.get('id');
  if (typeof id !== 'string' || (id && !/^[a-zA-Z0-9_-]{1,128}$/.test(id))) return { error: 'Servicio inválido.' };
  try {
    const { token, identity } = await centralSession();
    if (!canEditCatalog(identity.role, kind)) return { error: 'Tu rol no permite modificar estos servicios.' };
    const str = (key: string) => { const value = form.get(key); return typeof value === 'string' ? value.trim() : ''; };
    const shared = form.get('hasSharedService') === 'on';
    const price = str('sharedPrice');
    if (shared && (!price || !/^\d+(\.\d{1,2})?$/.test(price))) return { error: 'Ingresa una tarifa positiva con hasta dos decimales.' };
    const common = {
      title: str('title'), slug: str('slug'), duration: str('duration'),
      hasSharedService: shared, sharedPrice: shared ? Number(price) : null,
    };
    const body = kind === 'tours' ? {
      ...common, description: str('description'), bannerImage: str('bannerImage'),
      cardImage: str('cardImage'), region: str('region') || null,
    } : {
      ...common, description: str('description') || null, bannerImage: str('bannerImage') || null,
      origin: str('origin'), destination: str('destination'), tripType: str('tripType'), isActive: form.get('isActive') === 'on',
    };
    const route = `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/${kind}${id ? `/${encodeURIComponent(id)}` : ''}`;
    const saved = await centralRequest(route, token, id ? { ...body, expectedUpdatedAt: str('updatedAt') } : body, id ? 'PUT' : 'POST');
    catalogDetailSchema.parse(saved);
  } catch (error) {
    const status = error instanceof CentralApiError ? error.status : 503;
    const errors: Record<number, string> = {
      400: 'Revisa los campos, las imágenes y la tarifa. Debe existir al menos una modalidad disponible.',
      401: 'Tu sesión expiró. Inicia sesión nuevamente antes de guardar.',
      403: 'Ya no tienes permiso para modificar este servicio.',
      404: 'El servicio no está disponible en tu agencia.',
      409: 'No se guardó: el enlace ya está en uso o alguien modificó este servicio. Recarga la ficha antes de volver a editar.',
    };
    return { error: errors[status] ?? 'No pudimos confirmar el guardado. Revisa el catálogo antes de reintentar.' };
  }
  revalidatePath('/workspace');
  revalidatePath(`/catalog/${kind}`);
  redirect(`/catalog/${kind}?saved=1`);
}

export async function saveTourAction(
  _previous: { error?: string } | null,
  form: FormData,
): Promise<{ error?: string }> {
  const str = (key: string) => {
    const value = form.get(key);
    return typeof value === 'string' ? value.trim() : '';
  };
  const id = str('id') || undefined;
  const updatedAt = str('updatedAt');

  try {
    const { token, identity } = await centralSession();
    if (!canEditCatalog(identity.role, 'tours')) {
      return { error: 'Tu rol no permite modificar tours.' };
    }

    const title = str('title');
    if (!title || title.length < 2) return { error: 'El título del tour es obligatorio (mínimo 2 caracteres).' };

    let slug = str('slug').toLowerCase();
    if (!slug) {
      slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return { error: 'El slug solo debe contener letras minúsculas, números y guiones.' };
    }

    const description = str('description') || null;
    const duration = str('duration') || null;
    const region = str('region') || null;
    let menuGroup = str('menuGroup') || null;
    if (menuGroup === 'none') menuGroup = null;

    const rawDestType = str('destinationType');
    const destinationType = rawDestType === 'Internacional' ? 'Internacional' : 'Nacional';

    const isFeatured = form.get('isFeatured') === 'true' || form.get('isFeatured') === 'Activo';
    const altitude = str('altitude') ? `${str('altitude')} m s. n. m.` : null;
    const groupSize = str('groupSize') || null;
    const difficulty = str('difficulty') || null;
    const mapImage = str('mapImage') || null;

    const parseStringValue = (fieldName: string): string | null => {
      const urlInput = form.get(`${fieldName}_url`);
      if (typeof urlInput === 'string' && urlInput.trim()) return urlInput.trim();
      const val = form.get(fieldName);
      if (typeof val === 'string' && val.trim()) return val.trim();
      return null;
    };

    const bannerImage = parseStringValue('bannerImage');
    const cardImage = parseStringValue('cardImage');

    const hasSharedService = form.get('hasSharedService') === 'on' || form.get('hasSharedService') === 'true';
    const sharedPriceRaw = str('sharedPrice');
    const sharedPrice = (hasSharedService && sharedPriceRaw) ? parseFloat(sharedPriceRaw) : null;
    if (hasSharedService && (sharedPrice === null || isNaN(sharedPrice) || sharedPrice <= 0)) {
      return { error: 'Ingresa un precio grupal válido mayor a 0.' };
    }

    const hasPrivateService = form.get('hasPrivateService') === 'on' || form.get('hasPrivateService') === 'true';

    const metaTitle = str('metaTitle') || null;
    const metaDescription = str('metaDescription') || null;
    const focusKeyphrase = str('focusKeyphrase') || null;

    const baseTourPayload = {
      title,
      slug,
      description,
      duration,
      region,
      menuGroup,
      destinationType,
      isFeatured,
      altitude,
      groupSize,
      difficulty,
      mapImage,
      bannerImage,
      cardImage,
      hasSharedService,
      sharedPrice,
      metaTitle,
      metaDescription,
      focusKeyphrase,
    };

    const galleryImage1 = parseStringValue('galleryImage_1');
    const galleryImage2 = parseStringValue('galleryImage_2');
    const galleryImage3 = parseStringValue('galleryImage_3');
    const galleryImage4 = parseStringValue('galleryImage_4');
    const galleryUrls = [
      { url: galleryImage1, alt: parseStringValue('galleryAlt_1') },
      { url: galleryImage2, alt: parseStringValue('galleryAlt_2') },
      { url: galleryImage3, alt: parseStringValue('galleryAlt_3') },
      { url: galleryImage4, alt: parseStringValue('galleryAlt_4') },
    ].filter((item): item is { url: string; alt: string | null } => Boolean(item.url));
    const images = galleryUrls.map((item, i) => ({ url: item.url, alt: item.alt || null, order: i }));

    const itineraries: { title: string; content: string }[] = [];
    const itineraryCount = parseInt(str('itineraryCount')) || 50;
    for (let i = 0; i < itineraryCount; i++) {
      const dayTitle = str(`itinerary_title_${i}`);
      const dayContent = str(`itinerary_content_${i}`);
      if (dayTitle && dayContent) {
        itineraries.push({ title: dayTitle, content: dayContent });
      } else if (dayTitle || dayContent) {
        return { error: 'Cada día del itinerario debe tener tanto título como contenido descriptivo.' };
      }
    }

    const inclusions = str('inclusions')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((content) => ({ content }));

    const exclusions = str('exclusions')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((content) => ({ content }));

    const recommendations = str('recommendations')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((content) => ({ content }));

    const faqs: { question: string; answer: string }[] = [];
    const faqsCount = parseInt(str('faqsCount')) || 50;
    for (let i = 0; i < faqsCount; i++) {
      const q = str(`faq_question_${i}`);
      const a = str(`faq_answer_${i}`);
      if (q && a) {
        faqs.push({ question: q, answer: a });
      } else if (q || a) {
        return { error: 'Cada pregunta frecuente debe tener tanto la pregunta como la respuesta.' };
      }
    }

    const privatePricing: { pax: number; price: number }[] = [];
    if (hasPrivateService) {
      const fixedPrivatePriceRaw = str('fixedPrivatePrice');
      const fixedPrice = fixedPrivatePriceRaw ? parseFloat(fixedPrivatePriceRaw) : null;
      if (fixedPrice !== null && !isNaN(fixedPrice) && fixedPrice > 0) {
        const gSize = parseInt(groupSize || '12', 10) || 12;
        for (let p = 1; p <= gSize; p++) {
          privatePricing.push({ pax: p, price: fixedPrice });
        }
      } else {
        for (const [key, val] of form.entries()) {
          if (key.startsWith('privatePrice_')) {
            const pax = parseInt(key.replace('privatePrice_', ''), 10);
            const price = parseFloat(typeof val === 'string' ? val : '');
            if (!isNaN(pax) && !isNaN(price) && price > 0) {
              privatePricing.push({ pax, price });
            }
          }
        }
      }
      privatePricing.sort((a, b) => a.pax - b.pax);
    }

    // Tenant Categories: filter out fake fallback IDs (Requirement 7)
    const rawCategories = form.getAll('categories').map(String);
    const singleCategory = str('category');
    const allCategoryInputs = [...rawCategories, singleCategory].filter(Boolean);

    const categoriesUrl = `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/categories`;
    const tenantCategoriesRes = await centralRequest(categoriesUrl, token).catch(() => ({ data: [] }));
    const tenantCategories = (tenantCategoriesRes as any)?.data || [];
    const tenantCategoryIds = new Set(tenantCategories.map((c: any) => c.id));

    const realCategoryIds = Array.from(new Set(allCategoryInputs)).filter(
      (catId) => tenantCategoryIds.has(catId),
    );

    const baseRoute = `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/tours`;
    const desiredPublished = form.get('status') === 'Active' || form.get('status') === 'Activo';

    if (!id) {
      // 1. POST base Tour
      const createdRes: any = await centralRequest(baseRoute, token, baseTourPayload, 'POST');
      const newId = createdRes.id;
      const newUpdatedAt = createdRes.updatedAt;

      // 2. PUT rich content
      const contentPayload = {
        expectedUpdatedAt: newUpdatedAt,
        hasPrivateService,
        categoryIds: realCategoryIds,
        images,
        itineraries,
        inclusions,
        exclusions,
        recommendations,
        faqs,
        privatePricing,
      };

      const contentRes: any = await centralRequest(`${baseRoute}/${encodeURIComponent(newId)}/content`, token, contentPayload, 'PUT');

      // 3. Separate publication if requested
      if (desiredPublished) {
        try {
          await centralRequest(
            `${baseRoute}/${encodeURIComponent(newId)}/publication`,
            token,
            { expectedUpdatedAt: contentRes.updatedAt, isPublished: true },
            'PUT',
          );
        } catch {
          return { error: 'El tour se guardó como borrador, pero no pudo publicarse. Revisa los campos obligatorios.' };
        }
      }
    } else {
      // 1. PUT base Tour with optimistic concurrency
      const updatePayload = {
        ...baseTourPayload,
        expectedUpdatedAt: updatedAt,
      };
      const updatedBase: any = await centralRequest(`${baseRoute}/${encodeURIComponent(id)}`, token, updatePayload, 'PUT');

      // 2. PUT rich content with returned updatedAt
      const contentPayload = {
        expectedUpdatedAt: updatedBase.updatedAt,
        hasPrivateService,
        categoryIds: realCategoryIds,
        images,
        itineraries,
        inclusions,
        exclusions,
        recommendations,
        faqs,
        privatePricing,
      };
      const updatedContent: any = await centralRequest(`${baseRoute}/${encodeURIComponent(id)}/content`, token, contentPayload, 'PUT');

      // 3. Publication orchestration: base/content writes reset isPublished to false in Central API.
      // Therefore, if desiredPublished is true, ALWAYS call publication endpoint with latest updatedAt.
      if (desiredPublished) {
        try {
          await centralRequest(
            `${baseRoute}/${encodeURIComponent(id)}/publication`,
            token,
            { expectedUpdatedAt: updatedContent.updatedAt, isPublished: true },
            'PUT',
          );
        } catch {
          return { error: 'Los cambios se guardaron como borrador, pero no pudo publicarse el tour. Revisa los campos obligatorios.' };
        }
      } else {
        // If user explicitly chose unpublished/Desactivado, unpublish if it was previously published
        const currentPublished = form.get('isPublished') === 'true';
        if (currentPublished) {
          try {
            await centralRequest(
              `${baseRoute}/${encodeURIComponent(id)}/publication`,
              token,
              { expectedUpdatedAt: updatedContent.updatedAt, isPublished: false },
              'PUT',
            );
          } catch {
            // Ignored if already unpublished
          }
        }
      }
    }
  } catch (error) {
    const status = error instanceof CentralApiError ? error.status : 503;
    const errors: Record<number, string> = {
      400: 'Revisa los campos requeridos, las imágenes y las tarifas del tour.',
      401: 'Tu sesión expiró. Inicia sesión nuevamente antes de guardar.',
      403: 'No tienes permiso para modificar tours en esta agencia.',
      404: 'El tour no fue encontrado.',
      409: 'No se guardó: el enlace ya está en uso o alguien modificó este tour. Recarga la ficha antes de volver a guardar.',
    };
    return { error: errors[status] ?? 'Error al procesar el tour en el API central. Intenta nuevamente.' };
  }

  revalidatePath('/workspace');
  revalidatePath('/catalog/tours');
  redirect('/catalog/tours?saved=1');
}

export async function deleteTourAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { token, identity } = await centralSession();
    if (!canEditCatalog(identity.role, 'tours')) {
      return { success: false, error: 'No tienes permiso para eliminar tours.' };
    }
    const route = `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/tours/${encodeURIComponent(id)}`;
    await centralRequest(route, token, undefined, 'DELETE');
    revalidatePath('/workspace');
    revalidatePath('/catalog/tours');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al eliminar el tour en el API central.' };
  }
}

export async function saveTourTranslationAction(
  _previous: { error?: string } | null,
  form: FormData,
): Promise<{ error?: string }> {
  const str = (key: string) => {
    const value = form.get(key);
    return typeof value === 'string' ? value.trim() : '';
  };

  const tourId = str('tourId');
  const locale = str('locale');
  const expectedUpdatedAt = str('expectedUpdatedAt') || null;
  const expectedSourceRevision = str('expectedSourceRevision');

  if (!tourId || !locale) {
    return { error: 'Identificador de tour e idioma requeridos.' };
  }
  if (!expectedSourceRevision) {
    return { error: 'Revisión del contenido base requerida. Recarga la página.' };
  }

  try {
    const { token, identity } = await centralSession();
    if (!canEditCatalog(identity.role, 'tours')) {
      return { error: 'Tu rol no permite modificar traducciones de tours.' };
    }

    const title = str('title');
    if (!title || title.length < 2) {
      return { error: 'El título traducido es obligatorio (mínimo 2 caracteres).' };
    }

    const slug = str('slug').toLowerCase();
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return { error: 'El enlace traducido (slug) es obligatorio y solo debe contener letras minúsculas, números y guiones.' };
    }

    const description = str('description') || null;
    const metaTitle = str('metaTitle') || null;
    const metaDescription = str('metaDescription') || null;
    const focusKeyphrase = str('focusKeyphrase') || null;

    const itineraries: { title: string; content: string }[] = [];
    const itineraryCount = parseInt(str('itineraryCount')) || 50;
    for (let i = 0; i < itineraryCount; i++) {
      const dayTitle = str(`itinerary_title_${i}`);
      const dayContent = str(`itinerary_content_${i}`);
      if (dayTitle && dayContent) {
        itineraries.push({ title: dayTitle, content: dayContent });
      } else if (dayTitle || dayContent) {
        return { error: 'Cada día del itinerario debe tener tanto título como contenido descriptivo.' };
      }
    }

    const inclusions = str('inclusions')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((content) => ({ content }));

    const exclusions = str('exclusions')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((content) => ({ content }));

    const recommendations = str('recommendations')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((content) => ({ content }));

    const faqs: { question: string; answer: string }[] = [];
    const faqsCount = parseInt(str('faqsCount')) || 50;
    for (let i = 0; i < faqsCount; i++) {
      const q = str(`faq_question_${i}`);
      const a = str(`faq_answer_${i}`);
      if (q && a) {
        faqs.push({ question: q, answer: a });
      } else if (q || a) {
        return { error: 'Cada pregunta frecuente debe tener tanto la pregunta como la respuesta.' };
      }
    }

    const payload = {
      expectedUpdatedAt,
      expectedSourceRevision,
      title,
      slug,
      description,
      itinerary: itineraries,
      inclusions,
      exclusions,
      recommendations,
      faqs,
      metaTitle,
      metaDescription,
      focusKeyphrase,
    };

    const route = `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/tours/${encodeURIComponent(tourId)}/translations/${encodeURIComponent(locale)}`;
    await centralRequest(route, token, payload, 'PUT');
  } catch (error) {
    if (error instanceof CentralApiError) {
      if (error.status === 409) {
        return { error: error.message || 'Esta traducción fue modificada por otro usuario. Recarga antes de guardar.' };
      }
      if (error.status === 403) {
        return { error: error.message || 'No tienes permiso o tu suscripción no permite este idioma.' };
      }
      if (error.status === 400) {
        return { error: error.message || 'Revisa los campos requeridos de la traducción y el formato del slug.' };
      }
    }
    return { error: 'Error al guardar la traducción en el API central.' };
  }

  revalidatePath('/workspace');
  revalidatePath('/catalog/tours');
  redirect(`/catalog/tours?edit=${encodeURIComponent(tourId)}&locale=${encodeURIComponent(locale)}&saved=1`);
}
