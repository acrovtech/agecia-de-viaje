import { prisma } from '@repo/db';
import { BlogForm } from '@/components/forms/blog-form';
import { notFound } from 'next/navigation';
import { SetPageTitle } from '@/components/ui/title-context';

export const dynamic = 'force-dynamic';

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const blog = await prisma.blog.findUnique({
    where: { id },
    include: {
      paragraphs: { orderBy: { order: 'asc' } }
    }
  });

  if (!blog) {
    return notFound();
  }

  return (
    <main className="flex flex-1 flex-col gap-4">
      <SetPageTitle title={`Editar Blog > ${blog.title}`} />
      <BlogForm initialData={blog} />
    </main>
  );
}
