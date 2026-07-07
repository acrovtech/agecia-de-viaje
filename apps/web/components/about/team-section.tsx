import Image from 'next/image';
import Link from 'next/link';

const team = [
  {
    name: 'Elvis Garcia Herrera',
    role: 'Fundador & Guía Principal',
    image: '/fallback.svg',
  },
  {
    name: 'Ana Yupanqui',
    role: 'Especialista en Aventura',
    image: '/fallback.svg',
  },
  {
    name: 'Luis Huamán',
    role: 'Logística de Alta Montaña',
    image: '/fallback.svg',
  },
  {
    name: 'Sofia Quispe',
    role: 'Coordinadora de Sostenibilidad',
    image: '/fallback.svg',
  }
];

export function TeamSection() {
  return (
    <section className="py-24 bg-[#F9FAFA]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="section-title">Nuestro Equipo</h2>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-16 leading-relaxed">
          El equipo de INCA BOUND está formado por un selecto grupo de profesionales, plenamente comprometidos con la prestación de un servicio personalizado al cliente las 24 horas del día, garantizando que su viaje sea una experiencia única desde el primer momento.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {team.map((member, index) => (
            <div key={index} className="flex flex-col items-center group">
              <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden mb-6 shadow-md border-4 border-transparent group-hover:border-brand-teal transition-all duration-300">
                <Image 
                  src={member.image} 
                  alt={member.name} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold font-heading text-gray-900">{member.name}</h3>
                <p className="text-gray-500 font-medium mt-1">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

