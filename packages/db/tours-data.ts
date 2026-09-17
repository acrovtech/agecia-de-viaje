export const tours = [
  {
    title: "Laguna Humantay",
    slug: "laguna-humantay",
    description: "La Laguna Humantay es uno de los destinos naturales más impresionantes de Cusco y una de las excursiones de un día más populares del Perú. Ubicada al pie del majestuoso nevado Humantay, esta laguna de aguas color turquesa ofrece un paisaje espectacular rodeado por los Andes.\nDurante este recorrido disfrutarás de un viaje panorámico por el valle de Mollepata, atravesando comunidades andinas y paisajes de montaña hasta llegar a Soraypampa, punto de inicio de la caminata. Desde allí comenzarás un ascenso que te llevará hasta la laguna, donde podrás admirar uno de los escenarios naturales.",
    duration: "1 Día",
    altitude: "4,200",
    difficulty: "Moderada",
    groupSize: "19",
    hasSharedService: true,
    sharedPrice: 80.0,
    hasPrivateService: true,
    bannerImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/tours/tour-laguna-humantay.png",
    cardImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/tours/tour-laguna-humantay.png",
    itineraries: [
      {
        order: 0,
        title: "Día 1: Excursión a la Laguna Humantay",
        content: "• 04:00 – 05:00 | Recojo: En hoteles del centro histórico de Cusco.\n• 05:00 – 07:00 | Viaje: Cusco a Mollepata en transporte turístico.\n• 07:00 – 08:00 | Desayuno: Parada en Mollepata para el desayuno.\n• 08:00 – 09:00 | Traslado: Mollepata a Soraypampa (inicio del trekking, 3,900 m s. n. m.).\n• 09:00 – 09:15 | Preparación: Charla del guía, estiramientos y opción de alquilar caballo.\n• 09:15 – 10:45 | Ascenso: Caminata de subida a paso constante (1.5 horas / 3.5 km).\n• 10:45 – 11:45 | Laguna: Tiempo libre (1 hora) para fotos y explicación (4,200 m s. n. m.).\n• 11:45 – 12:45 | Descenso: Caminata de retorno a Soraypampa (1 hora).\n• 12:45 – 13:45 | Traslado: Soraypampa a Mollepata.\n• 13:45 – 14:45 | Almuerzo: Almuerzo buffet en Mollepata.\n• 14:45 – 17:30 | Retorno: Viaje de regreso de Mollepata a Cusco.\n• 17:30 – 18:00 | Llegada: Desembarque de pasajeros en el centro de Cusco."
      }
    ],
    inclusions: [
      "Transporte turístico de ida y vuelta.",
      "Recojo desde hoteles céntricos.",
      "Guía profesional bilingüe (español e inglés).",
      "Desayuno.",
      "Almuerzo buffet.",
      "Botiquín de primeros auxilios.",
      "Asistencia permanente durante el recorrido."
    ].map((c, i) => ({ order: i, content: c })),
    exclusions: [
      "Entrada a la Laguna Humantay.",
      "Caballos para la subida o bajada (opcional).",
      "Bebidas adicionales.",
      "Gastos personales.",
      "Propinas (opcionales).",
      "Seguro de viaje."
    ].map((c, i) => ({ order: i, content: c })),
    recommendations: [
      "Documento de identidad o pasaporte.",
      "Ropa cómoda y abrigadora en capas.",
      "Casaca impermeable o poncho para lluvia.",
      "Zapatos de trekking o calzado con buena tracción.",
      "Bloqueador solar.",
      "Lentes de sol.",
      "Sombrero o gorra.",
      "Agua (mínimo 1 litro).",
      "Snacks energéticos.",
      "Dinero en efectivo para gastos adicionales.",
      "Cámara fotográfica o teléfono con batería suficiente."
    ].map((c, i) => ({ order: i, content: c })),
    faqs: [
      { order: 0, question: "¿Qué tan difícil es la caminata?", answer: "La caminata tiene una dificultad moderada debido a la altitud. Aunque la distancia no es muy larga, el ascenso puede resultar exigente para algunas personas." },
      { order: 1, question: "¿Es necesario tener experiencia en trekking?", answer: "No. Cualquier persona con una condición física razonable puede realizar el recorrido caminando a su propio ritmo." },
      { order: 2, question: "¿Se pueden alquilar caballos?", answer: "Sí. En Soraypampa hay pobladores locales que ofrecen caballos para quienes prefieran evitar parte del esfuerzo físico. Este servicio tiene un costo adicional." },
      { order: 3, question: "¿Cuál es la mejor época para visitar la Laguna Humantay?", answer: "La temporada seca, entre abril y octubre, ofrece mejores condiciones climáticas y cielos despejados. Sin embargo, el tour opera durante todo el año." },
      { order: 4, question: "¿La entrada está incluida?", answer: "Depende del operador turístico. En este paquete la entrada no está incluida y debe pagarse en el puesto de control correspondiente." },
      { order: 5, question: "¿Puedo realizar el tour si recién llegué a Cusco?", answer: "Se recomienda permanecer al menos uno o dos días en Cusco antes de realizar el tour para favorecer la aclimatación a la altura." },
      { order: 6, question: "¿Es apto para niños y adultos mayores?", answer: "Sí, siempre que cuenten con una condición física adecuada. En caso de requerirlo, pueden contratar el servicio de caballo para facilitar el ascenso." }
    ]
  },
  {
    title: "Montaña de 7 Colores (Vinicunca)",
    slug: "montana-de-colores-vinicunca",
    description: "La Montaña de 7 Colores, también conocida como Vinicunca o Montaña Arcoíris, es uno de los destinos más emblemáticos de Cusco y una de las maravillas naturales más visitadas del Perú. Sus impresionantes franjas de colores, formadas por minerales a lo largo de millones de años, crean un paisaje único en la cordillera de los Andes.\nEsta excursión de un día te llevará a descubrir espectaculares paisajes altoandinos, donde podrás observar nevados, extensas pampas, llamas, alpacas y vicuñas en su hábitat natural. La caminata hasta el mirador de Vinicunca recompensa el esfuerzo con una vista inolvidable, ideal para amantes de la naturaleza, el trekking y la fotografía.",
    duration: "1 Día",
    altitude: "5,036",
    difficulty: "Moderada – Difícil",
    groupSize: "19",
    hasSharedService: true,
    sharedPrice: 80.0,
    hasPrivateService: true,
    bannerImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875465196-vinicunca-banner.webp",
    cardImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875465196-vinicunca-banner.webp",
    itineraries: [
      {
        order: 0,
        title: "Día 1: Excursión a la Montaña de 7 Colores (Vinicunca)",
        content: "• 04:00 – 04:40 | Recojo: En hoteles del centro histórico de Cusco.\n• 04:40 – 06:40 | Viaje: Cusco a Cusipata en transporte turístico.\n• 06:40 – 07:40 | Desayuno: Parada en Cusipata para el desayuno buffet.\n• 07:40 – 08:40 | Traslado: Cusipata a Phulawasipata (inicio del trekking, 4,600 m s. n. m.).\n• 08:40 – 09:00 | Preparación: Indicaciones del guía, estiramientos y opción de caballo.\n• 09:00 – 10:30 | Ascenso: Caminata hacia la cima apreciando llamas, alpacas y el Nevado Ausangate (1.5 a 2 horas).\n• 10:30 – 11:30 | Mirador Vinicunca: Tiempo libre (1 hora) para explicaciones del guía, fotos y descanso (5,200 m s. n. m.).\n• 11:30 – 12:30 | Descenso: Caminata de retorno hacia el punto de inicio en Phulawasipata (1 hora).\n• 12:30 – 13:30 | Traslado: Kayrahuire Cusipata.\n• 13:30 – 14:30 | Almuerzo: Almuerzo buffet reconfortante en Cusipata.\n• 14:30 – 17:00 | Retorno: Viaje de regreso desde Cusipata hacia Cusco.\n• 17:00 | Llegada: Desembarque de pasajeros en el centro de Cusco."
      }
    ],
    inclusions: [
      "Transporte turístico de ida y vuelta.",
      "Recojo desde hoteles céntricos.",
      "Guía profesional bilingüe (español e inglés).",
      "Desayuno buffet.",
      "Almuerzo buffet.",
      "Bastones de trekking (según disponibilidad).",
      "Botiquín de primeros auxilios.",
      "Oxígeno para emergencias.",
      "Asistencia permanente durante todo el recorrido."
    ].map((c, i) => ({ order: i, content: c })),
    exclusions: [
      "Entrada a la Montaña de 7 Colores.",
      "Caballos para la subida o bajada (opcional).",
      "Bebidas adicionales.",
      "Gastos personales.",
      "Propinas (opcionales).",
      "Seguro de viaje"
    ].map((c, i) => ({ order: i, content: c })),
    recommendations: [
      "Documento de identidad o pasaporte.",
      "Ropa abrigadora en capas.",
      "Casaca impermeable o poncho para lluvia.",
      "Zapatos de trekking con buena tracción.",
      "Gorro para el frío.",
      "Sombrero o gorra para el sol.",
      "Guantes (temporada seca).",
      "Lentes de sol.",
      "Protector solar.",
      "Agua (mínimo 1 litro).",
      "Snacks energéticos.",
      "Dinero en efectivo para gastos adicionales.",
      "Cámara fotográfica o celular con batería suficiente."
    ].map((c, i) => ({ order: i, content: c })),
    faqs: [
      { order: 0, question: "¿Qué tan difícil es la caminata?", answer: "La caminata tiene una dificultad moderada a difícil debido a la elevada altitud. Se recomienda contar con una condición física adecuada." },
      { order: 1, question: "¿Cuánto dura la caminata?", answer: "La subida toma aproximadamente entre 1 hora y 30 minutos y 2 horas, mientras que el descenso dura entre 1 y 1 hora y 30 minutos." },
      { order: 2, question: "¿Es necesario tener experiencia en trekking?", answer: "No es indispensable, aunque se recomienda haber realizado caminatas previamente y estar bien aclimatado a la altura." },
      { order: 3, question: "¿Se pueden alquilar caballos?", answer: "Sí. Los pobladores locales ofrecen caballos para quienes prefieran reducir el esfuerzo físico durante la subida o bajada. Este servicio tiene un costo adicional." },
      { order: 4, question: "¿Cuál es la mejor época para visitar Vinicunca?", answer: "La temporada seca, entre abril y octubre, ofrece mejores condiciones para apreciar los colores de la montaña y disfrutar de cielos despejados." },
      { order: 5, question: "¿Puedo realizar el tour si recién llegué a Cusco?", answer: "Lo más recomendable es permanecer entre uno y dos días en Cusco antes del tour para facilitar la aclimatación y reducir el riesgo de malestar por la altitud." },
      { order: 6, question: "¿Es apto para niños y adultos mayores?", answer: "Sí, siempre que cuenten con una buena condición física. También existe la opción de contratar un caballo para facilitar el recorrido." }
    ]
  },
  {
    title: "Glaciares de Ausangate y 4 Lagunas",
    slug: "glaciares-de-ausangate-y-4-lagunas",
    description: "Descubre uno de los paisajes más espectaculares de los Andes peruanos con el Tour Glaciares de Ausangate y 4 Lagunas, una experiencia de un día que combina impresionantes lagunas de origen glaciar, majestuosos nevados y la riqueza natural de la cordillera de Vilcanota.\nDurante esta excursión visitarás las hermosas lagunas Azulcocha, Otorongo, Pucacocha y Alqacocha, cada una con características y tonalidades únicas, alimentadas por los deshielos del imponente nevado Ausangate, la montaña más alta de la región de Cusco. A lo largo del recorrido podrás apreciar paisajes altoandinos, fauna silvestre como llamas, alpacas y vicuñas, además de convivir con comunidades que conservan sus tradiciones ancestrales.",
    duration: "1 Día",
    altitude: "4,600",
    difficulty: "Moderada",
    groupSize: "19",
    hasSharedService: true,
    sharedPrice: 80.0,
    hasPrivateService: true,
    bannerImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/nacional-2.webp",
    cardImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/nacional-2.webp",
    itineraries: [
      {
        order: 0,
        title: "Día 1: Excursión a los Glaciares de Ausangate y 4 Lagunas",
        content: "• 04:30 – 05:00 | Recojo en el hotel: Recojo desde hoteles ubicados en el centro histórico de Cusco.\n• 08:00 | Desayuno en Pacchanta: Llegada a la comunidad de Pacchanta y desayuno.\n• 09:00 | Caminata a las 4 Lagunas de Ausangate: Inicio de la caminata guiada para visitar las lagunas Azulcocha, Otorongo, Pucacocha y Alqacocha, disfrutando de espectaculares paisajes del nevado Ausangate.\n• 13:30 | Retorno a Pacchanta y almuerzo: Descenso hacia Pacchanta para disfrutar de un almuerzo tradicional.\n• 14:30 | Baños termales (opcional): Tiempo libre para relajarse en las aguas termales de Pacchanta (ingreso opcional).\n• 15:30 | Retorno a Cusco: Viaje de regreso a la ciudad.\n• 19:00 – 19:30 | Llegada a Cusco: Arribo al centro histórico de Cusco y finalización del servicio."
      }
    ],
    inclusions: [
      "Transporte turístico de ida y vuelta.",
      "Recojo desde hoteles céntricos.",
      "Guía profesional bilingüe (español e inglés).",
      "Desayuno.",
      "Almuerzo.",
      "Bastones de trekking (según disponibilidad).",
      "Botiquín de primeros auxilios.",
      "Oxígeno para emergencias.",
      "Asistencia permanente durante el recorrido."
    ].map((c, i) => ({ order: i, content: c })),
    exclusions: [
      "Entrada a la comunidad de Pacchanta y circuito de las lagunas.",
      "Ingreso a las aguas termales de Pacchanta.",
      "Bebidas adicionales.",
      "Snacks.",
      "Gastos personales.",
      "Propinas (opcionales).",
      "Seguro de viaje."
    ].map((c, i) => ({ order: i, content: c })),
    recommendations: [
      "Documento de identidad o pasaporte.",
      "Ropa térmica y abrigadora.",
      "Casaca impermeable o cortaviento.",
      "Zapatos de trekking con buena tracción.",
      "Gorro para el frío.",
      "Sombrero o gorra.",
      "Guantes.",
      "Lentes de sol.",
      "Protector solar.",
      "Agua (mínimo 1 litro).",
      "Snacks energéticos.",
      "Traje de baño y toalla (si visitarás las aguas termales).",
      "Dinero en efectivo para ingresos y gastos adicionales.",
      "Cámara fotográfica."
    ].map((c, i) => ({ order: i, content: c })),
    faqs: [
      { order: 0, question: "¿Qué tan difícil es la caminata?", answer: "La caminata tiene una dificultad moderada. El recorrido transcurre por senderos relativamente accesibles, aunque la altitud puede hacer que el esfuerzo físico sea mayor." },
      { order: 1, question: "¿Cuánto dura la caminata?", answer: "La caminata completa dura aproximadamente entre 3 y 4 horas, incluyendo las paradas en cada laguna." },
      { order: 2, question: "¿Se visitan glaciares?", answer: "Sí. Durante el recorrido se obtienen excelentes vistas de los glaciares del nevado Ausangate y, dependiendo de las condiciones climáticas, es posible acercarse a zonas cercanas al hielo." },
      { order: 3, question: "¿Es necesario estar aclimatado?", answer: "Sí. Debido a que gran parte del recorrido supera los 4,000 metros sobre el nivel del mar, se recomienda permanecer al menos dos días en Cusco antes de realizar el tour." },
      { order: 4, question: "¿Se pueden visitar las aguas termales?", answer: "Sí. Al finalizar la caminata tendrás tiempo para ingresar de manera opcional a las aguas termales de Pacchanta antes de regresar a Cusco." },
      { order: 5, question: "¿Es apto para niños?", answer: "Sí, para niños acostumbrados a caminar y siempre bajo la supervisión de un adulto. También es recomendable que estén previamente aclimatados." },
      { order: 6, question: "¿Cuál es la mejor época para realizar el tour?", answer: "Entre abril y octubre, durante la temporada seca, cuando predominan los cielos despejados y las mejores condiciones para disfrutar del paisaje." }
    ]
  },
  {
    title: "7 Lagunas de Ausangate",
    slug: "7-lagunas-de-ausangate",
    description: "Descubre uno de los paisajes más impresionantes de la cordillera de Vilcanota con el Tour 7 Lagunas de Ausangate, una experiencia inolvidable que combina naturaleza, aventura y cultura andina. Durante esta excursión recorrerás un circuito de lagunas de origen glaciar, cada una con diferentes tonalidades de azul, verde y turquesa, alimentadas por los deshielos del majestuoso nevado Ausangate, la montaña más alta de la región de Cusco.\nA lo largo del recorrido caminarás entre imponentes montañas, bofedales, glaciares y extensas praderas donde habitan llamas, alpacas y vicuñas en su entorno natural. Además, tendrás la oportunidad de conocer la comunidad de Pacchanta y, al finalizar la caminata, relajarte en sus famosas aguas termales.",
    duration: "1 Día",
    altitude: "4,700",
    difficulty: "Moderada",
    groupSize: "19",
    hasSharedService: true,
    sharedPrice: 80.0,
    hasPrivateService: true,
    bannerImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/nacional-3.webp",
    cardImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/nacional-3.webp",
    itineraries: [
      {
        order: 0,
        title: "Día 1: Excursión a las 7 Lagunas de Ausangate",
        content: "• 04:30 – 05:00 | Recojo en el hotel: Recojo desde hoteles ubicados en el centro histórico de Cusco.\n• 08:00 | Desayuno en Pacchanta: Llegada a la comunidad de Pacchanta para disfrutar del desayuno e iniciar la preparación para la caminata.\n• 09:00 | Caminata a las 7 Lagunas: Inicio de la caminata guiada para recorrer las lagunas Azulcocha, Otorongo, Pucacocha, Alqacocha, Qomercocha, Orco Otorongo y China Otorongo.\n• 13:30 | Almuerzo en Pacchanta: Retorno a la comunidad para disfrutar de un almuerzo tradicional.\n• 14:30 | Baños termales (opcional): Tiempo libre para relajarse en las aguas termales de Pacchanta (ingreso opcional).\n• 15:30 | Retorno a Cusco: Inicio del viaje de regreso.\n• 19:00 | Llegada a Cusco: Arribo al centro histórico de Cusco y fin de nuestros servicios."
      }
    ],
    inclusions: [
      "Transporte turístico de ida y vuelta.",
      "Recojo desde hoteles céntricos.",
      "Guía profesional bilingüe (español e inglés).",
      "Desayuno.",
      "Almuerzo.",
      "Bastones de trekking (según disponibilidad).",
      "Botiquín de primeros auxilios.",
      "Oxígeno para emergencias. Asistencia durante todo el recorrido."
    ].map((c, i) => ({ order: i, content: c })),
    exclusions: [
      "Entrada al circuito de las 7 Lagunas.",
      "Ingreso a las aguas termales de Pacchanta.",
      "Bebidas adicionales.",
      "Snacks.",
      "Gastos personales.",
      "Propinas (opcionales).",
      "Seguro de viaje"
    ].map((c, i) => ({ order: i, content: c })),
    recommendations: [
      "Documento de identidad o pasaporte.",
      "Ropa térmica y abrigadora.",
      "Casaca impermeable o cortaviento.",
      "Zapatos de trekking con buena tracción.",
      "Gorro para el frío.",
      "Sombrero o gorra.",
      "Guantes.",
      "Protector solar.",
      "Lentes de sol.",
      "Agua (mínimo 1 litro).",
      "Snacks energéticos.",
      "Traje de baño y toalla (para las aguas termales).",
      "Dinero en efectivo para ingresos y gastos adicionales.",
      "Cámara fotográfica o celular con batería suficiente."
    ].map((c, i) => ({ order: i, content: c })),
    faqs: [
      { order: 0, question: "¿Qué tan difícil es la caminata?", answer: "El recorrido tiene una dificultad moderada debido a la altitud. Aunque el sendero no presenta tramos técnicos, se recomienda contar con una condición física adecuada." },
      { order: 1, question: "¿Cuánto dura la caminata?", answer: "La caminata tiene una duración aproximada de entre 4 y 5 horas, incluyendo las paradas para descansar y tomar fotografías." },
      { order: 2, question: "¿Cuál es la altitud máxima del recorrido?", answer: "El circuito alcanza aproximadamente los 4,700 metros sobre el nivel del mar." },
      { order: 3, question: "¿Es necesario estar aclimatado?", answer: "Sí. Se recomienda permanecer al menos dos días en Cusco antes de realizar este tour para adaptarse a la altitud." },
      { order: 4, question: "¿Se pueden visitar las aguas termales?", answer: "Sí. Al finalizar la caminata podrás ingresar de forma opcional a las aguas termales de Pacchanta antes del regreso a Cusco." },
      { order: 5, question: "¿Es un tour muy concurrido?", answer: "No. A diferencia de otros destinos populares, el circuito de las 7 Lagunas ofrece una experiencia más tranquila y en contacto directo con la naturaleza." },
      { order: 6, question: "¿Cuál es la mejor época para realizar el tour?", answer: "La temporada seca, entre abril y octubre, ofrece mejores condiciones para disfrutar de los paisajes y obtener vistas despejadas del nevado Ausangate." }
    ]
  },
  {
    title: "Tour Pallay Poncho",
    slug: "tour-pallay-poncho",
    description: "Descubre uno de los destinos más recientes y sorprendentes de los Andes peruanos con el Tour Pallay Poncho, una impresionante montaña conocida por sus formaciones rocosas de colores y sus características crestas puntiagudas que recuerdan los diseños de los tradicionales ponchos andinos. Ubicada en la provincia de Canas, al sur de Cusco, esta maravilla natural ofrece un paisaje único, menos concurrido y rodeado de espectaculares vistas de la cordillera.\nDurante esta excursión recorrerás pintorescos pueblos andinos, atravesarás extensas pampas y disfrutarás de una caminata que culmina con una vista panorámica de la montaña y de la hermosa laguna Langui-Layo. Gracias a su belleza y tranquilidad, Pallay Poncho se ha convertido en un destino ideal para los amantes del trekking, la fotografía y la naturaleza.",
    duration: "1 Día",
    altitude: "4,790",
    difficulty: "Moderada – Difícil",
    groupSize: "19",
    hasSharedService: true,
    sharedPrice: 80.0,
    hasPrivateService: true,
    bannerImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/nacional-1.webp",
    cardImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/nacional-1.webp",
    itineraries: [
      {
        order: 0,
        title: "Día 1: Excursión a la Montaña Pallay Poncho",
        content: "• 04:30 – 05:00 | Recojo en el hotel: Recojo desde hoteles ubicados en el centro histórico de Cusco.\n• 08:00 | Desayuno en Sicuani: Llegada a Sicuani para disfrutar del desayuno.\n• 09:30 | Caminata a la Montaña Pallay Poncho: Inicio de la caminata guiada hacia el mirador de Pallay Poncho, donde disfrutarás de impresionantes vistas de la montaña, la laguna Langui-Layo y la cordillera andina.\n• 13:00 | Descenso y retorno al transporte: Finalizada la visita, iniciaremos el descenso hacia el punto de encuentro con el transporte turístico.\n• 14:30 | Almuerzo en Sicuani: Disfrutaremos de un almuerzo tradicional antes del regreso.\n• 15:30 | Retorno a Cusco: Viaje de regreso a la ciudad de Cusco.\n• 19:00 | Llegada a Cusco: Arribo al centro histórico de Cusco y fin de nuestros servicios."
      }
    ],
    inclusions: [
      "Transporte turístico de ida y vuelta.",
      "Recojo desde hoteles céntricos.",
      "Guía profesional bilingüe (español e inglés).",
      "Desayuno.",
      "Almuerzo.",
      "Bastones de trekking (según disponibilidad).",
      "Botiquín de primeros auxilios.",
      "Oxígeno para emergencias.",
      "Asistencia permanente durante todo el recorrido."
    ].map((c, i) => ({ order: i, content: c })),
    exclusions: [
      "Entrada a Pallay Poncho.",
      "Caballos para la subida o bajada (sujeto a disponibilidad).",
      "Bebidas adicionales.",
      "Snacks.",
      "Gastos personales.",
      "Propinas (opcionales).",
      "Seguro de viaje"
    ].map((c, i) => ({ order: i, content: c })),
    recommendations: [
      "Documento de identidad o pasaporte.",
      "Ropa abrigadora en capas.",
      "Casaca impermeable o cortaviento.",
      "Zapatos de trekking con buena tracción.",
      "Gorro para el frío.",
      "Sombrero o gorra.",
      "Guantes.",
      "Lentes de sol.",
      "Protector solar.",
      "Agua (mínimo 1 litro).",
      "Snacks energéticos.",
      "Dinero en efectivo para ingresos y gastos adicionales.",
      "Cámara fotográfica o celular con batería suficiente."
    ].map((c, i) => ({ order: i, content: c })),
    faqs: [
      { order: 0, question: "¿Qué tan difícil es la caminata?", answer: "La caminata tiene una dificultad moderada a difícil debido a la altitud y al ascenso constante. Se recomienda contar con una condición física adecuada." },
      { order: 1, question: "¿Cuánto dura la caminata?", answer: "El recorrido dura aproximadamente entre 3 y 4 horas (ida y vuelta), dependiendo del ritmo del grupo." },
      { order: 2, question: "¿Cuál es la altitud de Pallay Poncho?", answer: "La montaña se encuentra aproximadamente a 4,790 metros sobre el nivel del mar." },
      { order: 3, question: "¿Es necesario aclimatarse antes del tour?", answer: "Sí. Se recomienda permanecer al menos dos días en Cusco antes de realizar esta excursión para adaptarse a la altitud." },
      { order: 4, question: "¿Se pueden alquilar caballos?", answer: "En algunas temporadas, los pobladores locales ofrecen caballos para parte del recorrido. La disponibilidad puede variar y el servicio tiene un costo adicional." },
      { order: 5, question: "¿Cuál es la mejor época para visitar Pallay Poncho?", answer: "Entre abril y octubre, durante la temporada seca, cuando el clima es más estable y las vistas suelen ser más despejadas." },
      { order: 6, question: "¿Es un destino muy concurrido?", answer: "No. Pallay Poncho es un atractivo relativamente nuevo, por lo que suele recibir menos visitantes que otros destinos populares de Cusco, permitiendo disfrutar de una experiencia más tranquila." }
    ]
  },
  {
    title: "Valle Sagrado VIP",
    slug: "valle-sagrado-vip",
    description: "El Valle Sagrado de los Incas es uno de los destinos más emblemáticos de Cusco y una de las excursiones de un día más recomendadas para quienes desean conocer la historia, cultura y arquitectura del Imperio Inca. Ubicado entre imponentes montañas y atravesado por el río Vilcanota, este valle alberga importantes centros arqueológicos, pintorescos pueblos andinos y espectaculares paisajes naturales.\nDurante este recorrido visitarás los principales atractivos del Valle Sagrado, como Pisac, Ollantaytambo y Chinchero, donde podrás admirar impresionantes construcciones incas, terrazas agrícolas, mercados artesanales y hermosos paisajes andinos. Además, disfrutarás de un delicioso almuerzo buffet con una variada gastronomía regional.",
    duration: "1 Día",
    altitude: "3,762",
    difficulty: "Fácil – Moderada",
    groupSize: "19",
    hasSharedService: true,
    sharedPrice: 60.0,
    hasPrivateService: true,
    bannerImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875478876-valle-sagrado-banner.webp",
    cardImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875478876-valle-sagrado-banner.webp",
    itineraries: [
      {
        order: 0,
        title: "Día 1: Tour Valle Sagrado de los Incas (Pisac, Ollantaytambo y Chinchero)",
        content: "• 07:30 – 08:00 | Recojo en el hotel: Recojo desde hoteles ubicados en el centro histórico de Cusco.\n• 09:30 | Visita al Complejo Arqueológico de Pisac: Recorrido por el centro arqueológico de Pisac, apreciando sus terrazas agrícolas, templos incas y vistas panorámicas del Valle Sagrado.\n• 10:45 | Mercado Artesanal de Pisac: Tiempo libre para conocer el mercado tradicional y apreciar artesanías locales.\n• 12:30 | Almuerzo buffet en Urubamba: Disfrutaremos de un almuerzo buffet con platos típicos de la gastronomía peruana.\n• 14:00 | Visita a Ollantaytambo: Exploraremos la impresionante fortaleza inca, sus terrazas y construcciones de piedra.\n• 16:00 | Visita a Chinchero: Conoceremos su centro arqueológico, iglesia colonial y talleres textiles tradicionales.\n• 17:00 | Retorno a Cusco: Inicio del viaje de regreso a la ciudad.\n• 18:30 – 19:00 | Llegada a Cusco: Arribo al centro histórico de Cusco y fin del servicio."
      }
    ],
    inclusions: [
      "Transporte turístico de ida y vuelta.",
      "Recojo desde hoteles céntricos.",
      "Guía profesional bilingüe (español e inglés).",
      "Almuerzo buffet.",
      "Botiquín de primeros auxilios.",
      "Asistencia permanente durante todo el recorrido."
    ].map((c, i) => ({ order: i, content: c })),
    exclusions: [
      "Boleto Turístico del Cusco (BTC).",
      "Entrada a los sitios arqueológicos.",
      "Bebidas adicionales.",
      "Gastos personales.",
      "Propinas (opcionales).",
      "Seguro de viaje."
    ].map((c, i) => ({ order: i, content: c })),
    recommendations: [
      "Documento de identidad o pasaporte.",
      "Ropa cómoda.",
      "Casaca ligera para cambios de temperatura.",
      "Zapatos cómodos para caminar.",
      "Bloqueador solar.",
      "Lentes de sol.",
      "Sombrero o gorra.",
      "Agua.",
      "Snacks.",
      "Dinero en efectivo para compras personales.",
      "Cámara fotográfica o teléfono con batería suficiente."
    ].map((c, i) => ({ order: i, content: c })),
    faqs: [
      { order: 0, question: "¿Qué lugares se visitan durante el tour?", answer: "El recorrido incluye los principales atractivos del Valle Sagrado: Pisac, el Mercado Artesanal de Pisac, Urubamba, Ollantaytambo y Chinchero." },
      { order: 1, question: "¿Es necesario comprar el Boleto Turístico?", answer: "Sí. Para ingresar a los centros arqueológicos es obligatorio contar con el Boleto Turístico del Cusco, el cual no está incluido en este paquete." },
      { order: 2, question: "¿El tour es apto para toda la familia?", answer: "Sí. Es un recorrido de baja dificultad y puede ser realizado por niños, adultos y adultos mayores." },
      { order: 3, question: "¿Cuánto tiempo se camina?", answer: "Las caminatas son cortas y se realizan dentro de cada complejo arqueológico, con varias pausas durante todo el recorrido." },
      { order: 4, question: "¿El almuerzo está incluido?", answer: "Sí. El tour incluye un almuerzo buffet en un restaurante turístico de Urubamba." },
      { order: 5, question: "¿Cuál es la mejor época para realizar el tour?", answer: "El Valle Sagrado puede visitarse durante todo el año. La temporada seca, entre abril y octubre, ofrece mejores condiciones climáticas y cielos despejados." },
      { order: 6, question: "¿Puedo realizar este tour el mismo día que viajo a Machu Picchu?", answer: "Sí. Muchos viajeros finalizan el recorrido en Ollantaytambo para abordar el tren hacia Aguas Calientes. En caso de requerir este servicio, debe coordinarse previamente con el operador." }
    ]
  },
  {
    title: "City Tour Cusco",
    slug: "city-tour-cusco",
    description: "El City Tour en Cusco es una de las mejores experiencias para conocer la historia, cultura y legado del Imperio Inca en una sola tarde. Este recorrido combina la visita al principal templo inca de la ciudad y cuatro importantes complejos arqueológicos ubicados en los alrededores de Cusco.\nDurante el recorrido conocerás el majestuoso Qorikancha, antiguo Templo del Sol, considerado el recinto religioso más importante del Imperio Inca. Posteriormente visitarás las fortalezas y centros ceremoniales de Sacsayhuamán, Qenqo, Puka Pukara y Tambomachay, donde descubrirás impresionantes construcciones de piedra, arquitectura inca y espectaculares paisajes.",
    duration: "1/2 Día",
    altitude: "3,700",
    difficulty: "Fácil",
    groupSize: "19",
    hasSharedService: true,
    sharedPrice: 40.0,
    hasPrivateService: true,
    bannerImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/destino-cusco.webp?v=noche",
    cardImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/destino-cusco.webp?v=noche",
    itineraries: [
      {
        order: 0,
        title: "Día 1: City Tour Cusco (Qorikancha y 4 Ruinas)",
        content: "• 13:00 – 13:30 | Recojo en el hotel: Recojo desde hoteles ubicados en el centro histórico de Cusco.\n• 13:45 | Visita al Qorikancha: Recorrido por el antiguo Templo del Sol, donde conocerás la fusión entre la arquitectura inca y colonial.\n• 14:30 | Visita a Sacsayhuamán: Exploración de la impresionante fortaleza ceremonial inca, famosa por sus enormes bloques de piedra y vistas panorámicas de Cusco.\n• 15:30 | Visita a Qenqo: Conocerás este antiguo centro ceremonial utilizado para rituales religiosos incas.\n• 16:00 | Visita a Puka Pukara: Recorrido por la antigua fortaleza militar inca ubicada en los alrededores de Cusco.\n• 16:30 | Visita a Tambomachay: Visita al templo del agua, reconocido por sus fuentes y canales hidráulicos incas.\n• 17:30 | Retorno a Cusco: Inicio del viaje de regreso hacia el centro histórico.\n• 18:00 – 18:30 | Llegada a Cusco: Finalización del servicio."
      }
    ],
    inclusions: [
      "Transporte turístico de ida y vuelta.",
      "Recojo desde hoteles céntricos.",
      "Guía profesional bilingüe (español e inglés).",
      "Botiquín de primeros auxilios.",
      "Asistencia permanente durante todo el recorrido."
    ].map((c, i) => ({ order: i, content: c })),
    exclusions: [
      "Boleto Turístico del Cusco (BTC).",
      "Entrada al Qorikancha.",
      "Bebidas adicionales.",
      "Gastos personales.",
      "Propinas (opcionales).",
      "Seguro de viaje."
    ].map((c, i) => ({ order: i, content: c })),
    recommendations: [
      "Documento de identidad o pasaporte.",
      "Ropa cómoda.",
      "Casaca ligera para cambios de temperatura.",
      "Zapatos cómodos para caminar.",
      "Bloqueador solar.",
      "Lentes de sol.",
      "Sombrero o gorra.",
      "Agua.",
      "Snacks.",
      "Dinero en efectivo para entradas y gastos adicionales.",
      "Cámara fotográfica o teléfono con batería suficiente."
    ].map((c, i) => ({ order: i, content: c })),
    faqs: [
      { order: 0, question: "¿Qué lugares se visitan durante el City Tour?", answer: "El recorrido incluye el Qorikancha, Sacsayhuamán, Qenqo, Puka Pukara y Tambomachay." },
      { order: 1, question: "¿Está incluido el ingreso a los sitios arqueológicos?", answer: "No. El ingreso a los complejos arqueológicos requiere el Boleto Turístico del Cusco y la entrada al Qorikancha se adquiere por separado." },
      { order: 2, question: "¿Es un tour exigente físicamente?", answer: "No. El recorrido tiene una dificultad baja, ya que las caminatas son cortas y el transporte turístico se desplaza entre cada atractivo." },
      { order: 3, question: "¿Es recomendable realizar este tour el primer día en Cusco?", answer: "Sí. Es uno de los tours más recomendados para comenzar la visita a Cusco, ya que permite una adaptación gradual a la altitud mientras se conocen los principales atractivos históricos." },
      { order: 4, question: "¿El tour es apto para niños y adultos mayores?", answer: "Sí. Es un recorrido apto para toda la familia, siempre que los participantes tengan movilidad para realizar caminatas cortas." },
      { order: 5, question: "¿Cuál es la mejor hora para realizar el City Tour?", answer: "El City Tour se realiza generalmente por la tarde, cuando las condiciones climáticas suelen ser más estables y la iluminación es ideal para apreciar los monumentos y tomar fotografías." },
      { order: 6, question: "¿Puedo realizar este tour el mismo día de mi llegada a Cusco?", answer: "Sí. Siempre que tu vuelo llegue durante la mañana y tengas tiempo suficiente para trasladarte al hotel antes del inicio del tour." }
    ]
  },
  {
    title: "Machu Picchu Full Day",
    slug: "machu-picchu",
    description: "Machu Picchu Full Day es una de las experiencias más inolvidables del Perú y una de las Siete Maravillas del Mundo Moderno. Este recorrido de un día te permitirá descubrir la impresionante ciudadela inca de Machu Picchu, considerada una obra maestra de la arquitectura e ingeniería del Imperio Inca.\nDurante esta excursión viajarás en tren a través del hermoso Valle Sagrado, rodeado de montañas, ríos y paisajes espectaculares, hasta llegar al pueblo de Aguas Calientes. Desde allí abordarás el bus ecológico que asciende hacia la ciudadela de Machu Picchu, donde realizarás una visita guiada por sus principales templos, plazas, terrazas agrícolas y miradores antes de retornar a Cusco.",
    duration: "1 Día",
    altitude: "2,430",
    difficulty: "Fácil – Moderada",
    groupSize: "19",
    hasSharedService: true,
    sharedPrice: 250.0,
    hasPrivateService: true,
    bannerImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875478876-valle-sagrado-banner.webp",
    cardImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875478876-valle-sagrado-banner.webp",
    itineraries: [
      {
        order: 0,
        title: "Día 1: Excursión Full Day a Machu Picchu",
        content: "• 03:30 – 05:00 | Recojo en el hotel: Recojo desde hoteles ubicados en el centro histórico de Cusco y traslado hacia la estación de tren.\n• 05:30 – 08:30 | Viaje en tren a Aguas Calientes: Salida en tren turístico rumbo a Machu Picchu Pueblo, disfrutando de los paisajes del Valle Sagrado.\n• 08:30 – 09:30 | Bus hacia Machu Picchu: Traslado en bus desde Aguas Calientes hasta la entrada de la ciudadela inca.\n• 10:00 – 12:30 | Visita guiada a Machu Picchu: Recorrido por la ciudadela junto al guía, visitando sus principales atractivos.\n• 12:30 – 15:30 | Retorno a Aguas Calientes: Descenso en bus y tiempo libre para almorzar, recorrer el pueblo o realizar compras.\n• 15:30 – 18:30 | Viaje en tren de retorno: Retorno en tren hacia la estación correspondiente.\n• 20:00 – 22:00 | Llegada a Cusco: Traslado hacia el centro histórico de Cusco y finalización del servicio."
      }
    ],
    inclusions: [
      "Recojo desde hoteles céntricos.",
      "Transporte turístico Cusco – estación de tren – Cusco.",
      "Boleto de tren turístico ida y vuelta.",
      "Bus de subida y bajada a Machu Picchu.",
      "Entrada a Machu Picchu (según disponibilidad de circuitos).",
      "Guía profesional bilingüe (español e inglés).",
      "Asistencia permanente durante todo el recorrido.",
      "Botiquín de primeros auxilios."
    ].map((c, i) => ({ order: i, content: c })),
    exclusions: [
      "Desayuno.",
      "Almuerzo.",
      "Bebidas adicionales.",
      "Entrada a Huayna Picchu o Montaña Machu Picchu (opcional y sujeto a disponibilidad).",
      "Gastos personales.",
      "Propinas (opcionales).",
      "Seguro de viaje."
    ].map((c, i) => ({ order: i, content: c })),
    recommendations: [
      "Documento de identidad o pasaporte original (obligatorio).",
      "Boleto de ingreso (si corresponde).",
      "Ropa cómoda.",
      "Casaca impermeable o poncho para lluvia.",
      "Zapatos cómodos o de trekking.",
      "Bloqueador solar.",
      "Lentes de sol.",
      "Sombrero o gorra.",
      "Repelente para insectos.",
      "Agua.",
      "Snacks.",
      "Dinero en efectivo para gastos adicionales.",
      "Cámara fotográfica o teléfono con batería suficiente."
    ].map((c, i) => ({ order: i, content: c })),
    faqs: [
      { order: 0, question: "¿La entrada a Machu Picchu está incluida?", answer: "Sí. Este paquete incluye el boleto de ingreso a Machu Picchu, sujeto a disponibilidad del circuito al momento de la reserva." },
      { order: 1, question: "¿Qué circuito recorreré?", answer: "El circuito dependerá de la disponibilidad establecida por el Ministerio de Cultura al momento de emitir el boleto." },
      { order: 2, question: "¿Está incluido el tren?", answer: "Sí. El tour incluye boleto de tren turístico de ida y vuelta." },
      { order: 3, question: "¿El bus de subida y bajada está incluido?", answer: "Sí. El transporte en bus entre Aguas Calientes y Machu Picchu está incluido." },
      { order: 4, question: "¿Puedo subir a Huayna Picchu?", answer: "Sí, pero requiere un boleto adicional que debe reservarse con varios meses de anticipación, ya que los cupos son limitados." },
      { order: 5, question: "¿Qué tan difícil es el recorrido?", answer: "El recorrido dentro de Machu Picchu tiene una dificultad de fácil a moderada. Existen escalinatas y caminos de piedra, por lo que se recomienda caminar con calma." },
      { order: 6, question: "¿Con cuánta anticipación debo reservar?", answer: "Se recomienda reservar con varias semanas o incluso meses de anticipación, especialmente durante la temporada alta, para asegurar la disponibilidad de entradas y trenes." }
    ]
  },
  {
    title: "Puente Inca Q'eswachaka",
    slug: "queshuachaca",
    description: "El Tour Qeswachaka es una de las experiencias culturales más auténticas de Cusco. Este recorrido te llevará a conocer el último puente colgante inca elaborado completamente con fibra vegetal (ichu), una tradición ancestral que las comunidades andinas mantienen viva y que ha sido reconocida como Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO.\nDurante el recorrido disfrutarás de impresionantes paisajes andinos, visitarás hermosas lagunas altoandinas y atravesarás pequeños pueblos tradicionales hasta llegar al majestuoso puente Qeswachaka, suspendido sobre el río Apurímac, donde podrás conocer de cerca una de las técnicas de ingeniería más sorprendentes heredadas del Imperio Inca.",
    duration: "1 Día",
    altitude: "3,700",
    difficulty: "Fácil",
    groupSize: "19",
    hasSharedService: true,
    sharedPrice: 70.0,
    hasPrivateService: true,
    bannerImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875494469-queshuachaca-banner.webp",
    cardImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875494469-queshuachaca-banner.webp",
    itineraries: [
      {
        order: 0,
        title: "Día 1: Excursión al Puente Inca de Queshuachaca y 4 Lagunas",
        content: "• 04:30 – 05:00 | Recojo en el hotel: Recojo desde hoteles ubicados en el centro histórico de Cusco.\n• 07:30 | Desayuno en Cusipata: Llegada a Cusipata para disfrutar de un desayuno andino.\n• 09:30 | Visita a las lagunas altoandinas: Recorrido panorámico por las lagunas Pomacanchi, Acopia, Asnaqocha y Pampamarca.\n• 12:00 | Visita al Puente Qeswachaka: Llegada al puente inca de Qeswachaka para conocer su historia, tradición ancestral y disfrutar de tiempo para fotografías.\n• 14:00 | Almuerzo en Cusipata: Retorno a Cusipata para disfrutar de un almuerzo tradicional.\n• 15:00 | Retorno a Cusco: Inicio del viaje de regreso hacia la ciudad.\n• 17:30 – 18:00 | Llegada a Cusco: Arribo al centro histórico de Cusco y finalización del servicio."
      }
    ],
    inclusions: [
      "Transporte turístico de ida y vuelta.",
      "Recojo desde hoteles céntricos.",
      "Guía profesional bilingüe (español e inglés).",
      "Desayuno.",
      "Almuerzo buffet.",
      "Botiquín de primeros auxilios.",
      "Asistencia permanente durante todo el recorrido."
    ].map((c, i) => ({ order: i, content: c })),
    exclusions: [
      "Entrada al Puente Qeswachaka.",
      "Bebidas adicionales.",
      "Gastos personales.",
      "Propinas (opcionales).",
      "Seguro de viaje."
    ].map((c, i) => ({ order: i, content: c })),
    recommendations: [
      "Documento de identidad o pasaporte.",
      "Ropa cómoda y abrigadora.",
      "Casaca impermeable o poncho para lluvia.",
      "Zapatos cómodos o de trekking.",
      "Bloqueador solar.",
      "Lentes de sol.",
      "Sombrero o gorra.",
      "Agua.",
      "Snacks.",
      "Dinero en efectivo para gastos adicionales.",
      "Cámara fotográfica o teléfono con batería suficiente."
    ].map((c, i) => ({ order: i, content: c })),
    faqs: [
      { order: 0, question: "¿Qué es el puente Qeswachaka?", answer: "Es el último puente colgante inca elaborado completamente con fibra vegetal (ichu), reconstruido cada año por comunidades locales siguiendo técnicas ancestrales transmitidas de generación en generación." },
      { order: 1, question: "¿La entrada está incluida?", answer: "Depende del operador turístico. En este paquete la entrada al puente no está incluida y debe pagarse en el ingreso al atractivo." },
      { order: 2, question: "¿Es necesario realizar caminatas largas?", answer: "No. El recorrido requiere caminatas cortas y de baja dificultad para llegar a los principales miradores y al puente." },
      { order: 3, question: "¿Se puede cruzar el puente?", answer: "Sí. Los visitantes pueden cruzar el puente siguiendo las indicaciones del guía y respetando las normas de seguridad establecidas por las autoridades locales." },
      { order: 4, question: "¿Cuál es la mejor época para realizar el tour?", answer: "La temporada seca, entre abril y octubre, ofrece mejores condiciones climáticas y vistas despejadas. Sin embargo, el recorrido se realiza durante todo el año." },
      { order: 5, question: "¿Es apto para niños y adultos mayores?", answer: "Sí. Es un tour de baja dificultad, recomendado para toda la familia. Se aconseja que las personas con vértigo crucen el puente únicamente si se sienten cómodas haciéndolo." },
      { order: 6, question: "¿Qué otros atractivos se visitan durante el recorrido?", answer: "Además del puente Qeswachaka, el tour incluye la visita panorámica a las lagunas de Pomacanchi, Acopia, Asnaqocha y Pampamarca, además de diversos paisajes y comunidades tradicionales de la región." }
    ]
  },
  {
    title: "Fortaleza de Waqrapukara",
    slug: "waqrapukara",
    description: "Waqrapukara es uno de los destinos arqueológicos y paisajísticos más impresionantes de Cusco. Su nombre, que en quechua significa 'Fortaleza en forma de Cuerno', hace referencia a las imponentes formaciones rocosas que rodean este antiguo santuario inca, ubicado sobre un profundo cañón.\nDurante este recorrido disfrutarás de un viaje por los hermosos paisajes de los Andes, atravesando comunidades tradicionales hasta llegar al punto de inicio de la caminata. Desde allí realizarás una caminata rodeada de montañas, valles y espectaculares vistas panorámicas hasta llegar al complejo arqueológico de Waqrapukara, donde conocerás su historia, arquitectura y la importancia ceremonial que tuvo durante el Imperio Inca.",
    duration: "1 Día",
    altitude: "4,300",
    difficulty: "Moderada",
    groupSize: "19",
    hasSharedService: true,
    sharedPrice: 90.0,
    hasPrivateService: true,
    bannerImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875486698-waqrapukara-banner.webp",
    cardImage: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875486698-waqrapukara-banner.webp",
    itineraries: [
      {
        order: 0,
        title: "Día 1: Excursión a la Fortaleza de Waqrapukara",
        content: "• 04:00 – 05:00 | Recojo en el hotel: Recojo desde hoteles ubicados en el centro histórico de Cusco.\n• 07:00 | Desayuno en Cusipata: Llegada a Cusipata para disfrutar de un desayuno andino.\n• 08:30 | Inicio de la caminata a Waqrapukara: Traslado al punto de inicio de la caminata e inicio del recorrido por senderos andinos con vistas al cañón del río Apurímac.\n• 10:30 | Llegada a Waqrapukara: Visita guiada del complejo arqueológico, tiempo para disfrutar del paisaje y tomar fotografías.\n• 11:30 | Retorno caminando: Inicio del descenso hacia el punto de encuentro con el transporte turístico.\n• 14:00 | Almuerzo en Cusipata: Disfrutaremos de un almuerzo tradicional antes del regreso.\n• 15:00 | Retorno a Cusco: Inicio del viaje de regreso hacia la ciudad.\n• 18:30 – 19:30 | Llegada a Cusco: Arribo al centro histórico de Cusco y finalización del servicio."
      }
    ],
    inclusions: [
      "Transporte turístico de ida y vuelta.",
      "Recojo desde hoteles céntricos.",
      "Guía profesional bilingüe (español e inglés).",
      "Desayuno.",
      "Almuerzo buffet.",
      "Botiquín de primeros auxilios.",
      "Asistencia permanente durante todo el recorrido."
    ].map((c, i) => ({ order: i, content: c })),
    exclusions: [
      "Entrada a Waqrapukara.",
      "Caballos para la caminata (opcional).",
      "Bebidas adicionales.",
      "Gastos personales.",
      "Propinas (opcionales).",
      "Seguro de viaje."
    ].map((c, i) => ({ order: i, content: c })),
    recommendations: [
      "Documento de identidad o pasaporte.",
      "Ropa cómoda y abrigadora en capas.",
      "Casaca impermeable o poncho para lluvia.",
      "Zapatos de trekking o calzado con buena tracción.",
      "Bloqueador solar.",
      "Lentes de sol.",
      "Sombrero o gorra.",
      "Agua (mínimo 1 litro).",
      "Snacks energéticos.",
      "Dinero en efectivo para gastos adicionales.",
      "Cámara fotográfica o teléfono con batería suficiente."
    ].map((c, i) => ({ order: i, content: c })),
    faqs: [
      { order: 0, question: "¿Qué tan difícil es la caminata?", answer: "La caminata tiene una dificultad moderada. El recorrido incluye algunos ascensos y descensos, por lo que se recomienda tener una condición física razonable." },
      { order: 1, question: "¿Es necesario tener experiencia en trekking?", answer: "No. El tour puede ser realizado por cualquier persona con un estado físico adecuado, caminando a su propio ritmo." },
      { order: 2, question: "¿Se pueden alquilar caballos?", answer: "Sí. En algunas temporadas los pobladores locales ofrecen caballos para facilitar parte de la caminata. Este servicio tiene un costo adicional y está sujeto a disponibilidad." },
      { order: 3, question: "¿Cuál es la mejor época para visitar Waqrapukara?", answer: "La temporada seca, entre abril y octubre, ofrece mejores conditions climáticas y vistas despejadas. Sin embargo, el tour opera durante todo el año." },
      { order: 4, question: "¿La entrada está incluida?", answer: "Depende del operador turístico. En este paquete la entrada no está incluida y debe pagarse en el puesto de control correspondiente." },
      { order: 5, question: "¿Puedo realizar el tour si recién llegué a Cusco?", answer: "Se recomienda permanecer al menos uno o dos días en Cusco antes de realizar el tour para favorecer la aclimatación a la altura." },
      { order: 6, question: "¿Es apto para niños y adultos mayores?", answer: "Sí, siempre que cuenten con una condición física adecuada. Si está disponible, pueden contratar el servicio de caballo para facilitar parte del recorrido." }
    ]
  }
];
