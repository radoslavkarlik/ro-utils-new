import { cn } from '@/lib/cn';
import type { ReactNode, RefObject, TdHTMLAttributes } from 'react';

type Props = TdHTMLAttributes<HTMLTableCellElement> & {
  readonly ref?: RefObject<HTMLTableCellElement>;
};

export function TableCell({
  children,
  className,
  ref,
  ...props
}: Props): ReactNode {
  return (
    <td ref={ref} className={cn('py-1 text-center', className)} {...props}>
      {children}
    </td>
  );
}
