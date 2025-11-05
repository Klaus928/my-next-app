'use server';

import { SignupFormSchema, LoginFormSchema, FormState } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { createSession, deleteSession } from '../lib/session';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

// 从环境变量中读取加密密钥
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'fallback-secret-key'; // 实际使用时应确保环境变量已设置
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

export async function signup(state: FormState, formData: FormData) {
    // 获取加密后的密码
    const encryptedPassword = formData.get('password') as string || '';
    // 解密密码
    const originalPassword = decryptPassword(encryptedPassword);
    
    // Validate form fields
    const validatedFields = SignupFormSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: originalPassword,
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

// 使用Node.js内置crypto模块解密
function decryptPassword(encryptedText: string): string {
  try {
    // 从加密文本中提取IV和密文
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift() || '', 'hex');
    const encryptedData = Buffer.from(textParts.join(':'), 'hex');
    
    // 创建解密器
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      Buffer.from(SECRET_KEY.padEnd(32, '0').substring(0, 32)), 
      iv
    );
    
    // 解密数据
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('解密失败:', error);
    // 解密失败时返回原文以确保流程不会中断
    return encryptedText;
  }
}

export async function login(state: FormState, formData: FormData) {
    // 获取密码并尝试解密
    const rawPassword = formData.get('password');
    const originalPassword = typeof rawPassword === 'string' ? decryptPassword(rawPassword) : '';
    
    // Validate form fields
    const validatedFields = LoginFormSchema.safeParse({
        email: formData.get('email'),
        password: originalPassword,
    })

    // If any form fields are invalid, return early
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // Get the validated data
    const { email, password: userPassword } = validatedFields.data
    
    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });
    
    // If user not found or password incorrect, return error
    if (!user || !user.password || !(await bcrypt.compare(userPassword, user.password))) {
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