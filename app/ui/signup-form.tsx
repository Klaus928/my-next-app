'use client'
 
import { signup } from '@/app/actions/auth'
import { useActionState, startTransition } from 'react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
// 不再需要外部CryptoJS依赖

// 使用Web Crypto API加密密码
async function encryptPassword(text: string): Promise<string> {
  try {
    // 从环境变量中读取加密密钥
    const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'fallback-secret-key'; // 使用NEXT_PUBLIC前缀使其在客户端可用
    
    // 创建编码器
    const encoder = new TextEncoder();
    const textData = encoder.encode(text);
    
    // 创建密钥
    const keyData = encoder.encode(SECRET_KEY.padEnd(32, '0').substring(0, 32));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    );
    
    // 生成随机IV
    const iv = crypto.getRandomValues(new Uint8Array(16));
    
    // 加密数据
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      cryptoKey,
      textData
    );
    
    // 转换为十六进制格式（IV:密文）
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const encryptedHex = Array.from(new Uint8Array(encryptedData))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return `${ivHex}:${encryptedHex}`;
  } catch (error) {
    console.error('加密失败:', error);
    return text; // 失败时返回原文以确保流程不会中断
  }
}
 
export default function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter();
  
  // 处理表单提交，在提交前加密密码
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    
    // 加密密码后再提交
    const encryptedPassword = await encryptPassword(password);
    formData.append('password', encryptedPassword);
    
    // 使用startTransition包装action调用，符合useActionState的要求
    startTransition(() => action(formData));
  };
  
  // 由于useActionState在成功时会重定向，不需要手动重置表单
  // 保留表单状态以处理错误情况
 
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">注册</CardTitle>
        <CardDescription className="text-center">
          创建新账户以开始使用我们的服务
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              name="name"
              placeholder="请输入姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {state?.errors?.name && <p className="text-red-500 text-sm">{state.errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {state?.errors?.email && <p className="text-red-500 text-sm">{state.errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {state?.errors?.password && (
              <div className="text-red-500 text-sm mt-1">
                <p className="font-medium mb-1">密码必须满足以下要求：</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {state.errors.password.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="pt-4 space-y-2">
            <Button
              type="submit"
              disabled={pending}
              className="w-full"
            >
              {pending ? '注册中...' : '注册'}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              前往登录页面
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}