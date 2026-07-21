import { prisma } from '@repo/db';
import { BlogsClient } from './blogs-client';

export const dynamic = 'force-dynamic';

export default async function BlogsPage() {
  let blogs: any[] = [];
  try {
    blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
  }

  return <BlogsClient initialBlogs={blogs} />;
}
