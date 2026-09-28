import { z } from 'zod';
import { CATEGORIES } from '../models/Material.js';

// Built-in French messages for generic issues (unknown fields, wrong types); field messages below take precedence.
z.config(z.locales.fr());

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME = /^[\p{L}\p{M}' .-]+$/u;
const TEXT = /^[^\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]*$/;

const email = z.string('Adresse e-mail requise.').trim().toLowerCase().max(254, 'Adresse e-mail trop longue.').regex(EMAIL, 'Adresse e-mail invalide.');
const personName = z.string('Nom requis.').trim().min(2, 'Indiquez votre nom complet.').max(80, 'Nom trop long (80 caractères max).').regex(NAME, 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets.');
const team = z.string('Équipe requise.').trim().min(2, 'Indiquez une équipe.').max(60, 'Nom d’équipe trop long.').regex(TEXT, 'Caractères non autorisés.');
const text = (min, max, label) => z.string(`${label} requis.`).trim().min(min, min > 0 ? `${label} : ${min} caractères minimum.` : undefined).max(max, `${label} : ${max} caractères maximum.`).regex(TEXT, 'Caractères non autorisés.');
const objectId = z.string().regex(/^[a-f0-9]{24}$/, 'Identifiant invalide.');

export const password = z.string('Mot de passe requis.')
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .max(128, 'Mot de passe trop long (128 caractères max).')
  .regex(/[A-Za-zÀ-ÿ]/, 'Le mot de passe doit contenir au moins une lettre.')
  .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre.');

export const signupSchema = z.strictObject({ name: personName, email, password, team });
export const verifyEmailSchema = z.strictObject({ email, code: z.string('Code requis.').trim().regex(/^\d{6}$/, 'Le code contient 6 chiffres.') });
export const resendCodeSchema = z.strictObject({ email });
export const loginSchema = z.strictObject({ email, password: z.string('Mot de passe requis.').min(1, 'Mot de passe requis.').max(128, 'Mot de passe invalide.') });

export const materialSchema = z.strictObject({
  name: text(3, 120, 'Nom'),
  category: z.enum(CATEGORIES, 'Catégorie inconnue.'),
  description: text(0, 300, 'Description').optional().default(''),
  total: z.number('Quantité totale invalide.').int('Quantité totale invalide.').min(1, 'Quantité totale invalide.').max(100000, 'Quantité totale trop élevée.'),
  quantity: z.number('Quantité disponible invalide.').int('Quantité disponible invalide.').min(0, 'Quantité disponible invalide.').max(100000, 'Quantité disponible trop élevée.'),
  imagePublicId: z.string().max(80).optional(),
}).refine((data) => data.quantity <= data.total, { message: 'La quantité disponible ne peut pas dépasser le total.', path: ['quantity'] });

export const createRequestSchema = z.strictObject({
  materialId: objectId,
  quantity: z.number('Quantité invalide.').int('Quantité invalide.').min(1, 'Quantité invalide.').max(1000, 'Quantité trop élevée.'),
  dateNeeded: z.number('Date invalide.').int('Date invalide.').refine((value) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return value >= today.getTime() && value <= today.getTime() + 366 * 86400000;
  }, 'Choisissez une date à venir (dans les 12 prochains mois).'),
  justification: text(8, 600, 'Justification'),
  note: text(0, 300, 'Commentaire').nullable().optional(),
});

export const rejectRequestSchema = z.strictObject({ reason: text(4, 400, 'Motif') });
export const inviteUserSchema = z.strictObject({ name: personName, email, role: z.enum(['admin', 'employee'], 'Rôle inconnu.'), team });
export const changeRoleSchema = z.strictObject({ role: z.enum(['admin', 'employee'], 'Rôle inconnu.') });

export const idParams = z.strictObject({ id: objectId });
export const requestCodeParams = z.strictObject({ code: z.string().regex(/^REQ-\d{1,9}$/, 'Identifiant de demande invalide.') });
