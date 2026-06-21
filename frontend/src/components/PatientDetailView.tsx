import { useTelemetry } from '../context/TelemetryContext'
import { useRef } from 'react'
import './PatientDetailView.css'

interface PatientDetailViewProps {
  patientId: string;
  onBack: () => void;
}

const isHeartRateAlert = (hr?: number) => hr ? hr > 110 || hr < 50 : false
const isSpo2Alert = (spo2?: number) => spo2 ? spo2 < 92 : false
const isTempAlert = (temp?: number) => temp ? temp > 38.0 || temp < 35.5 : false
const isBpAlert = (bp?: string) => {
  if (!bp) return false
  const parts = bp.split('/')
  const sys = parseInt(parts[0])
  const dia = parseInt(parts[1])
  if (isNaN(sys) || isNaN(dia)) return false
  return sys > 150 || sys < 90 || dia > 95 || dia < 55
}

const getTrendArrow = (values: number[]) => {
  if (values.length < 2) return '→'
  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  if (last > prev) return '↑'
  if (last < prev) return '↓'
  return '→'
}

const generateSparkline = (values: number[], width = 60, height = 24) => {
  const data = values.length >= 2 ? values : (values.length === 1 ? [values[0], values[0]] : [60, 60])
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min === 0 ? 1 : max - min
  
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 6) - 3
    return { x, y }
  })
  
  const strokePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const fillPath = `${strokePath} L ${width} ${height} L 0 ${height} Z`
  
  return { strokePath, fillPath }
}

