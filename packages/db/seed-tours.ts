import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  const textPath = path.join('C:\\Users\\ADRIANO\\Desktop\\incabound', 'tours_text.txt');
  const rawText = fs.readFileSync(textPath, 'utf-8');

  // Split by "NOMBRE DEL TOUR:"
  const chunks = rawText.split('NOMBRE DEL TOUR:').filter(c => c.trim().length > 0);

  console.log(`Found ${chunks.length} tours to process.`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Extract sections using regex
    const titleMatch = chunk.match(/^(.*?)(?:DESCRIPCIÓN|DESCRIPCIÒN|DESCRIPCION)/is);
    const descMatch = chunk.match(/DESCRIPCIÓN(.*?)Itinerario/is);
    const itinMatch = chunk.match(/Itinerario(.*?)INCLUYE/is);
    const incMatch = chunk.match(/INCLUYE(.*?)NO INCLUYE/is);
    const excMatch = chunk.match(/NO INCLUYE(.*?)RECOMENDACIONES/is);
    const recMatch = chunk.match(/RECOMENDACIONES(.*?)PREGUNTAS FRECUENTES/is);
    const faqMatch = chunk.match(/PREGUNTAS FRECUENTES(.*?)(?:INFORMACIÓN DEL TOUR|Información del Tour|INFORMACION DEL TOUR)/is);
    const infoMatch = chunk.match(/(?:INFORMACIÓN DEL TOUR|Información del Tour|INFORMACION DEL TOUR)(.*)/is);

    const title = titleMatch ? titleMatch[1].trim() : `Tour ${i + 1}`;
    const description = descMatch ? descMatch[1].trim() : '';
    
    console.log(`Processing: ${title}`);

    // Parse Itinerary (split by times like "04:00 - 05:00 |")
    let itineraries = [];
    if (itinMatch) {
      const itinText = itinMatch[1];
      // Regex to split by something like "04:00 - 05:00 |" or "08:00 |"
      const steps = itinText.split(/(?=\d{2}:\d{2}\s*[-–]\s*\d{2}:\d{2}\s*\||\d{2}:\d{2}\s*\|)/g).map(s => s.trim()).filter(s => s.length > 0);
      itineraries = steps.map((step, idx) => {
        const parts = step.split('|');
        const stepTitle = parts.length > 1 ? parts[0].trim() + ' | ' + parts[1].split(':')[0].trim() : `Paso ${idx + 1}`;
        const content = parts.length > 1 ? parts.slice(1).join('|').trim() : step;
        return {
          title: stepTitle.substring(0, 50), // keep it short
          content: content,
          order: idx
        };
      });
    }

    // Parse Inclusions/Exclusions/Recs (split by periods or newlines)
    const inclusions = incMatch ? incMatch[1].split('. ').map(s => s.trim().replace(/\.$/, '')).filter(s => s.length > 0).map((s, idx) => ({ content: s, order: idx })) : [];
    const exclusions = excMatch ? excMatch[1].split('. ').map(s => s.trim().replace(/\.$/, '')).filter(s => s.length > 0).map((s, idx) => ({ content: s, order: idx })) : [];
    const recommendations = recMatch ? recMatch[1].split('. ').map(s => s.trim().replace(/\.$/, '')).filter(s => s.length > 0).map((s, idx) => ({ content: s, order: idx })) : [];

    // Parse FAQs
    let faqs = [];
    if (faqMatch) {
      const faqText = faqMatch[1];
      const qSplit = faqText.split(/(¿.*?)/g).filter(s => s.trim().length > 0);
      let currentQ = '';
      let qIdx = 0;
      for (const part of qSplit) {
        if (part.startsWith('¿')) {
          currentQ = part.trim();
        } else if (currentQ) {
          faqs.push({ question: currentQ, answer: part.trim(), order: qIdx++ });
          currentQ = '';
        }
      }
    }

    // Extract Info
    const infoText = infoMatch ? infoMatch[1] : '';
    let duration = 'Día completo';
    let altitude = null;
    let difficulty = 'Moderada';
    let groupSize = 'Compartido: 19 pasajeros';

    if (infoText) {
      if (infoText.match(/Duración[\s:]+(.*?)(?:Altitud|Tamaño|Dificultad)/i)) {
        duration = infoText.match(/Duración[\s:]+(.*?)(?:Altitud|Tamaño|Dificultad)/i)[1].trim();
      }
      if (infoText.match(/Dificultad[\s:]+(.*?)(?:$)/i)) {
        difficulty = infoText.match(/Dificultad[\s:]+(.*?)(?:$)/i)[1].trim();
      }
    }

    // Create tour
    const tourData = {
      title,
      slug: slugify(title),
      description,
      region: title.toLowerCase().includes('cusco') || title.toLowerCase().includes('machu picchu') || title.toLowerCase().includes('ausangate') || title.toLowerCase().includes('humantay') || title.toLowerCase().includes('vinicunca') || title.toLowerCase().includes('valle sagrado') || title.toLowerCase().includes('qeswachaka') || title.toLowerCase().includes('waqrapukara') ? 'CUSCO' : null,
      menuGroup: 'FULL DAY', // Default for now
      bannerImage: '/tours/default-banner.jpg',
      cardImage: '/tours/default-card.jpg',
      duration: duration.substring(0, 50),
      altitude: 'Variable',
      difficulty: difficulty.substring(0, 50),
      groupSize,
      hasSharedService: true,
      sharedPrice: 50.0,
      hasPrivateService: false,
      itineraries: { create: itineraries },
      inclusions: { create: inclusions },
      exclusions: { create: exclusions },
      recommendations: { create: recommendations },
      faqs: { create: faqs }
    };

    try {
      await prisma.tour.upsert({
        where: { slug: tourData.slug },
        update: tourData,
        create: tourData
      });
      console.log(`Created/Updated: ${title}`);
    } catch (e) {
      console.error(`Error saving ${title}:`, e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
