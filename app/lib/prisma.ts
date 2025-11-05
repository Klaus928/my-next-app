// 使用动态导入解决Vercel部署时的构建错误
let prisma: any;

if (process.env.NODE_ENV === 'production') {
  // 生产环境中直接导入
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} else {
  // 开发环境中使用全局实例
  const globalForPrisma = global as typeof globalThis & { prisma?: any };
  if (!globalForPrisma.prisma) {
    const { PrismaClient } = require('@prisma/client');
    globalForPrisma.prisma = new PrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;