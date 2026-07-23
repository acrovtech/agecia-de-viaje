import { BlogForm } from '@/components/forms/blog-form';
import { SetPageTitle } from '@/components/ui/title-context';

export default function NewBlogPage() {
  return (
    <main className="flex flex-1 flex-col gap-4">
      <SetPageTitle title="Nuevo Blog" />
      <BlogForm />
    </main>
  );
}
