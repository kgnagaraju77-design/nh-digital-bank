import { z } from "zod";


export const registerSchema = z.object({
    firstName: z.string().min(2).max(50),

    lastName: z.string().min(2).max(50),

    email: z.string().email(),

    phone: z.string().regex(/^[0-9]{10}$/),

    password: z.string().min(8).max(100)
});


export const loginSchema = z.object({
    email: z.string().email(),

    password: z.string().min(1)
});