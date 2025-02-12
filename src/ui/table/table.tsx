import { cn } from '@/lib/cn';
import type { ReactNode, RefObject, TableHTMLAttributes } from 'react';

type Props = TableHTMLAttributes<HTMLTableElement> & {
  readonly ref?: RefObject<HTMLTableElement>;
};

export function Table({
  children,
  className,
  ref,
  ...props
}: Props): ReactNode {
  return (
    <table ref={ref} className={cn('w-full', className)} {...props}>
      {children}
    </table>
  );
}
