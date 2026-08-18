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
  const [totalUsuarios, setTotalUsuarios] = useState(0);
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

  const fetchTotalUsuarios = async () => {
    try {
      const res = await api.get("/admin/stats");
      setTotalUsuarios(res.data?.usuarios?.total || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination, sorting, filters, globalFilter]);

  useEffect(() => {
    fetchTotalUsuarios();
  }, []);

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
                  ? "text-yellow-600"
                  : "text-gray-800"
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
                ? "text-green-800"
                : "text-red-800"
            }`}
          >
            {info.getValue() ? "Activo" : "Inactivo"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Acciones",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditing(row.email);
                  setEditData({ plan: row.plan?.tipo_plan || "gratuito" });
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
              >
                Editar plan
              </button>
              <button
                onClick={() => {
                  if (!window.confirm("¿Estás seguro de desactivar este usuario?")) return;
                  api.patch(`/admin/users/${row.email}`, { is_active: !row.is_active }).then(() => {
                    fetchUsers();
                    fetchTotalUsuarios();
                  });
                }}
                className={`${
                  row.is_active
                    ? "bg-gray-400 hover:bg-gray-500"
                    : "bg-green-500 hover:bg-green-600"
                } text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors`}
              >
                {row.is_active ? "Desactivar" : "Activar"}
              </button>
              <button
                onClick={() => {
                  if (!window.confirm(`¿Estás seguro de eliminar a ${row.email}?`)) return;
                  api
                    .delete(`/admin/users/${row.email}`)
                    .then(() => {
                      fetchUsers();
                      fetchTotalUsuarios();
                    })
                    .catch((err) => {
                      setError(err.response?.data?.error || "No se pudo eliminar el usuario");
                    });
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          );
        },
      }),
    ],
  []);

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
      <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-gray-500">{totalUsuarios} usuarios totales</p>
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
          <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
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
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
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

      {editing && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-lg w-96"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">Editar plan</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4 break-all">{editing}</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={editData.plan || "gratuito"}
              onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-6"
            >
              <option value="gratuito">Gratuito</option>
              <option value="premium">Premium</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await api.patch(`/admin/users/${editing}`, { plan: { tipo_plan: editData.plan || "gratuito" } });
                  setEditing(null);
                  fetchUsers();
                  fetchTotalUsuarios();
                }}
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}