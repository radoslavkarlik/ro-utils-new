import { ZenyApp } from '@/zeny/zeny-app';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/zeny')({
  component: ZenyApp,
});
