import { useState, FormEvent } from 'react'
import { useTelemetry } from '../context/TelemetryContext'
import './AdmissionForm.css'

export default function AdmissionForm() {
  const { registerPatient } = useTelemetry()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [triageStatus, setTriageStatus] = useState<'CRITICO' | 'URGENTE' | 'SEMI_URGENTE' | 'NO_URGENTE'>('NO_URGENTE')
  const [allergies, setAllergies] = useState('')
  const [preExistingConditions, setPreExistingConditions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setSuccessMessage(null)

    // Validación local básica
    if (!firstName.trim() || !lastName.trim() || !documentId.trim() || !birthDate) {
      setValidationError('Por favor completa todos los campos obligatorios.')
      return
    }

    setIsSubmitting(true)

    // Estructurar el objeto de envío (payload puro)
    // Se envían exactamente los campos opcionales sin parches/fallbacks del lado del cliente
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      documentId: documentId.trim(),
      birthDate,
      triageStatus,
      allergies: allergies.trim(),
      preExistingConditions: preExistingConditions.trim()
    }

    try {
      await registerPatient(payload)
      setSuccessMessage('Paciente admitido exitosamente (telemetría iniciada).')
      
      // Limpiar campos del formulario
      setFirstName('')
      setLastName('')
      setDocumentId('')
      setBirthDate('')
      setTriageStatus('NO_URGENTE')
      setAllergies('')
      setPreExistingConditions('')
    } catch (err: any) {
      setValidationError(err?.message || 'Error al procesar la admisión.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admission-form-container">
      <div className="sidebar-header">
        <div className="header-logo-row">
          <div className="logo-text-group">
            <span className="logo-icon">🩺</span>
            <span className="logo-text">CENTRAL DE TELEMETRÍA</span>
          </div>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="header-medical-pulse-icon">
            <circle cx="24" cy="24" r="22" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" fill="rgba(117, 7, 12, 0.6)" />
            <path d="M10 24H16L20 12L28 36L32 20L35 24H38" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="24" r="3" fill="#ff4d4d" className="pulse-glow-node" />
          </svg>
        </div>
        <h2 className="sidebar-title">Admisión de Paciente</h2>
        <span className="sidebar-subtitle">Ingestión médica · UCI</span>
      </div>
      <form onSubmit={handleSubmit} className="admission-form">
        <div className="form-body">
          {validationError && <div className="alert alert-error">{validationError}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="firstName">Nombre *</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ej. Juan"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Apellido *</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ej. Pérez"
              />
            </div>

            <div className="form-group">
              <label htmlFor="documentId">Documento de Identidad *</label>
              <input
                id="documentId"
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ej. 12345678"
              />
            </div>

            <div className="form-group">
              <label htmlFor="birthDate">Fecha de Nacimiento *</label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="triageStatus">Nivel de Triage *</label>
              <select
                id="triageStatus"
                value={triageStatus}
                onChange={(e) => setTriageStatus(e.target.value as any)}
                disabled={isSubmitting}
              >
                <option value="CRITICO">Crítico (Rojo)</option>
                <option value="URGENTE">Urgente (Naranja)</option>
                <option value="SEMI_URGENTE">Semi-Urgente (Amarillo)</option>
                <option value="NO_URGENTE">No Urgente (Verde)</option>
              </select>
            </div>
          </div>

          <hr className="form-divider" />

          <div className="form-group">
            <label htmlFor="allergies">Alergias (Opcional)</label>
            <textarea
              id="allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              disabled={isSubmitting}
              placeholder="Describa alergias conocidas del paciente..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="preExistingConditions">Condiciones Preexistentes (Opcional)</label>
            <textarea
              id="preExistingConditions"
              value={preExistingConditions}
              onChange={(e) => setPreExistingConditions(e.target.value)}
              disabled={isSubmitting}
              placeholder="Describa condiciones médicas previas..."
              rows={2}
            />
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Procesando Admisión...' : 'Admitir Paciente'}
        </button>
      </form>
      <div className="sidebar-footer">
        <span className="flashing-check">●</span>
        <span className="footer-status-text">Ingestión de Datos en Tiempo Real</span>
      </div>
    </div>
  )
}
