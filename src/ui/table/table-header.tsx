import { cn } from '@/lib/cn';
import type { HTMLAttributes, ReactNode, RefObject } from 'react';

type Props = HTMLAttributes<HTMLTableSectionElement> & {
  readonly ref?: RefObject<HTMLTableSectionElement>;
};

export function TableHeader({
  children,
  className,
  ref,
  ...props
}: Props): ReactNode {
  return (
    <thead
      ref={ref}
      className={cn('font-bold text-indigo-900 text-md', className)}
      {...props}
    >
      {children}
    </thead>
  );
}