export default function PatientDetailView({ patientId, onBack }: PatientDetailViewProps) {
  const { tracks } = useTelemetry()
  
  // Guardamos el documentId en un ref para persistirlo en caso de que el ID temporal
  // del paciente cambie por el ID real de la base de datos tras la confirmación de la API.
  const docIdRef = useRef<string | null>(null)

  let track = tracks.find(t => t.patient.id === patientId)
  
  if (track) {
    docIdRef.current = track.patient.documentId
  } else if (docIdRef.current) {
    track = tracks.find(t => t.patient.documentId === docIdRef.current)
  }

  if (!track) {
    return (
      <div className="patient-detail-container">
        <div className="patient-detail-error">
          <p>No se encontró el paciente seleccionado en el sistema de telemetría.</p>
          <button onClick={onBack} className="btn-back">← Volver al Monitor</button>
        </div>
      </div>
    )
  }

  const { patient, metrics, history, connected } = track
  const heartRate = metrics?.heartRate
  const spo2 = metrics?.spo2
  const bloodPressure = metrics?.bloodPressure
  const temperature = metrics?.temperature

  // Filtrar históricos para gráficos sparkline seguros en la vista de detalle
  const hrValues = (history || []).map(h => h.heartRate).filter((v): v is number => typeof v === 'number')
  const spo2Values = (history || []).map(h => h.spo2).filter((v): v is number => typeof v === 'number')
  const tempValues = (history || []).map(h => h.temperature).filter((v): v is number => typeof v === 'number')
  const bpValues = (history || []).map(h => {
    if (!h.bloodPressure) return undefined
    const parts = h.bloodPressure.split('/')
    const sys = parseInt(parts[0])
    return isNaN(sys) ? undefined : sys
  }).filter((v): v is number => typeof v === 'number')

  return (
    <div className="patient-detail-container">
      <div className="detail-header-row">
        <button onClick={onBack} className="btn-back">← Volver al Monitor</button>
        <span className={`detail-connection ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '● Transmitiendo en tiempo real' : '○ Desconectado'}
        </span>
      </div>

      <div className="patient-detail-card">
        <div className="patient-main-info">
          <h2 className="patient-name">{patient.firstName} {patient.lastName}</h2>
          <div className="patient-metadata">
            <span className="metadata-item"><strong>ID Documento:</strong> {patient.documentId}</span>
            <span className="metadata-item"><strong>Fecha Nacimiento:</strong> {patient.birthDate}</span>
          </div>
          <span className={`patient-triage badge-${(patient.triageStatus || 'NO_URGENTE').toLowerCase()}`}>
            &bull; {patient.triageStatus || 'NO URGENTE'}
          </span>
        </div>

        <div className="clinical-history-section">
          <h3 className="section-title">Información Clínica Estática</h3>
          <div className="clinical-cards-grid">
            <div className="info-medical-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div className="info-card-content">
                <span className="info-label">Alergias</span>
                <p className="info-value">{patient.allergies || 'No registra'}</p>
              </div>
            </div>
            <div className="info-medical-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              <div className="info-card-content">
                <span className="info-label">Condiciones Preexistentes</span>
                <p className="info-value">{patient.preExistingConditions || 'No registra'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="telemetry-snapshot">
          <h3 className="section-title">Captura de Telemetría (Signos Vitales)</h3>
          <div className="snapshot-grid">
            <div className="vital-detail-card">
              <div className="vital-header">
                <span className="vital-label">FRECUENCIA CARDÍACA</span>
                <span className={`vital-trend ${isHeartRateAlert(heartRate) ? 'trend-alert' : ''}`}>
                  {getTrendArrow(hrValues)}
                </span>
              </div>
              <div className="vital-value-row">
                <div className="vital-number-group">
                  <span className="vital-value">{heartRate ? `${heartRate}` : '--'}</span>
                  <span className="vital-unit">bpm</span>
                </div>
                <div className="vital-sparkline-box">
                  <svg className="vital-sparkline" width="60" height="24">
                    <defs>
                      <linearGradient id="detail-hr-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isHeartRateAlert(heartRate) ? '#9a0002' : '#94a3b8'} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={isHeartRateAlert(heartRate) ? '#9a0002' : '#94a3b8'} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={generateSparkline(hrValues, 60, 24).fillPath}
                      fill="url(#detail-hr-grad)"
                    />
                    <path
                      d={generateSparkline(hrValues, 60, 24).strokePath}
                      fill="none"
                      stroke={isHeartRateAlert(heartRate) ? '#9a0002' : '#94a3b8'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="vital-detail-card">
              <div className="vital-header">
                <span className="vital-label">SATURACIÓN O₂</span>
                <span className={`vital-trend ${isSpo2Alert(spo2) ? 'trend-alert' : ''}`}>
                  {getTrendArrow(spo2Values)}
                </span>
              </div>
              <div className="vital-value-row">
                <div className="vital-number-group">
                  <span className="vital-value">{spo2 ? `${spo2}` : '--'}</span>
                  <span className="vital-unit">%</span>
                </div>
                <div className="vital-sparkline-box">
                  <svg className="vital-sparkline" width="60" height="24">
                    <defs>
                      <linearGradient id="detail-spo2-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isSpo2Alert(spo2) ? '#9a0002' : '#94a3b8'} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={isSpo2Alert(spo2) ? '#9a0002' : '#94a3b8'} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={generateSparkline(spo2Values, 60, 24).fillPath}
                      fill="url(#detail-spo2-grad)"
                    />
                    <path
                      d={generateSparkline(spo2Values, 60, 24).strokePath}
                      fill="none"
                      stroke={isSpo2Alert(spo2) ? '#9a0002' : '#94a3b8'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="vital-detail-card">
              <div className="vital-header">
                <span className="vital-label">TEMPERATURA</span>
                <span className={`vital-trend ${isTempAlert(temperature) ? 'trend-alert' : ''}`}>
                  {getTrendArrow(tempValues)}
                </span>
              </div>
              <div className="vital-value-row">
                <div className="vital-number-group">
                  <span className="vital-value">{temperature ? `${temperature}` : '--'}</span>
                  <span className="vital-unit">°C</span>
                </div>
                <div className="vital-sparkline-box">
                  <svg className="vital-sparkline" width="60" height="24">
                    <defs>
                      <linearGradient id="detail-temp-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isTempAlert(temperature) ? '#9a0002' : '#94a3b8'} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={isTempAlert(temperature) ? '#9a0002' : '#94a3b8'} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={generateSparkline(tempValues, 60, 24).fillPath}
                      fill="url(#detail-temp-grad)"
                    />
                    <path
                      d={generateSparkline(tempValues, 60, 24).strokePath}
                      fill="none"
                      stroke={isTempAlert(temperature) ? '#9a0002' : '#94a3b8'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="vital-detail-card">
              <div className="vital-header">
                <span className="vital-label">PRESIÓN ARTERIAL</span>
                <span className={`vital-trend ${isBpAlert(bloodPressure) ? 'trend-alert' : ''}`}>
                  {getTrendArrow(bpValues)}
                </span>
              </div>
              <div className="vital-value-row">
                <div className="vital-number-group">
                  <span className="vital-value">{bloodPressure ? `${bloodPressure}` : '--'}</span>
                  <span className="vital-unit">mmHg</span>
                </div>
                <div className="vital-sparkline-box">
                  <svg className="vital-sparkline" width="60" height="24">
                    <defs>
                      <linearGradient id="detail-bp-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isBpAlert(bloodPressure) ? '#9a0002' : '#94a3b8'} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={isBpAlert(bloodPressure) ? '#9a0002' : '#94a3b8'} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={generateSparkline(bpValues, 60, 24).fillPath}
                      fill="url(#detail-bp-grad)"
                    />
                    <path
                      d={generateSparkline(bpValues, 60, 24).strokePath}
                      fill="none"
                      stroke={isBpAlert(bloodPressure) ? '#9a0002' : '#94a3b8'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
