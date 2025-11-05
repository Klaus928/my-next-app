import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
// import { SessionPayload } from './definitions'
import { cookies } from 'next/headers'
import prisma from './prisma'

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey ?? '')

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}
 
export async function decrypt(session: string | undefined = '') {
  if (!session) {
    console.log('No session provided to decrypt')
    return null
  }
  
  try {
    const { payload } = await jwtVerify(session, encodedKey, {      
      algorithms: ['HS256'],
    })
    console.log('Session decrypted successfully:', payload)
    return payload
  } catch (error) {
    console.error('Failed to verify session:', error)
    return null
  }
}


 
export async function createSession(userId: string) {
  console.log('Creating session for user:', userId)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const sessionData = { userId, expiresAt }
  console.log('Session data to encrypt:', sessionData)
  const session = await encrypt(sessionData)
  console.log('Session encrypted successfully')
  const cookieStore = await cookies()
 
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
  console.log('Session cookie set successfully')
}

// 更新 会话过期时间
export async function updateSession() {
    const session = (await cookies()).get('session')?.value
    const payload = await decrypt(session)
   
    if (!session || !payload) {
      return null
    }
   
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
   
    const cookieStore = await cookies()
    cookieStore.set('session', session, {
      httpOnly: true,
      secure: true,
      expires: expires,
      sameSite: 'lax',
      path: '/',
    })
  }

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getCurrentUser() {
  const session = (await cookies()).get('session')?.value;
  const payload = await decrypt(session);
  
  if (!payload || typeof payload.userId !== 'string') {
    return null;
  }
  
  try {
    // 从数据库中获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true }
    });
    
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}