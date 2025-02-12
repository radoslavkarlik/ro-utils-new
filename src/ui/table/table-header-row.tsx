import { cn } from '@/lib/cn';
import type { HTMLAttributes, ReactNode, RefObject } from 'react';

type Props = HTMLAttributes<HTMLTableRowElement> & {
  readonly ref?: RefObject<HTMLTableRowElement>;
};

export function TableHeaderRow({
  children,
  className,
  ref,
  ...props
}: Props): ReactNode {
  return (
    <tr
      ref={ref}
      className={cn('border border-indigo-700 bg-indigo-200', className)}
      {...props}
    >
      {children}
    </tr>
  );
}
