import { cn } from '@/lib/cn';
import type { HTMLAttributes, ReactNode, RefObject } from 'react';

type Props = HTMLAttributes<HTMLTableSectionElement> & {
  readonly ref?: RefObject<HTMLTableSectionElement>;
};

export function TableBody({
  children,
  className,
  ref,
  ...props
}: Props): ReactNode {
  return (
    <tbody ref={ref} className={cn(className)} {...props}>
      {children}
    </tbody>
  );
}
