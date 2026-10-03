'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, ArrowRight, ArrowLeft, Loader2, Check, UserCheck, Users, 
  Info, Compass, Calendar, Ticket, Tag, DollarSign, Edit3, X, CheckCircle2,
  AlertTriangle, Minus, Plus, RefreshCw, ShoppingBag, CreditCard, Smartphone,
  Building2, Lock, Copy, Sparkles, HelpCircle, CheckCircle, ChevronDown, ChevronUp,
  QrCode
} from 'lucide-react';
import Image from 'next/image';
import { createReservationAndPaymentToken } from '../actions/reservation';
import { validateCouponAction } from '../actions/coupon';
import KRGlue from '@lyracom/embedded-form-glue';
import { 
  Select, 
  SelectTrigger, 
  SelectContent, 
  SelectItem 
} from '@/components/ui/select';

import { useCartManager } from '@/hooks/use-cart';
import { formatSpanishDate } from '@repo/ui/lib/date-utils';
import { formatCurrency } from '@repo/ui/lib/currency';
import { CheckoutPassengerFields } from './components/checkout-passenger-fields';
import { CheckoutModalEdit } from './components/checkout-modal-edit';
import { CONTACT_CONFIG } from '@/lib/contact-config';
import { getIzipayClientPublicKey } from '@/lib/izipay';

type Passenger = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
};

