import { useState } from 'react'
import { AuthService } from '../../../services/authService'

interface UploadResponse {
  fileUrl: string
  fileName: string
  fileType: string
  fileSize?: number
}

export default function CeluReceipt() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<UploadResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Minimal required fields
  const [companyId, setCompanyId] = useState('')
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10))
  const [docType, setDocType] = useState<'FACTURA'|'BOLETA'|'RECIBO'|'OTRO'>('RECIBO')
  const [total, setTotal] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    setUploaded(null)
    setError(null)
    setSuccess(null)
  }

  const handleUpload = async () => {
    try {
      setError(null)
      setSuccess(null)
      if (!file) {
        setError('Por favor selecciona un archivo de boleta/foto.')
        return
      }
      setUploading(true)
      const fd = new FormData()
      fd.append('file', file)
      const res = await AuthService.upload<UploadResponse>('/costs/upload', fd, 'POST')
      setUploaded(res)
      setSuccess('Comprobante subido correctamente.')
    } catch (e: any) {
      setError(e?.message || 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setError(null)
      setSuccess(null)
      if (!companyId) {
        setError('Debes ingresar el ID de empresa (companyId).')
        return
      }
      if (!total || isNaN(Number(total))) {
        setError('Total inválido.')
        return
      }
      if (!uploaded) {
        setError('Primero sube el comprobante.')
        return
      }

      setSubmitting(true)
      const payload: any = {
        companyId,
        docType,
        date,
        total: Number(total),
        description: description || undefined,
        attachments: [
          {
            fileUrl: uploaded.fileUrl,
            fileName: uploaded.fileName,
            fileType: uploaded.fileType,
            fileSize: uploaded.fileSize,
          },
        ],
      }
      if (categoryId) payload.categoryId = categoryId

      const created = await AuthService.apiCall<any>('/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      setSuccess(`Costo creado: ${created?.id || ''}`)
      // Reset minimal fields except companyId for convenience
      setFile(null)
      setUploaded(null)
      setTotal('')
      setDescription('')
    } catch (e: any) {
      setError(e?.message || 'Error al crear el costo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 py-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Cargar Comprobante (Móvil)</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Sube una foto o PDF del comprobante y registra la compra en el sistema.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded bg-green-50 text-green-700 border border-green-200">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID de Empresa (companyId)</label>
          <input
            type="text"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            placeholder="Ej: cm123..."
          />
          <p className="text-xs text-gray-500 mt-1">Requerido por ahora. Próximamente seleccionable.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Doc</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            >
              <option value="RECIBO">Recibo</option>
              <option value="BOLETA">Boleta</option>
              <option value="FACTURA">Factura</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total</label>
          <input
            type="number"
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría (opcional)</label>
          <input
            type="text"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            placeholder="categoryId"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            placeholder="Notas breves..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comprobante (foto/PDF)</label>
          <input type="file" accept="image/*,application/pdf" onChange={onFileChange} />
          {uploaded?.fileUrl && (
            <p className="text-xs text-green-600 mt-1 break-all">Subido: {uploaded.fileName}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 inline-flex items-center justify-center rounded bg-blue-600 text-white py-2 disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : 'Subir comprobante'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!uploaded || submitting}
            className="flex-1 inline-flex items-center justify-center rounded bg-emerald-600 text-white py-2 disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : 'Guardar costo'}
          </button>
        </div>
      </div>
    </div>
  )
}
