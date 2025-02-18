import { ExpApp } from '@/exp/components/exp-app';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/exp')({
  component: ExpApp,
});
