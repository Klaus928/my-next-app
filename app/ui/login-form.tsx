'use client'
 
import { login } from '@/app/actions/auth'
import { useActionState } from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
 
export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter();
  
  // 由于useActionState在成功时会重定向，不需要手动重置表单
  // 保留表单状态以处理错误情况
 
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">登录</CardTitle>
        <CardDescription className="text-center">
          请输入您的邮箱和密码登录账户
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input 
              id="email" 
              name="email" 
              placeholder="请输入邮箱" 
              type="email" 
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
            {state?.errors?.password && <p className="text-red-500 text-sm">{state.errors.password}</p>}
          </div>
          
          {state?.message && <p className="text-red-500 text-sm">{state.message}</p>}
          
          <div className="pt-4 space-y-2">
            <Button 
              disabled={pending} 
              type="submit" 
              className="w-full"
            >
              {pending ? '登录中...' : '登录'}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => router.push('/signup')}
            >
              前往注册页面
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}