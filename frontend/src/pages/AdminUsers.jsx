import { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import api from "../utils/axiosInstance";

const columnHelper = createColumnHelper();

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [filters, setFilters] = useState({ activo: null, admin: null });
  const [globalFilter, setGlobalFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
      });
      if (filters.activo !== null) params.append("activo", filters.activo);
      if (filters.admin !== null) params.append("admin", filters.admin);
      if (globalFilter) params.append("search", globalFilter);
      if (sorting.length) {
        params.append("sort_by", sorting[0].id);
        params.append("order", sorting[0].desc ? "-1" : "1");
      }
      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.usuarios || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError("Error al cargar usuarios");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination, sorting, filters, globalFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => (
          <div className="font-medium text-gray-900">{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor("creado_en", {
        header: "Registro",
        cell: (info) => (
          <div className="text-sm text-gray-500">
            {new Date(info.getValue()).toLocaleDateString("es-ES")}
          </div>
        ),
      }),
      columnHelper.accessor("plan.tipo_plan", {
        header: "Plan",
        cell: (info) => {
          const plan = info.getValue();
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                plan === "premium"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {plan?.charAt(0).toUpperCase() + plan?.slice(1) || "—"}
            </span>
          );
        },
      }),
      columnHelper.accessor("is_active", {
        header: "Estado",
        cell: (info) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              info.getValue()
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {info.getValue() ? "Activo" : "Inactivo"}
          </span>
        ),
      }),
      columnHelper.accessor("is_admin", {
        header: "Admin",
        cell: (info) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              info.getValue()
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {info.getValue() ? "Sí" : "No"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Acciones",
        cell: (info) => {
          const row = info.row.original;
          const isEditing = editing === row.email;
          return (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <select
                    value={editData.plan || row.plan?.tipo_plan}
                    onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="gratuito">Gratuito</option>
                    <option value="premium">Premium</option>
                  </select>
                  <button
                    onClick={() => {
                      api.patch(`/admin/users/${row.email}`, { plan: { tipo_plan: editData.plan || row.plan?.tipo_plan } });
                      setEditing(null);
                      fetchUsers();
                    }}
                    className="text-xs text-green-600 hover:underline"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(row.email)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Editar plan
                  </button>
                  <button
                    onClick={() =>
                      api.patch(`/admin/users/${row.email}`, { is_active: !row.is_active }).then(fetchUsers)
                    }
                    className={`text-xs ${row.is_active ? "text-red-600" : "text-green-600"} hover:underline`}
                  >
                    {row.is_active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() =>
                      api.patch(`/admin/users/${row.email}`, { is_admin: !row.is_admin }).then(fetchUsers)
                    }
                    className={`text-xs ${row.is_admin ? "text-gray-600" : "text-purple-600"} hover:underline`}
                  >
                    {row.is_admin ? "Quitar admin" : "Hacer admin"}
                  </button>
                </>
              )}
            </div>
          );
        },
      }),
    ],
  [editing, editData]);

  const table = useReactTable({
    data: users,
    columns,
    state: {
      pagination,
      sorting,
      globalFilter,
      filters,
      columnVisibility: {},
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-1">{total} usuarios totales</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por email..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
          <select
            value={filters.activo === null ? "" : String(filters.activo)}
            onChange={(e) => setFilters({ ...filters, activo: e.target.value === "" ? null : e.target.value === "true" })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <select
            value={filters.admin === null ? "" : String(filters.admin)}
            onChange={(e) => setFilters({ ...filters, admin: e.target.value === "" ? null : e.target.value === "true" })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los roles</option>
            <option value="true">Administradores</option>
            <option value="false">Usuarios</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => header.column.toggleSorting()}
                        style={{ userSelect: "none" }}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ChevronUp className="w-4 h-4" />,
                            desc: <ChevronDown className="w-4 h-4" />,
                          }[header.column.getIsSorted()] || null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-sm text-gray-900">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-4">
            <div className="text-sm text-gray-500">
              Mostrando {pagination.pageIndex * pagination.pageSize + 1} a {Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} de {total} usuarios
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}