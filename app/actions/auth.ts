'use server';

import { SignupFormSchema, LoginFormSchema, FormState } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { createSession, deleteSession } from '../lib/session';
import { redirect } from 'next/navigation';

export async function signup(state: FormState, formData: FormData) {
    // Validate form fields
    const validatedFields = SignupFormSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    })

    // If any form fields are invalid, return early
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // Call the provider or db to create a user...
    // 2. Prepare data for insertion into database
    const { name, email, password } = validatedFields.data
    // // e.g. Hash the user's password before storing it
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });
    
    if (existingUser) {
        return {
            errors: { email: ['该邮箱已被注册'] },
        };
    }
    
    // Insert the user into the database
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        }
    });



    if (!user) {
        return {
            message: 'An error occurred while creating your account.',
        }
    }

    // Current steps:
    // 4. Create user session
    await createSession(user.id)
    // 5. Redirect user
    redirect('/dashboard')
}

export async function login(state: FormState, formData: FormData) {
    // Validate form fields
    const validatedFields = LoginFormSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    })

    // If any form fields are invalid, return early
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // Get the validated data
    const { email, password } = validatedFields.data
    
    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });
    
    // If user not found or password incorrect, return error
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
        return {
            message: 'Invalid email or password',
        }
    }

    // Create user session
    await createSession(user.id)
    
    // Redirect user to dashboard
    redirect('/dashboard')
}

// 登出功能
export async function logout() {
    // 删除用户会话
    await deleteSession();
    
    // 重定向到登录页面
    redirect('/login');
}