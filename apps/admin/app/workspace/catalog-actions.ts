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

    const description = str('description') || 'Descripción del tour.';
    const duration = str('duration') || '1 día';
    const region = str('region') || null;
    let menuGroup = str('menuGroup') || null;
    if (menuGroup === 'none') menuGroup = null;

    const rawDestType = str('destinationType');
    const destinationType = rawDestType === 'Internacional' ? 'Internacional' : 'Nacional';

    const isFeatured = form.get('isFeatured') === 'true' || form.get('isFeatured') === 'Activo';
    const altitude = str('altitude') ? `${str('altitude')} m s. n. m.` : null;
    const groupSize = str('groupSize') || null;
    const difficulty = str('difficulty') || 'Moderada';
    const mapImage = str('mapImage') || null;

    const parseStringValue = (fieldName: string, fallback = ''): string => {
      const urlInput = form.get(`${fieldName}_url`);
      if (typeof urlInput === 'string' && urlInput.trim()) return urlInput.trim();
      const val = form.get(fieldName);
      if (typeof val === 'string' && val.trim()) return val.trim();
      return fallback;
    };

    let bannerImage = parseStringValue('bannerImage');
    if (!bannerImage) bannerImage = '/tours/machu-picchu.webp';
    let cardImage = parseStringValue('cardImage');
    if (!cardImage) cardImage = bannerImage;

    const hasSharedService = form.get('hasSharedService') === 'on' || form.get('hasSharedService') === 'true';
    const sharedPriceRaw = str('sharedPrice');
    const sharedPrice = (hasSharedService && sharedPriceRaw) ? parseFloat(sharedPriceRaw) : null;
    if (hasSharedService && (sharedPrice === null || isNaN(sharedPrice) || sharedPrice <= 0)) {
      return { error: 'Ingresa un precio grupal válido mayor a 0.' };
    }

    const hasPrivateService = form.get('hasPrivateService') === 'on' || form.get('hasPrivateService') === 'true';

    const metaTitle = str('metaTitle') || `${title} - Agencia de Viajes`;
    const metaDescription = str('metaDescription') || (description.slice(0, 150));

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
    };

    const galleryImage1 = parseStringValue('galleryImage_1');
    const galleryImage2 = parseStringValue('galleryImage_2');
    const galleryImage3 = parseStringValue('galleryImage_3');
    const galleryImage4 = parseStringValue('galleryImage_4');
    const galleryUrls = [galleryImage1, galleryImage2, galleryImage3, galleryImage4].filter(Boolean);
    const images = galleryUrls.map((url, i) => ({ url, alt: `Foto ${i + 1}`, order: i }));

    const itineraries: { title: string; content: string }[] = [];
    const itineraryCount = parseInt(str('itineraryCount')) || 50;
    for (let i = 0; i < itineraryCount; i++) {
      const dayTitle = str(`itinerary_title_${i}`);
      const dayContent = str(`itinerary_content_${i}`);
      if (dayTitle || dayContent) {
        itineraries.push({ title: dayTitle || `Día ${i + 1}`, content: dayContent || 'Actividades programadas.' });
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
      if (q || a) {
        faqs.push({ question: q || `Pregunta ${i + 1}`, answer: a || 'Respuesta.' });
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
      if (privatePricing.length === 0) {
        privatePricing.push({ pax: 1, price: sharedPrice || 100 });
      }
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
        } catch (pubErr) {
          console.warn('Publication skipped/failed:', pubErr);
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

      // 3. Separate publication if state changed
      const currentPublished = form.get('isPublished') === 'true';
      if (desiredPublished !== currentPublished) {
        await centralRequest(
          `${baseRoute}/${encodeURIComponent(id)}/publication`,
          token,
          { expectedUpdatedAt: updatedContent.updatedAt, isPublished: desiredPublished },
          'PUT',
        );
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
