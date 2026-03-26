const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getCache(key) {
  try {
    const cached = await prisma.cache.findUnique({ where: { key } });
    if (!cached) return null;
    if (new Date() > new Date(cached.expiresAt)) {
      await prisma.cache.delete({ where: { key } });
      return null;
    }
    return JSON.parse(cached.value);
  } catch (err) {
    console.error('Cache get error:', err.message);
    return null;
  }
}

async function setCache(key, value, ttlSeconds) {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await prisma.cache.upsert({
      where: { key },
      update: { value: JSON.stringify(value), expiresAt },
      create: { key, value: JSON.stringify(value), expiresAt },
    });
  } catch (err) {
    console.error('Cache set error:', err.message);
  }
}

async function deleteCache(key) {
  try {
    await prisma.cache.deleteMany({ where: { key } });
  } catch (err) {
    console.error('Cache delete error:', err.message);
  }
}

async function cleanExpiredCache() {
  try {
    await prisma.cache.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch (err) {
    console.error('Cache cleanup error:', err.message);
  }
}

module.exports = { getCache, setCache, deleteCache, cleanExpiredCache };
