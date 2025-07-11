import { z } from 'zod';

export const serviceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be positive'),
  category_id: z.string().uuid('Invalid category ID'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  location: z.string().min(1, 'Location is required'),
  is_active: z.boolean().default(true)
}).strict();

export const bookingSchema = z.object({
  service_id: z.string().uuid('Invalid service ID'),
  professional_id: z.string().uuid('Invalid professional ID'),
  booking_date: z.string().datetime('Invalid date format'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  notes: z.string().optional(),
  address: z.string().min(1, 'Address is required')
}).strict();

export const professionalSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(1, 'Location is required'),
  phone: z.string().min(9, 'Valid phone number required'),
  specialties: z.array(z.string()).min(1, 'At least one specialty required'),
  availability: z.object({
    monday: z.array(z.string()).optional(),
    tuesday: z.array(z.string()).optional(),
    wednesday: z.array(z.string()).optional(),
    thursday: z.array(z.string()).optional(),
    friday: z.array(z.string()).optional(),
    saturday: z.array(z.string()).optional(),
    sunday: z.array(z.string()).optional()
  })
}).strict();

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
  service_id: z.string().uuid('Invalid service ID').optional(),
  professional_id: z.string().uuid('Invalid professional ID').optional()
}).strict();

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
}).strict();

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'professional', 'admin'])
}).strict();