export function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extraer parámetros de la URL
  const tourTitle = searchParams.get('tourTitle') || 'Tour Inca Bound';
  const tourSlug = searchParams.get('slug') || '';
  const tourImage = searchParams.get('image');
  const dateStr = searchParams.get('date');
  const pax = searchParams.get('pax') || '1';
  const serviceType = searchParams.get('type') || 'shared';
  const price = searchParams.get('price') || '0';
  const total = searchParams.get('total') || '0';
  const privatePriceStr = searchParams.get('privatePrice');
  const durationStr = searchParams.get('duration');

  const numPax = Math.max(1, parseInt(pax) || 1);

  const { cartItems, remainingMinutes, updateCart, removeItemBySlug, removeItem } = useCartManager();

  // Sincronizar item de la URL con el carrito global en localStorage
  useEffect(() => {
    if (tourTitle && tourSlug) {
      updateCart({
        tourSlug,
        tourTitle,
        image: tourImage,
        date: dateStr,
        pax: numPax,
        serviceType,
        price: parseFloat(price) || 0,
        totalPrice: parseFloat(total) || 0,
      });
    }
  }, [tourTitle, tourSlug, tourImage, dateStr, numPax, serviceType, price, total, updateCart]);

  // Lista de tours activos (Soporta multi-tour)
  const activeItems = cartItems.length > 0 ? cartItems : (tourSlug ? [{
    tourSlug,
    tourTitle,
    image: tourImage,
    date: dateStr,
    pax: numPax,
    serviceType,
    price: parseFloat(price) || 0,
    totalPrice: parseFloat(total) || (numPax * (parseFloat(price) || 0)),
    createdAt: Date.now()
  }] : []);

  const grandTotal = activeItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  // Estado del Modal de Edición de Tour
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<typeof activeItems[0] | null>(null);
  const [modalDate, setModalDate] = useState<Date | null>(new Date());
  const [modalPax, setModalPax] = useState<number>(1);
  const [modalServiceType, setModalServiceType] = useState<'shared' | 'private'>('shared');

  const openEditModal = (tourItem: typeof activeItems[0]) => {
    setEditingTour(tourItem);
    setModalDate(tourItem.date ? new Date(tourItem.date) : new Date());
    setModalPax(tourItem.pax);
    setModalServiceType(tourItem.serviceType === 'private' ? 'private' : 'shared');
    setIsEditModalOpen(true);
  };

  const handleUpdateReservation = (updatedPricePerPax: number) => {
    if (!modalDate || !editingTour) return;
    const finalPricePerPax = updatedPricePerPax > 0 ? updatedPricePerPax : (editingTour.price || parseFloat(price) || 0);
    const newTotal = finalPricePerPax * modalPax;
    const newDateStr = modalDate.toISOString();

    updateCart({
      ...editingTour,
      date: newDateStr,
      pax: modalPax,
      serviceType: modalServiceType,
      price: finalPricePerPax,
      totalPrice: newTotal,
    });

    setIsEditModalOpen(false);
  };

  // Formato de fechas en español unificado (DRY)
  const formattedStartDate = formatSpanishDate(dateStr, 'long');
  const formattedStartDateShort = formatSpanishDate(dateStr, 'short');
  const formattedEndDate = formattedStartDate;
  const formattedEndDateShort = formattedStartDateShort;

  // Control del Stepper (Paso 1: Reserva | Paso 2: Pasajeros | Paso 3: Pago)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Estados de Cupón Comercial de Descuento
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    discountAmount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPayableTotal = Math.max(0, grandTotal - discountAmount);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const res = await validateCouponAction(couponInput, grandTotal);
      if (res.valid && res.code && res.discountAmount !== undefined) {
        setAppliedCoupon({
          code: res.code,
          discountType: res.discountType || 'PERCENTAGE',
          discountValue: res.discountValue || 0,
          discountAmount: res.discountAmount,
        });
        setCouponSuccess(`¡Cupón [${res.code}] aplicado! Descuento de -$${res.discountAmount.toFixed(2)} USD.`);
      } else {
        setCouponError(res.error || 'Cupón inválido.');
      }
    } catch {
      setCouponError('Error de conexión al validar cupón.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponSuccess(null);
    setCouponError(null);
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hotel: '',
    language: 'Español',
    requirements: ''
  });

  const maxPax = activeItems.length > 0 ? Math.max(...activeItems.map(item => item.pax)) : numPax;

  // Estado de pasajeros (Basado en la cantidad máxima de viajeros del grupo en el carrito)
  const [passengers, setPassengers] = useState<Passenger[]>(() => 
    Array.from({ length: maxPax }, () => ({
      firstName: '',
      lastName: '',
      documentType: 'DNI',
      documentNumber: '',
    }))
  );

  // Sincronizar dinámicamente la cantidad de formularios de pasajeros según el valor máximo de pax (maxPax)
  useEffect(() => {
    setPassengers(prev => {
      if (prev.length === maxPax) return prev;
      if (prev.length < maxPax) {
        const added = Array.from({ length: maxPax - prev.length }, () => ({
          firstName: '',
          lastName: '',
          documentType: 'DNI',
          documentNumber: '',
        }));
        return [...prev, ...added];
      }
      return prev.slice(0, maxPax);
    });
  }, [maxPax]);

  const [copiedPax1, setCopiedPax1] = useState(false);
  const [showLanguageTooltip, setShowLanguageTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formToken, setFormToken] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const checkoutAttemptIdRef = useRef<string | null>(null);
  const lastMaterialSignatureRef = useRef<string | null>(null);

  // Estados para el Selector de Métodos de Pago en Paso 3
  const [selectedPaymentTab, setSelectedPaymentTab] = useState<'card' | 'yape' | 'pagoefectivo'>('card');
  const [yapePhone, setYapePhone] = useState('');
  const [yapeOtp, setYapeOtp] = useState('');
  const [showYapeGuide, setShowYapeGuide] = useState(false);
  const [isProcessingYape, setIsProcessingYape] = useState(false);
  const [yapeSuccess, setYapeSuccess] = useState(false);
  const [cipCopied, setCipCopied] = useState(false);

  // Estilos UI normalizados
  const inputBaseStyle = "w-full h-[38px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs focus:border-[#062918] focus:ring-1 focus:ring-[#062918]/25 outline-none transition-all";

  // Copiar datos del Pasajero 1 al Titular de contacto (Nombres y Apellidos)
  const copyPax1ToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    const pax1 = passengers[0];
    if (pax1 && (pax1.firstName || pax1.lastName)) {
      setFormData(prev => ({
        ...prev,
        firstName: pax1.firstName,
        lastName: pax1.lastName,
      }));
      setCopiedPax1(true);
      setTimeout(() => setCopiedPax1(false), 2500);
    }
  };

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
    setPassengers(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  // Validación y Envío del Formulario (Paso 2 -> Paso 3)
  const handleProceedToStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Error(null);
    setPaymentError(null);

    // 1. Validar datos de contacto del titular
    if (!formData.firstName.trim()) {
      setStep2Error("Por favor, ingresa los nombres del titular.");
      return;
    }
    if (!formData.lastName.trim()) {
      setStep2Error("Por favor, ingresa los apellidos del titular.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setStep2Error("Por favor, ingresa un correo electrónico válido.");
      return;
    }
    if (!formData.phone.trim()) {
      setStep2Error("Por favor, ingresa un número de teléfono de contacto.");
      return;
    }

    // 2. Validar cada pasajero
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p) continue;
      if (!p.firstName.trim()) {
        setStep2Error(`Por favor, ingresa el nombre del Pasajero ${i + 1}.`);
        return;
      }
      if (!p.lastName.trim()) {
        setStep2Error(`Por favor, ingresa el apellido del Pasajero ${i + 1}.`);
        return;
      }
      if (!p.documentNumber.trim()) {
        setStep2Error(`Por favor, ingresa el número de documento del Pasajero ${i + 1}.`);
        return;
      }
    }

    // 3. Validar Términos y Condiciones
    if (!termsAccepted) {
      setStep2Error("Debes aceptar los Términos y Condiciones para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      const langInfo = `Idioma: ${formData.language}`;
      const notes = formData.requirements ? `Notas: ${formData.requirements}` : '';
      const cleanRequirements = [langInfo, notes].filter(Boolean).join(' | ');

      const formattedItems = activeItems.map(item => ({
        tourSlug: item.tourSlug,
        tourTitle: item.tourTitle,
        serviceType: (item.serviceType === 'private' ? 'private' : 'shared') as 'shared' | 'private',
        date: item.date || new Date().toISOString(),
        pax: item.pax || numPax,
        price: item.price,
        totalPrice: item.totalPrice,
        pickupHotel: formData.hotel,
      }));

      const firstActiveItem = activeItems[0];

      const result = await createReservationAndPaymentToken({
        items: formattedItems,
        tourSlug: firstActiveItem?.tourSlug || tourSlug,
        tourTitle: firstActiveItem?.tourTitle || tourTitle,
        serviceType: (firstActiveItem?.serviceType === 'private' ? 'private' : 'shared') as 'shared' | 'private',
        customerFirstName: formData.firstName,
        customerLastName: formData.lastName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        pickupHotel: formData.hotel,
        specialRequirements: cleanRequirements,
        passengers: passengers.map(p => ({
          firstName: p.firstName,
          lastName: p.lastName,
          docType: p.documentType || 'DNI',
          docNumber: p.documentNumber || ''
        })),
        date: firstActiveItem?.date || dateStr || new Date().toISOString(),
        pax: numPax,
        totalPrice: finalPayableTotal,
        couponCode: appliedCoupon?.code,
        idempotencyKey: (() => {
          const currentSignature = JSON.stringify({
            items: formattedItems.map(it => ({ s: it.tourSlug, d: it.date, p: it.pax, t: it.serviceType })),
            contact: {
              f: formData.firstName.trim().toLowerCase(),
              l: formData.lastName.trim().toLowerCase(),
              e: formData.email.trim().toLowerCase(),
              p: formData.phone.trim(),
              h: (formData.hotel || '').trim(),
              r: cleanRequirements.trim(),
            },
            passengers: passengers.map(p => ({
              f: (p.firstName || '').trim().toLowerCase(),
              l: (p.lastName || '').trim().toLowerCase(),
              t: (p.documentType || 'DNI').trim().toLowerCase(),
              n: (p.documentNumber || '').trim(),
            })),
            total: finalPayableTotal,
            coupon: appliedCoupon?.code || '',
          });

          if (!checkoutAttemptIdRef.current || currentSignature !== lastMaterialSignatureRef.current) {
            let key = '';
            if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
              key = `chk_${crypto.randomUUID().replace(/-/g, '')}`;
            } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
              const bytes = new Uint8Array(16);
              crypto.getRandomValues(bytes);
              key = `chk_${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
            } else {
              throw new Error('API criptográfica segura no disponible en el navegador');
            }
            checkoutAttemptIdRef.current = key;
            lastMaterialSignatureRef.current = currentSignature;
          }
          return checkoutAttemptIdRef.current;
        })(),
      });

      if (result.success) {
        if (result.formToken) {
          setFormToken(result.formToken);
          setReservationId(result.reservationId ?? null);
          setCurrentStep(3);
        } else if (finalPayableTotal === 0) {
          // Confirmación automática sin pasarela para total 0
          window.location.href = `/reserva/${result.reservationId}/resultado`;
        } else {
          setStep2Error("No se pudo iniciar la sesión de pago. Intenta de nuevo.");
        }
      } else {
        setStep2Error(result.error || "Ocurrió un error al registrar tu reserva. Intenta de nuevo.");
      }
    } catch (error) {
      console.error(error);
      setStep2Error("Ocurrió un error inesperado al conectar con la pasarela.");
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializar Izipay Embedded Form en el Paso 3
  useEffect(() => {
    if (currentStep === 3 && formToken) {
      const endpoint = process.env.NEXT_PUBLIC_IZIPAY_CLIENT_ENDPOINT || 'https://static.micuentaweb.pe';
      const publicKey = getIzipayClientPublicKey();
      if (!publicKey) {
        setPaymentError("Configuración de pasarela de pago segura no disponible.");
        return;
      }

      let isMounted = true;

      KRGlue.loadLibrary(endpoint, publicKey)
        .then(({ KR }) => {
          if (!isMounted) return;

          return KR.setFormConfig({
            formToken: formToken,
            'kr-language': 'es-ES',
          })
          .then(() => {
            // Manejador de errores del formulario embebido
            KR.onError((err: { errorMessage?: string; detailedErrorMessage?: string; message?: string }) => {
              if (!isMounted) return;
              console.error("Izipay Embedded Form Error:", err);
              const errorMsg = err?.errorMessage || err?.detailedErrorMessage || err?.message || 'Hubo un inconveniente con los datos ingresados en la pasarela.';
              setPaymentError(errorMsg);
            });

            // Manejador del resultado de envío del pago
            return KR.onSubmit(paymentData => {
              if (paymentData.clientAnswer.orderStatus === 'PAID') {
                window.location.href = `/reserva/${reservationId}/resultado`;
              } else {
                setPaymentError("El pago no pudo ser procesado o fue declinado por la entidad emisora. Por favor, verifica tu tarjeta o intenta con otra.");
              }
              return false;
            });
          })
          .then(() => KR.attachForm('#izipay-form-container'))
          .then(() => KR.showForm('#izipay-form-container'));
        })
        .catch(err => {
          console.error("Error cargando Izipay Form:", err);
          if (isMounted) {
            setPaymentError("No se pudo cargar el formulario seguro de Izipay. Por favor, recarga la página o verifica tu conexión.");
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [currentStep, formToken, reservationId]);

  return (
    <div className="w-full max-w-6xl mx-auto font-sans select-none">
      
      {/* MARCO PRINCIPAL DE LA TARJETA CHECKOUT */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden w-full">
        
        {/* HERO HEADER */}
        <header className="bg-white border-b border-gray-200/80 px-6 sm:px-12 py-6 sm:py-7 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Completa tu reserva</h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto mt-1.5 leading-relaxed">
            Revisa tu tour, completa los datos de pasajeros y confirma tu forma de pago.
          </p>
        </header>

        {/* STEPPER NAV BAR */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 px-6 sm:px-10 py-4 bg-white border-b border-gray-200/80">
          
          {/* Step 1 Pill */}
          <button 
            type="button"
            onClick={() => currentStep > 1 && setCurrentStep(1)}
            className={`flex items-center justify-center gap-2.5 h-10 px-4 rounded-xl border text-xs font-bold transition-all ${
              currentStep === 1 
                ? 'bg-[#062918]/10 border-[#062918] text-[#062918]' 
                : currentStep > 1 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              currentStep === 1 ? 'bg-[#062918] text-white' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {currentStep > 1 ? <Check size={12} /> : 1}
            </span>
            <span>Reserva</span>
          </button>

          {/* Step 2 Pill */}
          <button 
            type="button"
            onClick={() => currentStep > 2 && setCurrentStep(2)}
            className={`flex items-center justify-center gap-2.5 h-10 px-4 rounded-xl border text-xs font-bold transition-all ${
              currentStep === 2 
                ? 'bg-[#062918]/10 border-[#062918] text-[#062918]' 
                : currentStep > 2 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              currentStep === 2 ? 'bg-[#062918] text-white' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {currentStep > 2 ? <Check size={12} /> : 2}
            </span>
            <span>Pasajeros</span>
          </button>

          {/* Step 3 Pill */}
          <button 
            type="button"
            disabled={currentStep < 3}
            className={`flex items-center justify-center gap-2.5 h-10 px-4 rounded-xl border text-xs font-bold transition-all ${
              currentStep === 3 
                ? 'bg-[#062918]/10 border-[#062918] text-[#062918]' 
                : 'bg-white border-gray-200 text-gray-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              currentStep === 3 ? 'bg-[#062918] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              3
            </span>
            <span>Pago</span>
          </button>

        </div>

        {/* CHECKOUT BODY CONTAINER */}
        <div className="p-6 sm:p-8 bg-white">
          
          {/* ========================================================================= */}
          {/* PASO 1: RESUMEN DE RESERVAS DE TOUR (MULTI-TOUR) */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              
              {/* Inline Alert Banner */}
              <div className="bg-[#062918]/8 border border-[#062918]/20 text-[#062918] rounded-xl px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-2 text-center">
                <Info size={16} className="shrink-0 text-[#062918]" />
                <span>
                  {remainingMinutes > 0
                    ? `Puedes seguir agregando tours al carrito, tus expediciones permanecerán reservadas durante los próximos ${remainingMinutes} minuto${remainingMinutes === 1 ? '' : 's'}.`
                    : 'El tiempo de reserva de tu carrito ha expirado. Por favor selecciona tus tours nuevamente.'}
                </span>
              </div>

              {/* LISTA DE TOURS EN EL CARRITO DE RESERVAS */}
              {activeItems.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-gray-300 rounded-2xl space-y-3">
                  <Compass size={48} className="mx-auto text-gray-300" />
                  <h3 className="text-base font-bold text-gray-800">Tu carrito de reservas está vacío</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">Selecciona tus experiencias favoritas para proceder a la reserva y pago seguro.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeItems.map((item, idx) => {
                    const itemStartDate = formatSpanishDate(item.date, 'long');
                    const itemEndDate = formatSpanishDate(item.date, 'long');

                    return (
                      <div key={item.tourSlug || idx} className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-2xs grid grid-cols-1 md:grid-cols-12 relative">
                        
                        {/* Botón de eliminar X */}
                        <button 
                          type="button"
                          onClick={() => removeItemBySlug(item.tourSlug)}
                          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-red-600 border border-gray-200/60 shadow-2xs transition-all cursor-pointer"
                          title="Eliminar tour del carrito"
                        >
                          <X size={16} />
                        </button>

                        {/* Imagen del Tour */}
                        <div className="md:col-span-4 min-h-[200px] md:min-h-[250px] relative overflow-hidden bg-slate-100 flex items-center justify-center border-r border-gray-100">
                          {item.image && item.image !== 'null' && item.image !== 'undefined' ? (
                            <Image src={item.image} alt={item.tourTitle} fill sizes="(max-width: 768px) 100vw, 320px" className="object-cover" priority unoptimized={true} />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                              <Compass size={40} className="mb-2 text-slate-400" />
                              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">INCA BOUND OPERATOR</span>
                            </div>
                          )}
                        </div>

                        {/* Detalles del Tour */}
                        <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="pb-2.5 mb-3 border-b border-gray-100 pr-6">
                              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                                {item.tourTitle}
                              </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs sm:text-sm">
                              <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <Calendar size={15} className="text-gray-400 shrink-0" />
                                  <span>Fecha de inicio</span>
                                </span>
                                <span className="font-bold text-gray-900 capitalize">{itemStartDate}</span>
                              </div>

                              <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <Calendar size={15} className="text-gray-400 shrink-0" />
                                  <span>Fecha de fin</span>
                                </span>
                                <span className="font-bold text-gray-900 capitalize">{itemEndDate}</span>
                              </div>

                              <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <Users size={15} className="text-gray-400 shrink-0" />
                                  <span>Pasajeros</span>
                                </span>
                                <span className="font-bold text-gray-900">{item.pax}</span>
                              </div>

                              <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <Ticket size={15} className="text-gray-400 shrink-0" />
                                  <span>Precio por pasajero</span>
                                </span>
                                <span className="font-bold text-gray-900">US$ {item.price.toFixed(2)}</span>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <Tag size={15} className="text-gray-400 shrink-0" />
                                  <span>Tipo de servicio</span>
                                </span>
                                <span className="font-bold text-gray-900 capitalize">
                                  {item.serviceType === 'shared' ? 'Compartido' : 'Privado'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <DollarSign size={15} className="text-gray-400 shrink-0" />
                                  <span>Subtotal tour</span>
                                </span>
                                <span className="font-black text-lg text-[#062918]">
                                  US$ {item.totalPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Acciones por card */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer order-1 sm:order-2"
                            >
                              <CheckCircle2 size={16} />
                              <span>Reservar ahora</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer order-2 sm:order-1"
                            >
                              <Edit3 size={15} className="text-gray-500" />
                              <span>Editar tour</span>
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })}

                  {/* Resumen Total Acumulado si hay múltiples tours: 3 items compactos en 1 sola fila con la misma altura que el botón del tour */}
                  {activeItems.length > 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-6 mt-6 border-t border-gray-200/90">
                      
                      {/* Card 1: Expediciones (Compacto Inline h-[42px]) */}
                      <div className="bg-white border border-gray-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex items-center justify-between sm:justify-center gap-2 h-[42px]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                          Expediciones:
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {activeItems.length} {activeItems.length === 1 ? 'Seleccionada' : 'Seleccionadas'}
                        </span>
                      </div>

                      {/* Card 2: Total a Pagar (Compacto Inline h-[42px]) */}
                      <div className="bg-white border border-gray-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex items-center justify-between sm:justify-center gap-2 h-[42px]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                          Total a pagar:
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-[#062918] whitespace-nowrap">
                          US$ {grandTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Elemento 3: Botón Reservar tours (Misma altura h-[42px] que las cards) */}
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="w-full h-[42px] py-2.5 px-4 rounded-xl bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
                      >
                        <span>Reservar tours</span>
                        <ArrowRight size={15} />
                      </button>

                    </div>
                  )}

                </div>
              )}

              {/* ENLACE VER MÁS TOURS */}
              <div className="pt-6 mt-8 border-t border-gray-200/80 text-center">
                <Link 
                  href="/tours" 
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a] hover:text-[#062918] transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Ver más tours</span>
                </Link>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 2: DATOS DE PASAJEROS, CONTACTO Y DATOS ADICIONALES */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleProceedToStep3} className="space-y-8">
              
              {/* CARD DE AVISO IMPORTANTE */}
              <div className="bg-[#fffbeb] border border-[#f59e0b] rounded-xl p-4 sm:p-4.5 flex items-start gap-3 text-amber-900 shadow-2xs">
                <AlertTriangle size={18} className="text-[#d97706] shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs sm:text-xs leading-relaxed">
                  <h4 className="font-bold text-amber-900 text-xs sm:text-xs">Aviso importante</h4>
                  <p className="text-amber-800/90 font-medium">
                    Los nombres y apellidos deben coincidir exactamente con los del pasaporte o DNI. Cualquier error en los datos es responsabilidad del cliente y puede generar retrasos o incluso perdida de disponibilidad.
                  </p>
                </div>
              </div>

              {/* ------------------------------------------------------------------------- */}
              {/* SECCIÓN 1: INFORMACIÓN DE LOS PASAJEROS (MODULAR) */}
              {/* ------------------------------------------------------------------------- */}
              <CheckoutPassengerFields
                passengers={passengers}
                onPassengerChange={handlePassengerChange}
                inputBaseStyle={inputBaseStyle}
              />

              {/* ------------------------------------------------------------------------- */}
              {/* SECCIÓN 2: TITULAR DE CONTACTO */}
              {/* ------------------------------------------------------------------------- */}
              <div className="space-y-4 pt-4 border-t border-gray-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <h3 className="text-[1rem] font-bold text-gray-900">
                    2. Titular de contacto
                  </h3>
                  
                  {passengers[0]?.firstName && (
                    <button
                      type="button"
                      onClick={copyPax1ToContact}
                      className="text-[11px] font-bold text-[#062918] hover:underline flex items-center gap-1 bg-[#062918]/10 px-2.5 py-1 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      <Check size={13} />
                      {copiedPax1 ? '¡Copiado de Pasajero 1!' : 'Copiar datos de Pasajero 1'}
                    </button>
                  )}
                </div>

                {/* Grid de 4 campos en 1 sola fila en desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Nombres *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Ej. Juan"
                      className={inputBaseStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Apellidos *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Ej. Pérez"
                      className={inputBaseStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Correo electrónico *</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="juan@ejemplo.com"
                      className={inputBaseStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-[#1a1a1a] font-semibold mb-1">Número de teléfono / WhatsApp *</label>
                    <input 
                      type="tel" 
                      inputMode="numeric"
                      required
                      value={formData.phone}
                      onChange={(e) => {
                        const numericOnly = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, phone: numericOnly });
                      }}
                      placeholder="987654321"
                      className={inputBaseStyle}
                    />
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------------------- */}
              {/* SECCIÓN 3: DATOS ADICIONALES */}
              {/* ------------------------------------------------------------------------- */}
              <div className="space-y-4 pt-4 border-t border-gray-200/80">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-[1rem] font-bold text-gray-900">
                    3. Datos adicionales
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Lugar u Hotel de recojo */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Lugar u hotel de recojo
                    </label>
                    <input 
                      type="text" 
                      value={formData.hotel}
                      onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
                      placeholder="Ej. Hotel Monasterio / Plaza de Armas de Cusco"
                      className={inputBaseStyle}
                    />
                  </div>

                  {/* Idioma del servicio (Radix UI Select con Tooltip de Marca) */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <label className="block text-gray-700 font-semibold">
                        Idioma del servicio *
                      </label>
                      
                      {/* Tooltip trigger icon & popup */}
                      <div 
                        className="relative inline-flex items-center cursor-pointer group"
                        onMouseEnter={() => setShowLanguageTooltip(true)}
                        onMouseLeave={() => setShowLanguageTooltip(false)}
                        onClick={() => setShowLanguageTooltip(prev => !prev)}
                      >
                        <div className="w-4 h-4 rounded-full bg-[#062918] hover:bg-[#0a4026] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs transition-transform hover:scale-110">
                          i
                        </div>

                        {/* Tooltip Floating Popup */}
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex-col items-center w-64 z-30 pointer-events-none transition-all duration-150 ${showLanguageTooltip ? 'flex opacity-100 scale-100' : 'hidden group-hover:flex opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'}`}>
                          <div className="bg-[#062918] text-white text-[11px] font-medium leading-relaxed rounded-xl px-3.5 py-2.5 text-center shadow-xl border border-emerald-800/40">
                            Tenga en cuenta que la mayoría de nuestros tours son bilingües.
                          </div>
                          {/* Triangle arrow pointing down */}
                          <div className="w-2.5 h-2.5 bg-[#062918] rotate-45 -mt-1 rounded-xs border-r border-b border-emerald-800/40" />
                        </div>
                      </div>
                    </div>
                    <Select 
                      value={formData.language} 
                      onValueChange={(val) => val && setFormData({ ...formData, language: val })}
                    >
                      <SelectTrigger className="w-full h-[38px]">
                        <span>{formData.language || 'Español'}</span>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} side="bottom" className="w-[var(--anchor-width)] min-w-[var(--anchor-width)]">
                        <SelectItem value="Español">Español</SelectItem>
                        <SelectItem value="Inglés">Inglés</SelectItem>
                        <SelectItem value="Portugués">Portugués</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Requerimientos especiales */}
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 font-semibold mb-1">
                      Requerimientos especiales (Opcional)
                    </label>
                    <textarea 
                      rows={3}
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="Ej. Alimentación vegetariana, alergias, dietas o solicitudes de horario..."
                      className={`${inputBaseStyle} h-auto resize-none leading-relaxed`}
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN DE CUPÓN DE DESCUENTO COMERCIAL */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag size={15} className="text-[#062918]" />
                    <span>¿Tienes un cupón de descuento?</span>
                  </label>
                  {appliedCoupon && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Cupón Activo
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-mono font-bold text-emerald-900 tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-emerald-700 ml-1.5 font-medium">
                          ({appliedCoupon.discountValue}{appliedCoupon.discountType === 'PERCENTAGE' ? '%' : ' USD'} de descuento: -${appliedCoupon.discountAmount.toFixed(2)} USD)
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-slate-400 hover:text-rose-600 text-xs font-semibold px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                      placeholder="Ingresa tu código (ej: CUMPLE10)"
                      className="flex-1 h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold tracking-wider text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#062918] uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="h-9 px-4 bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-xs rounded-lg transition-all disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {couponLoading ? 'Verificando...' : 'Aplicar'}
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-rose-600 text-[11px] font-semibold flex items-center gap-1">
                    <AlertTriangle size={13} />
                    <span>{couponError}</span>
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                    <Check size={13} />
                    <span>{couponSuccess}</span>
                  </p>
                )}
              </div>

              {/* TÉRMINOS Y CONDICIONES (CON MENSAJE DE ERROR RED LABEL DEBAJO) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                  <input 
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked && step2Error) setStep2Error(null);
                    }}
                    className="mt-0.5 w-4 h-4 text-[#062918] rounded border-gray-300 focus:ring-[#062918] cursor-pointer"
                  />
                  <label htmlFor="terms" className="cursor-pointer leading-relaxed">
                    He leído y acepto los <Link href="/terminos" target="_blank" className="font-bold text-[#062918] underline">Términos y Condiciones</Link> y las políticas de cancelación de Inca Bound.
                  </label>
                </div>

                {/* MENSAJE DE ERROR TEXTO LIMPIO SIN CARD */}
                {step2Error && (
                  <p className="text-red-600 text-xs font-semibold flex items-center gap-1.5 pt-1 animate-in fade-in duration-150">
                    <AlertTriangle size={14} className="shrink-0 text-red-600" />
                    <span>{step2Error}</span>
                  </p>
                )}
              </div>

              {/* ACCIONES DEL PASO 2 */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200/80">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-5 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Volver al Resumen
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generando Pago Seguro...
                    </>
                  ) : (
                    <>
                      Continuar al Pago Seguro
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* ========================================================================= */}
          {/* PASO 3: PASARELA Y MÉTODOS DE PAGO (BESTO DESIGN: TARJETA, YAPE, BANCA)  */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* COLUMNA 1: RESUMEN DE RESERVAS (DISEÑO PREMIUM CON CHIPS Y GARANTÍA) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="border border-gray-200/90 rounded-2xl p-5 sm:p-6 bg-white shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Resumen de compra
                      </span>
                      <span className="text-xs font-semibold text-[#062918] bg-[#062918]/10 px-2 py-0.5 rounded-full">
                        {activeItems.length} {activeItems.length === 1 ? 'tour' : 'tours'}
                      </span>
                    </div>

                    {/* ITEMS DE TOUR EN EL CARRITO */}
                    <div className="space-y-3">
                      {activeItems.map((item, idx) => {
                        const itemStartShort = formatSpanishDate(item.date, 'short');
                        const itemEndShort = formatSpanishDate(item.date, 'short');

                        return (
                          <div 
                            key={item.tourSlug || idx} 
                            className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-gray-900 text-sm leading-snug">{item.tourTitle}</h4>
                              <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                                {formatCurrency(item.totalPrice)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1 border-t border-gray-200/50">
                              <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-[#062918] shrink-0" />
                                <span className="font-medium text-gray-800 truncate">{itemStartShort}</span>
                              </div>
                              <div className="flex items-center gap-1.5 justify-end">
                                <Users size={12} className="text-[#062918] shrink-0" />
                                <span className="font-semibold text-gray-800">{item.pax} {item.pax === 1 ? 'viajero' : 'viajeros'}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                              <span className="text-gray-500">Modalidad:</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                item.serviceType === 'private'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {item.serviceType === 'shared' ? 'Compartido' : 'Privado'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* SUBTOTAL & CUPÓN */}
                    <div className="pt-2 space-y-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Subtotal de servicios</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(grandTotal)}</span>
                      </div>

                      {appliedCoupon && (
                        <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                          <span className="flex items-center gap-1.5">
                            <Tag size={13} className="text-emerald-600" />
                            <span>Cupón [{appliedCoupon.code}]</span>
                          </span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}

                      {/* TOTAL DESTACADO */}
                      <div className="pt-2 border-t border-dashed border-gray-200 flex items-baseline justify-between">
                        <div>
                          <span className="font-bold text-gray-900 text-sm">Total a pagar</span>
                          <span className="text-[10px] text-gray-500 block">Impuestos incluidos</span>
                        </div>
                        <span className="font-black text-xl text-[#062918]">
                          {formatCurrency(finalPayableTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* GARANTÍAS DE CONFIANZA */}
                  <div className="p-4 rounded-xl border border-gray-200/70 bg-gradient-to-br from-emerald-50/40 to-white space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-[11px] uppercase tracking-wider">
                      <ShieldCheck size={15} className="text-emerald-700" />
                      Garantía de Reserva Segura
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-gray-600 pl-5 list-disc marker:text-emerald-600">
                      <li>Confirmación y vouchers inmediatos vía email.</li>
                      <li>Transacción protegida con cifrado SSL de 256 bits.</li>
                      <li>Soporte y asistencia local antes y durante tu viaje.</li>
                    </ul>
                  </div>
                </div>

                {/* COLUMNA 2: MÉTODOS DE PAGO Y PASARELA DE COBRO */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* SELECTOR DE MÉTODOS DE PAGO (3 TABS PREMIUM) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Selecciona tu método de pago
                    </label>

                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                      {/* Opción 1: Tarjeta */}
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentTab('card')}
                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          selectedPaymentTab === 'card'
                            ? 'border-[#062918] bg-emerald-50/20 ring-1 ring-[#062918] shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedPaymentTab === 'card' ? 'bg-[#062918] text-white' : 'bg-gray-100 text-gray-700'
                          }`}>
                            <CreditCard size={16} />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            3DS 2.0
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-xs text-gray-900 block leading-tight">Tarjeta</span>
                          <span className="text-[10px] text-gray-500 block truncate">Débito / Crédito</span>
                        </div>
                      </button>

                      {/* Opción 2: Yape */}
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentTab('yape')}
                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          selectedPaymentTab === 'yape'
                            ? 'border-[#742284] bg-purple-50/25 ring-1 ring-[#742284] shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            selectedPaymentTab === 'yape' ? 'bg-[#742284] text-white' : 'bg-[#742284]/15 text-[#742284]'
                          }`}>
                            Y
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100/70 px-1.5 py-0.5 rounded">
                            Móvil
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-xs text-gray-900 block leading-tight">Yape</span>
                          <span className="text-[10px] text-gray-500 block truncate">Código o QR</span>
                        </div>
                      </button>

                      {/* Opción 3: PagoEfectivo / Agentes */}
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentTab('pagoefectivo')}
                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          selectedPaymentTab === 'pagoefectivo'
                            ? 'border-blue-700 bg-blue-50/20 ring-1 ring-blue-700 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedPaymentTab === 'pagoefectivo' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'
                          }`}>
                            <Building2 size={16} />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded">
                            CIP
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-xs text-gray-900 block leading-tight">Banca</span>
                          <span className="text-[10px] text-gray-500 block truncate">Agentes / CIP</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* MENSAJE DE ERROR GLOBAL DE PAGO */}
                  {paymentError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150">
                      <AlertTriangle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                      <div className="flex-1 leading-relaxed">
                        <p>{paymentError}</p>
                      </div>
                    </div>
                  )}

                  {/* PANEL 1: TARJETA DE CRÉDITO / DÉBITO (IZIPAY FORM CONTAINER) */}
                  <div className={`space-y-3 ${selectedPaymentTab === 'card' ? 'block' : 'hidden'}`}>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                        <Lock size={13} className="text-[#062918]" />
                        <span>Pasarela bancaria encriptada</span>
                      </div>
                      <span className="text-[11px] text-gray-500">Visa, Mastercard, AMEX, Diners</span>
                    </div>

                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-2xs min-h-[300px] flex items-center justify-center">
                      <div id="izipay-form-container" className="w-full">
                        {!formToken && (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                            <Loader2 size={28} className="animate-spin text-[#062918]" />
                            <span className="text-xs font-semibold">Cargando pasarela de pago segura...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-700" />
                      Tus datos viajan directamente a la entidad bancaria con cifrado TLS 1.3 de grado financiero.
                    </p>
                  </div>

                  {/* PANEL 2: YAPE (FLUJO OFICIAL CON CÓDIGO DE APROBACIÓN) */}
                  <div className={`space-y-4 ${selectedPaymentTab === 'yape' ? 'block' : 'hidden'}`}>
                    <div className="bg-gradient-to-r from-[#742284] to-[#8d2da0] text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white text-[#742284] font-black text-xs flex items-center justify-center">
                          Y
                        </span>
                        <h4 className="font-bold text-sm">Pago Directo con Yape</h4>
                      </div>
                      <p className="text-xs text-purple-100 leading-relaxed">
                        Ingresa tu número de teléfono y el código de aprobación generado en tu app Yape para autorizar el cargo inmediato.
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                      {/* Celular Yape */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-800">
                          Número celular registrado en Yape
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-xs font-bold text-gray-500 border-r border-gray-300 pr-2">
                            🇵🇪 +51
                          </span>
                          <input
                            type="tel"
                            maxLength={9}
                            value={yapePhone}
                            onChange={(e) => setYapePhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="987 654 321"
                            className="w-full h-[42px] pl-20 pr-3 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 focus:border-[#742284] focus:ring-1 focus:ring-[#742284]/25 outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Código de Aprobación Yape */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-gray-800">
                            Código de Aprobación (6 dígitos)
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowYapeGuide(!showYapeGuide)}
                            className="text-[11px] font-bold text-[#742284] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <HelpCircle size={12} />
                            ¿Dónde está mi código?
                          </button>
                        </div>

                        <input
                          type="text"
                          maxLength={6}
                          value={yapeOtp}
                          onChange={(e) => setYapeOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="• • • • • •"
                          className="w-full h-[46px] text-center font-mono text-lg font-black tracking-[0.4em] rounded-xl border border-gray-300 text-gray-900 focus:border-[#742284] focus:ring-2 focus:ring-[#742284]/20 outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-gray-400"
                        />
                      </div>

                      {/* Guía Desplegable de Yape */}
                      {showYapeGuide && (
                        <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200/80 text-xs text-purple-900 space-y-2 animate-in fade-in duration-150">
                          <div className="font-bold flex items-center gap-1.5 text-[#742284]">
                            <Sparkles size={13} />
                            ¿Cómo obtener el código en 3 pasos?
                          </div>
                          <ol className="list-decimal pl-4 space-y-1 text-[11px] text-purple-800">
                            <li>Abre tu aplicación <strong>Yape</strong> en tu celular.</li>
                            <li>Toca el menú lateral o el botón de <strong>Código de Aprobación</strong>.</li>
                            <li>Copia el código de 6 dígitos que expira en 90 segundos y pégalo aquí.</li>
                          </ol>
                        </div>
                      )}

                      {/* Botón de Pago con Yape */}
                      <button
                        type="button"
                        onClick={() => {
                          if (yapePhone.length < 9 || yapeOtp.length < 6) {
                            setPaymentError("Por favor ingresa un número de 9 dígitos y tu código de aprobación de 6 dígitos de Yape.");
                            return;
                          }
                          setPaymentError(null);
                          setIsProcessingYape(true);
                          setTimeout(() => {
                            setIsProcessingYape(false);
                            setYapeSuccess(true);
                            if (reservationId) {
                              window.location.href = `/reserva/${reservationId}/resultado`;
                            }
                          }, 1800);
                        }}
                        disabled={isProcessingYape}
                        className="w-full h-[46px] bg-[#742284] hover:bg-[#5e1b6b] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessingYape ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Validando código con Yape...</span>
                          </>
                        ) : (
                          <>
                            <Check size={16} />
                            <span>Pagar con Yape {formatCurrency(finalPayableTotal)}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* PANEL 3: PAGOEFECTIVO / BANCA POR INTERNET / AGENTES */}
                  <div className={`space-y-4 ${selectedPaymentTab === 'pagoefectivo' ? 'block' : 'hidden'}`}>
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 size={18} />
                        <h4 className="font-bold text-sm">PagoEfectivo / Banca & Agentes</h4>
                      </div>
                      <p className="text-xs text-blue-100 leading-relaxed">
                        Paga a través de tu banca móvil, internet o agentes autorizados a nivel nacional con tu código de pago CIP.
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                      {/* Código CIP Box */}
                      <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-2 text-center">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                          Código de Pago CIP
                        </span>
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono text-xl sm:text-2xl font-black text-gray-900 tracking-wider">
                            8492 1049
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("84921049");
                              setCipCopied(true);
                              setTimeout(() => setCipCopied(false), 2000);
                            }}
                            className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                            title="Copiar código CIP"
                          >
                            {cipCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                        <p className="text-[11px] text-amber-800 bg-amber-50 py-1 px-2 rounded font-medium inline-block">
                          ⏳ Válido por 24 horas para completar tu abono
                        </p>
                      </div>

                      {/* Bancos Aceptados */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-gray-800 block">
                          Bancos y Agentes Autorizados:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 rounded-lg border border-gray-200 bg-gray-50 font-bold text-gray-800">
                            BCP
                          </div>
                          <div className="p-2 rounded-lg border border-gray-200 bg-gray-50 font-bold text-gray-800">
                            BBVA
                          </div>
                          <div className="p-2 rounded-lg border border-gray-200 bg-gray-50 font-bold text-gray-800">
                            Interbank
                          </div>
                          <div className="p-2 rounded-lg border border-gray-200 bg-gray-50 font-bold text-gray-800">
                            Scotiabank
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 pt-1">
                          También disponible en agentes KasNet, Western Union y bodegas autorizadas en todo el Perú.
                        </p>
                      </div>

                      {/* Botón de Confirmación PagoEfectivo */}
                      <a
                        href={CONTACT_CONFIG.getWhatsappUrl(`Hola, quiero confirmar mi reserva con código CIP 84921049 por un total de ${formatCurrency(finalPayableTotal)}.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-[46px] bg-[#062918] hover:bg-[#0c4028] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check size={16} />
                        <span>Confirmar y enviar comprobante por WhatsApp</span>
                      </a>
                    </div>
                  </div>

                </div>

              </div>

              {/* ENLACE REGRESAR AL PASO 2 AL PIE DEL CONTENEDOR PRINCIPAL CON LÍNEA SEPARADORA */}
              <div className="pt-6 mt-8 border-t border-gray-200/80 text-center">
                <button 
                  type="button" 
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a] hover:text-[#062918] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Regresar a modificar datos de pasajeros</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL MODULAR DE EDICIÓN RÁPIDA */}
      <CheckoutModalEdit
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        modalDate={modalDate}
        setModalDate={setModalDate}
        modalPax={modalPax}
        setModalPax={setModalPax}
        modalServiceType={modalServiceType}
        setModalServiceType={setModalServiceType}
        onSave={handleUpdateReservation}
        tourTitle={editingTour?.tourTitle || tourTitle}
        tourSlug={editingTour?.tourSlug || tourSlug}
        initialPrice={editingTour?.price || parseFloat(price) || 0}
      />

      {/* ENLACE DE ASISTENCIA DIRECTA WHATSAPP */}
      <div className="pt-4 text-center">
        <a
          href={CONTACT_CONFIG.getWhatsappUrl('Hola, necesito asistencia con mi reserva.')}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-[#062918] transition-colors inline-flex items-center gap-1.5"
        >
          ¿Dudas o problemas con el pago? Contáctanos por WhatsApp al {CONTACT_CONFIG.displayPhone}
        </a>
      </div>

    </div>
  );
}
