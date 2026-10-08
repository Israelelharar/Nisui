import { admin } from '../client';

const digits = () => (admin.phone ?? '').replace(/[^\d]/g, '');

export const hasAdminPhone = () => digits().length >= 11;

export const telLink = () => (hasAdminPhone() ? `tel:+${digits()}` : undefined);

/** Opens WhatsApp to the admin, optionally with a prefilled message. */
export const whatsappLink = (text?: string) =>
  hasAdminPhone()
    ? `https://wa.me/${digits()}${text ? `?text=${encodeURIComponent(text)}` : ''}`
    : undefined;
