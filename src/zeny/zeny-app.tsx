import { DataTable } from '@/ui/table/data-table';
import { Table } from '@/ui/table/table';
import { TableCell } from '@/ui/table/table-cell';
import { TableHeaderCell } from '@/ui/table/table-header-cell';
import {
  type Row,
  type SortingState,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import {
  type SortBy,
  numericallyAsc,
  sortByDesc,
  sortByProp,
} from '@/lib/sort-by';
import { type Monster, getMonsters } from '../monsters/get-monsters';

// TODO hit damage // or 1 hit option

type SortByState = {
  readonly column: keyof Monster;
  readonly direction: 'asc' | 'desc';
};

const columnHelper = createColumnHelper<Monster>();

export function ZenyApp() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'ID', desc: false },
  ]);

  const monsters = useMemo(getMonsters, []);
  const columns = useMemo(() => {
    return [
      columnHelper.accessor('ID', {
        header: 'ID',
        sortingFn: 'alphanumeric',
        cell({ row }) {
          return <TableCell>{row.original.ID}</TableCell>;
        },
      }),
      columnHelper.accessor('iName', {
        header: 'Name',
        sortingFn: 'alphanumeric',
        cell({ row }) {
          return <TableCell>{row.original.iName}</TableCell>;
        },
      }),
      columnHelper.accessor('HP', {
        header: 'HP',
        sortingFn: sortByProp<Row<Monster>, number>({
          select: (row) => +row.original.HP,
          compare: numericallyAsc,
        }),
        cell({ row }) {
          return <TableCell>{row.original.HP}</TableCell>;
        },
      }),
      columnHelper.accessor('ehp_def', {
        header: 'EHP',
        cell({ row }) {
          return (
            <TableCell>{Math.ceil(row.original.ehp_def.fixed ?? 0)}</TableCell>
          );
        },
      }),
      columnHelper.accessor('value.total', {
        header: 'Zeny per monster',
        cell({ row }) {
          return <TableCell>{row.original.value.total.toFixed(2)}</TableCell>;
        },
      }),
      columnHelper.display({
        id: 'value.ehp',
        header: 'Zeny per HP',
        cell({ row }) {
          return (
            <TableCell>
              {(
                row.original.value.total / (row.original.ehp_def.fixed ?? 1)
              ).toFixed(2)}
            </TableCell>
          );
        },
      }),
    ];
  }, []);

  const table = useReactTable({
    data: monsters,
    columns,
    state: {
      sorting,
    },
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
  });

  const toggleSort = (column: SortByState['column']): void => {
    setSortedBy((sortedBy) =>
      sortedBy.column === column
        ? { column, direction: sortedBy.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    );
  };

  return (
    <main className="w-full p-2">
      <DataTable table={table} />
      {false && (
        <Table>
          <thead className="font-bold text-indigo-900 text-md">
            <tr className="border border-indigo-700 bg-indigo-200 *:py-2">
              <TableHeaderCell onClick={() => toggleSort('ID')}>
                ID
              </TableHeaderCell>
              <TableHeaderCell onClick={() => toggleSort('iName')}>
                Name
              </TableHeaderCell>
              <TableHeaderCell onClick={() => toggleSort('HP')}>
                HP
              </TableHeaderCell>
              <TableHeaderCell onClick={() => toggleSort('ehp_def')}>
                EHP
              </TableHeaderCell>
              <TableHeaderCell onClick={() => toggleSort('value')}>
                Zeny per monster
              </TableHeaderCell>
              <TableHeaderCell onClick={() => toggleSort('ID')}>
                Zeny per HP
              </TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {monsters
              .filter(
                (monster) =>
                  monster.value.total > 0 &&
                  +monster.HP > 0 &&
                  +monster.HP < 2000,
              )
              .toSorted(getSort(sortedBy))}
          </tbody>
        </Table>
      )}
    </main>
  );
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const sortByTable: Partial<Record<SortByState['column'], SortBy<any>>> = {
  ID: numericallyAsc,
};

const noSort: SortBy = () => 0;

const getSort = (sortBy: SortByState): SortBy => {
  const sort = sortByTable[sortBy.column] ?? noSort;

  return sortBy.direction === 'asc' ? sort : sortByDesc(sort);
};
