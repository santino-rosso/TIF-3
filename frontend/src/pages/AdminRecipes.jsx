import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
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
import { formatearReceta } from "../utils/recipeFormatter";

const columnHelper = createColumnHelper();

export default function AdminRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalRecetas, setTotalRecetas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [conImagen, setConImagen] = useState(null);
  const [verReceta, setVerReceta] = useState(null);
  const [error, setError] = useState(null);

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        skip: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
      });
      if (conImagen !== null) params.append("con_imagen", conImagen);
      if (globalFilter) params.append("search", globalFilter);
      if (sorting.length) {
        params.append("sort", sorting[0].id);
        params.append("order", sorting[0].desc ? "desc" : "asc");
      }
      const res = await api.get(`/admin/recipes?${params.toString()}`);
      setRecipes(res.data.recetas || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las recetas");
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalRecetas = async () => {
    try {
      const res = await api.get("/admin/stats");
      setTotalRecetas(res.data?.recetas?.total || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [pagination, sorting, globalFilter, conImagen]);

  useEffect(() => {
    fetchTotalRecetas();
  }, []);

  const columns = useMemo(
    () => [
      {
        id: "imagen",
        header: "Imagen",
        cell: (info) => {
          const recipe = info.row.original;
          if (recipe.imagen_id) {
            return (
              <img
                src={`${import.meta.env.VITE_API_URL}/imagenes/${recipe.imagen_id}`}
                alt={recipe.titulo || "Receta"}
                className="w-16 h-16 object-cover rounded-lg"
              />
            );
          }
          return <span className="text-gray-400">Sin imagen</span>;
        },
      },
      {
        accessorKey: "texto_receta",
        header: "Receta",
        cell: (info) => {
          const texto = info.getValue() || "";
          const sinPrefijo = texto
            .replace(/^\*{0,2}\s*nombre de la receta\s*\*{0,2}\s*:?\s*/i, "")
            .replace(/\*\*/g, "")
            .trim();
          const titulo = sinPrefijo.split("\n")[0];
          return (
            <div className="w-80 font-medium text-gray-900">
              {titulo}
            </div>
          );
        },
      },
      {
        accessorKey: "fecha",
        header: "Fecha",
        cell: (info) => (
          <div className="text-sm text-gray-500">
            {new Date(info.getValue()).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: (info) => {
          const recipe = info.row.original;
          return (
            <div className="flex items-center gap-2">
                <button
                  onClick={() => setVerReceta(recipe)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                >
                  Ver
                </button>
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar esta receta?")) {
                      api
                        .delete(`/admin/recipes/${recipe._id}`)
                        .then(() => {
                          fetchRecipes();
                          fetchTotalRecetas();
                        })
                        .catch(() => setError("No se pudo eliminar la receta"));
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                >
                  Eliminar
                </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: recipes,
    columns,
    state: { pagination, sorting, globalFilter },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestión de Recetas</h1>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-gray-500">{totalRecetas} recetas totales</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en recetas..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
          <select
            value={conImagen === null ? "" : String(conImagen)}
            onChange={(e) => setConImagen(e.target.value === "" ? null : e.target.value === "true")}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas</option>
            <option value="true">Con imagen</option>
            <option value="false">Sin imagen</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 flex items-center justify-between">
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchRecipes}
            className="text-sm font-medium text-red-700 hover:underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
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
                {table.getRowModel().rows.length === 0 && !error ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      No se encontraron recetas
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
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
              Mostrando {pagination.pageIndex * pagination.pageSize + 1} a {Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} de {total} recetas
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

      {verReceta &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setVerReceta(null)}
          >
            <div
              className="bg-white rounded-xl p-6 shadow-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {verReceta.imagen_id && (
                <img
                  src={`${import.meta.env.VITE_API_URL}/imagenes/${verReceta.imagen_id}`}
                  alt={verReceta.titulo || "Receta"}
                  className="w-full max-h-72 object-cover rounded-lg mb-4"
                />
              )}
              <div className="text-sm text-gray-700">
                {formatearReceta(verReceta.texto_receta)}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setVerReceta(null)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}