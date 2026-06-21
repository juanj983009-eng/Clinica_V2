import { useState, useEffect } from 'react'
import { useTelemetry } from '../context/TelemetryContext'
import './NursingDashboard.css'

interface NursingDashboardProps {
  onSelectPatient: (id: string) => void;
}

export default function NursingDashboard({ onSelectPatient }: NursingDashboardProps) {
  const { tracks } = useTelemetry()
  const [criticalTrend, setCriticalTrend] = useState<number[]>([0, 0])
  const [selectedTriage, setSelectedTriage] = useState<string>('Todos')

  const getTriageClass = (triage: string) => {
    switch (triage.toUpperCase()) {
      case 'CRITICO':
        return 'triage-critical'
      case 'URGENTE':
        return 'triage-urgent'
      case 'SEMI_URGENTE':
        return 'triage-semi-urgent'
      case 'NO_URGENTE':
      default:
        return 'triage-non-urgent'
    }
  }

  const getTriageLabel = (triage: string) => {
    switch (triage.toUpperCase()) {
      case 'CRITICO':
        return 'CRÍTICO'
      case 'URGENTE':
        return 'URGENTE'
      case 'SEMI_URGENTE':
        return 'SEMI-URGENTE'
      case 'NO_URGENTE':
      default:
        return 'NO URGENTE'
    }
  }

  const isCriticalMetrics = (heartRate?: number, spo2?: number) => {
    if (!heartRate || !spo2) return false
    return heartRate > 120 || spo2 < 92
  }

  const getHeartRateArrow = (hr?: number) => {
    if (!hr) return '—'
    if (hr > 100) return '↗'
    if (hr < 60) return '↘'
    return '—'
  }

  const getSpo2Arrow = (spo2?: number) => {
    if (!spo2) return '—'
    if (spo2 < 95) return '↘'
    return '—'
  }

  const getTempArrow = (temp?: number) => {
    if (!temp) return '—'
    if (temp > 37.5) return '↗'
    if (temp < 36.0) return '↘'
    return '—'
  }

  const getBpArrow = (bp?: string) => {
    if (!bp) return '—'
    const parts = bp.split('/')
    const sys = parseInt(parts[0])
    const dia = parseInt(parts[1])
    if (isNaN(sys) || isNaN(dia)) return '—'
    if (sys > 140 || dia > 90) return '↗'
    if (sys < 90 || dia < 60) return '↘'
    return '—'
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

  const getRespiratoryRate = (hr?: number) => {
    if (!hr) return 16
    const base = 12 + Math.floor((hr - 60) / 8)
    return Math.max(12, Math.min(24, base))
  }

  // Conteo de pacientes críticos en tiempo real
  const criticalCount = tracks.filter(
    t => t.patient.triageStatus === 'CRITICO' || isCriticalMetrics(t.metrics?.heartRate, t.metrics?.spo2)
  ).length

  // Efecto para actualizar la tendencia histórica de críticos
  useEffect(() => {
    setCriticalTrend(prev => {
      const next = [...prev, criticalCount]
      if (next.length > 20) {
        next.shift()
      }
      return next
    })
  }, [criticalCount])

  const generateHeaderSparkline = (trend: number[], width = 60, height = 20) => {
    const data = trend.length >= 2 ? trend : (trend.length === 1 ? [trend[0], trend[0]] : [0, 0])
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min === 0 ? 1 : max - min
    
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height - 4) - 2
      return { x, y }
    })
    
    const strokePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const fillPath = `${strokePath} L ${width} ${height} L 0 ${height} Z`
    
    return { strokePath, fillPath }
  }

  // Generador de sparkline suavizado
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

  const filteredTracks = selectedTriage === 'Todos'
    ? tracks
    : tracks.filter(t => {
        const status = t.patient.triageStatus?.toUpperCase()
        if (selectedTriage === 'Crítico') return status === 'CRITICO'
        if (selectedTriage === 'Urgente') return status === 'URGENTE'
        if (selectedTriage === 'Semi-Urgente') return status === 'SEMI_URGENTE'
        if (selectedTriage === 'No Urgente') return status === 'NO_URGENTE'
        return true
      })

  return (
    <div className="nursing-dashboard-container">
      <div className="dashboard-header-row">
        <h2 className="dashboard-title">CENTRAL DE TELEMETRÍA</h2>
        
        {/* Panel de analíticas agregadas */}
        <div className="global-analytics-panel">
          <div className="header-metric-card">
            <span className="analytic-label">Total Activos (5 min)</span>
            <div className="analytic-value-row">
              <span className="analytic-value">{tracks.filter(t => t.connected).length}</span>
              <span className="pulse-indicator">●</span>
            </div>
          </div>

          <div className="header-metric-card">
            <span className="analytic-label">Críticos</span>
            <div className="analytic-value-row">
              <span className="analytic-value text-cherry">{criticalCount}</span>
                <svg width="60" height="24" viewBox="0 0 60 24" fill="none" className="header-sparkline global-sparkline">
                  <path d="M0 18C10 18 15 6 25 6C35 6 40 20 50 20L60 12" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
          </div>

          <div className="header-metric-card alert-badge-card">
            <span className="analytic-label">Alertas del Sistema</span>
            <div className="alerts-badge-container">
              <span className="code-red-badge pulsing-cherry">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg> CODE RED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de filtros de triage */}
      <div className="triage-filter-bar">
        <span className="filter-title">FILTRAR:</span>
        <button 
          type="button" 
          className={`filter-btn ${selectedTriage === 'Todos' ? 'active' : ''}`}
          onClick={() => setSelectedTriage('Todos')}
        >
          Todos
        </button>
        <button 
          type="button" 
          className={`filter-btn ${selectedTriage === 'Crítico' ? 'active' : ''}`}
          onClick={() => setSelectedTriage('Crítico')}
        >
          Crítico
        </button>
        <button 
          type="button" 
          className={`filter-btn ${selectedTriage === 'Urgente' ? 'active' : ''}`}
          onClick={() => setSelectedTriage('Urgente')}
        >
          Urgente
        </button>
        <button 
          type="button" 
          className={`filter-btn ${selectedTriage === 'Semi-Urgente' ? 'active' : ''}`}
          onClick={() => setSelectedTriage('Semi-Urgente')}
        >
          Semi-Urgente
        </button>
        <button 
          type="button" 
          className={`filter-btn ${selectedTriage === 'No Urgente' ? 'active' : ''}`}
          onClick={() => setSelectedTriage('No Urgente')}
        >
          No Urgente
        </button>
      </div>

      {tracks.length === 0 ? (
        <div className="no-patients">No hay pacientes admitidos en el sistema.</div>
      ) : filteredTracks.length === 0 ? (
        <div className="no-patients">No hay pacientes con el nivel de triage seleccionado.</div>
      ) : (
        <div className="patients-grid">
          {filteredTracks.map(({ patient, metrics, history, connected }) => {
            const heartRate = metrics?.heartRate
            const spo2 = metrics?.spo2
            const bloodPressure = metrics?.bloodPressure
            const temperature = metrics?.temperature
            
            const isCritical = isCriticalMetrics(heartRate, spo2)
            const triageClass = getTriageClass(patient.triageStatus)

            // Filtrar históricos para gráficos sparkline seguros
            const hrValues = (history || []).map(h => h.heartRate).filter((v): v is number => typeof v === 'number')
            const spo2Values = (history || []).map(h => h.spo2).filter((v): v is number => typeof v === 'number')
            const tempValues = (history || []).map(h => h.temperature).filter((v): v is number => typeof v === 'number')
            const bpValues = (history || []).map(h => {
              if (!h.bloodPressure) return undefined
              const parts = h.bloodPressure.split('/')
              const sys = parseInt(parts[0])
              return isNaN(sys) ? undefined : sys
            }).filter((v): v is number => typeof v === 'number')

            // IDs únicos para gradientes SVG
            const hrGradId = `hr-grad-${patient.id}`
            const spo2GradId = `spo2-grad-${patient.id}`
            const tempGradId = `temp-grad-${patient.id}`
            const bpGradId = `bp-grad-${patient.id}`

            const isCriticalPatient = patient.triageStatus === 'CRITICO' || isCritical
            const waveClass = isCriticalPatient ? 'wave-critical' : 'wave-stable'
            const pulseDuration = heartRate ? `${(60 / heartRate) * 2}s` : '1.5s'
            
            const waveMorphologies = [
              {
                path1: "M 0,20 C 10,20 15,2 20,2 C 25,2 28,15 32,12 C 36,10 40,20 50,20 L 75,20 C 85,20 90,2 95,2 C 100,2 103,15 107,12 C 111,10 115,20 125,20 L 150,20 C 160,20 165,2 170,2 C 175,2 178,15 182,12 C 186,10 190,20 200,20 L 225,20 C 235,20 240,2 245,2 C 250,2 253,15 257,12 C 261,10 265,20 275,20 L 300,20",
                path2: "M 300,20 C 310,20 315,2 320,2 C 325,2 328,15 332,12 C 336,10 340,20 350,20 L 375,20 C 385,20 390,2 395,2 C 400,2 403,15 407,12 C 411,10 415,20 425,20 L 450,20 C 460,20 465,2 470,2 C 475,2 478,15 482,12 C 486,10 490,20 500,20 L 525,20 C 535,20 540,2 545,2 C 550,2 553,15 557,12 C 561,10 565,20 575,20 L 600,20"
              },
              {
                path1: "M 0,20 C 5,20 8,0 12,0 C 16,0 18,12 20,10 C 22,8 24,20 30,20 L 50,20 C 55,20 58,0 62,0 C 66,0 68,12 70,10 C 72,8 74,20 80,20 L 100,20 C 105,20 108,0 112,0 C 116,0 118,12 120,10 C 122,8 124,20 130,20 L 150,20 C 155,20 158,0 162,0 C 166,0 168,12 170,10 C 172,8 174,20 180,20 L 200,20 C 205,20 208,0 212,0 C 216,0 218,12 220,10 C 222,8 224,20 230,20 L 250,20 C 255,20 258,0 262,0 C 266,0 268,12 270,10 C 272,8 274,20 280,20 L 300,20",
                path2: "M 300,20 C 305,20 308,0 312,0 C 316,0 318,12 320,10 C 322,8 324,20 330,20 L 350,20 C 355,20 358,0 362,0 C 366,0 368,12 370,10 C 372,8 374,20 380,20 L 400,20 C 405,20 408,0 412,0 C 416,0 418,12 420,10 C 422,8 424,20 430,20 L 450,20 C 455,20 458,0 462,0 C 466,0 468,12 470,10 C 472,8 474,20 480,20 L 500,20 C 505,20 508,0 512,0 C 516,0 518,12 520,10 C 522,8 524,20 530,20 L 550,20 C 555,20 558,0 562,0 C 566,0 568,12 570,10 C 572,8 574,20 580,20 L 600,20"
              },
              {
                path1: "M 0,20 L 20,20 C 35,20 40,4 50,4 C 60,4 65,16 70,14 C 75,12 80,20 95,20 L 170,20 C 185,20 190,4 200,4 C 210,4 215,16 220,14 C 225,12 230,20 245,20 L 300,20",
                path2: "M 300,20 L 320,20 C 335,20 340,4 350,4 C 360,4 365,16 370,14 C 375,12 380,20 395,20 L 470,20 C 485,20 490,4 500,4 C 510,4 515,16 520,14 C 525,12 530,20 545,20 L 600,20"
              }
            ]
            
            const morphIndex = (patient.id.charCodeAt(patient.id.length - 1) || 0) % 3
            const selectedMorph = waveMorphologies[morphIndex]

            return (
              <div 
                key={patient.id} 
                className={`patient-card ${triageClass} ${isCritical ? 'metrics-alert' : ''}`}
                onClick={() => onSelectPatient(patient.id)}
              >
                <div className="card-header">
                  <div className="patient-info">
                    <h3 className="patient-name">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <span className="patient-doc">
                      ID: {patient.documentId} &bull; Cama {patient.id.slice(0, 4).toUpperCase()}
                    </span>
                  </div>
                  <div className={`triage-badge ${triageClass}`}>
                    &bull; {getTriageLabel(patient.triageStatus)}
                  </div>
                </div>

                <div className="card-body">
                  <div className="clinical-details">
                    <div className="detail-item">
                      <span className="detail-label">Alergias:</span>
                      <span className="detail-value">
                        {patient.allergies || 'No registra'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Condiciones:</span>
                      <span className="detail-value">
                        {patient.preExistingConditions || 'No registra'}
                      </span>
                    </div>
                  </div>

                  <hr className="card-divider" />

                  {/* 4 cajas de constantes vitales */}
                  <div className="metrics-container">
                    <div className="metric-box metric-block">
                      <div className="metric-header">
                        <span className="metric-label">FRECUENCIA CARDÍACA</span>
                        <span className={`metric-arrow ${isHeartRateAlert(heartRate) ? 'arrow-alert' : ''}`}>
                          {getHeartRateArrow(heartRate)}
                        </span>
                      </div>
                      <div className="metric-value-row">
                        <span className={`metric-value ${isHeartRateAlert(heartRate) ? 'value-alert' : ''}`}>
                          {heartRate ? `${heartRate}` : '--'}
                        </span>
                        <span className="metric-unit">bpm</span>
                        
                        {/* Sparkline de Frecuencia Cardíaca */}
                        <div className="metric-sparkline-container">
                          <svg className="metric-sparkline" width="60" height="24">
                            <defs>
                              <linearGradient id={hrGradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={isHeartRateAlert(heartRate) ? '#fca5a5' : '#94a3b8'} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={isHeartRateAlert(heartRate) ? '#fca5a5' : '#94a3b8'} stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path
                              d={generateSparkline(hrValues, 60, 24).fillPath}
                              fill={`url(#${hrGradId})`}
                            />
                            <path
                              d={generateSparkline(hrValues, 60, 24).strokePath}
                              fill="none"
                              stroke={isHeartRateAlert(heartRate) ? '#fca5a5' : '#94a3b8'}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className={`metric-bar-indicator ${isHeartRateAlert(heartRate) ? 'bar-alert' : 'bar-normal'}`}></div>
                    </div>

                    <div className="metric-box metric-block">
                      <div className="metric-header">
                        <span className="metric-label">SATURACIÓN O₂</span>
                        <span className={`metric-arrow ${isSpo2Alert(spo2) ? 'arrow-alert' : ''}`}>
                          {getSpo2Arrow(spo2)}
                        </span>
                      </div>
                      <div className="metric-value-row">
                        <span className={`metric-value ${isSpo2Alert(spo2) ? 'value-alert' : ''}`}>
                          {spo2 ? `${spo2}` : '--'}
                        </span>
                        <span className="metric-unit">%</span>

                        {/* Sparkline de SatO2 */}
                        <div className="metric-sparkline-container">
                          <svg className="metric-sparkline" width="60" height="24">
                            <defs>
                              <linearGradient id={spo2GradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={isSpo2Alert(spo2) ? '#fca5a5' : '#94a3b8'} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={isSpo2Alert(spo2) ? '#fca5a5' : '#94a3b8'} stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path
                              d={generateSparkline(spo2Values, 60, 24).fillPath}
                              fill={`url(#${spo2GradId})`}
                            />
                            <path
                              d={generateSparkline(spo2Values, 60, 24).strokePath}
                              fill="none"
                              stroke={isSpo2Alert(spo2) ? '#fca5a5' : '#94a3b8'}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className={`metric-bar-indicator ${isSpo2Alert(spo2) ? 'bar-alert' : 'bar-normal'}`}></div>
                    </div>

                    <div className="metric-box metric-block">
                      <div className="metric-header">
                        <span className="metric-label">TEMPERATURA</span>
                        <span className={`metric-arrow ${isTempAlert(temperature) ? 'arrow-alert' : ''}`}>
                          {getTempArrow(temperature)}
                        </span>
                      </div>
                      <div className="metric-value-row">
                        <span className={`metric-value ${isTempAlert(temperature) ? 'value-alert' : ''}`}>
                          {temperature ? `${temperature}` : '--'}
                        </span>
                        <span className="metric-unit">°C</span>

                        {/* Sparkline de Temperatura */}
                        <div className="metric-sparkline-container">
                          <svg className="metric-sparkline" width="60" height="24">
                            <defs>
                              <linearGradient id={tempGradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={isTempAlert(temperature) ? '#fca5a5' : '#94a3b8'} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={isTempAlert(temperature) ? '#fca5a5' : '#94a3b8'} stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path
                              d={generateSparkline(tempValues, 60, 24).fillPath}
                              fill={`url(#${tempGradId})`}
                            />
                            <path
                              d={generateSparkline(tempValues, 60, 24).strokePath}
                              fill="none"
                              stroke={isTempAlert(temperature) ? '#fca5a5' : '#94a3b8'}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className={`metric-bar-indicator ${isTempAlert(temperature) ? 'bar-alert' : 'bar-normal'}`}></div>
                    </div>

                    <div className="metric-box metric-block">
                      <div className="metric-header">
                        <span className="metric-label">PRESIÓN ARTERIAL</span>
                        <span className={`metric-arrow ${isBpAlert(bloodPressure) ? 'arrow-alert' : ''}`}>
                          {getBpArrow(bloodPressure)}
                        </span>
                      </div>
                      <div className="metric-value-row">
                        <span className={`metric-value ${isBpAlert(bloodPressure) ? 'value-alert' : ''}`}>
                          {bloodPressure ? bloodPressure : '--'}
                        </span>
                        <span className="metric-unit">mmHg</span>

                        {/* Sparkline de Presión Arterial */}
                        <div className="metric-sparkline-container">
                          <svg className="metric-sparkline" width="60" height="24">
                            <defs>
                              <linearGradient id={bpGradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={isBpAlert(bloodPressure) ? '#fca5a5' : '#94a3b8'} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={isBpAlert(bloodPressure) ? '#fca5a5' : '#94a3b8'} stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path
                              d={generateSparkline(bpValues, 60, 24).fillPath}
                              fill={`url(#${bpGradId})`}
                            />
                            <path
                              d={generateSparkline(bpValues, 60, 24).strokePath}
                              fill="none"
                              stroke={isBpAlert(bloodPressure) ? '#fca5a5' : '#94a3b8'}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className={`metric-bar-indicator ${isBpAlert(bloodPressure) ? 'bar-alert' : 'bar-normal'}`}></div>
                    </div>
                  </div>

                  {/* Fila intermedia: Onda SpO2 (ECG scroll) y Frecuencia Respiratoria */}
                  <div className="card-intermediate-row">
                    <div className={`pleth-waveform-block spo2-waveform-container ${waveClass}`}>
                      <div className="waveform-header">
                        <span className="waveform-label">SpO2 WAVEFORM (Pleth)</span>
                        <span className="waveform-status-badge">LIVE</span>
                      </div>
                      <div className="waveform-visual-container">
                        <div className="waveform-scroll-track" style={{ animationDuration: pulseDuration }}>
                          <svg className="pleth-svg" viewBox="0 0 300 40" preserveAspectRatio="none">
                            <path
                              d={selectedMorph.path1}
                              fill="none"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d={selectedMorph.path2}
                              fill="none"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="metric-box metric-block resp-rate-block">
                      <div className="metric-header">
                        <span className="metric-label">RESPIRATORY RATE</span>
                        <span className="metric-arrow">—</span>
                      </div>
                      <div className="metric-value-row">
                        <span className="metric-value">
                          {heartRate ? getRespiratoryRate(heartRate) : '--'}
                        </span>
                        <span className="metric-unit">rpm</span>
                      </div>
                      <div className="metric-bar-indicator bar-normal"></div>
                    </div>
                  </div>
                </div>

                {/* Footer Expandido (Análisis de IA) */}
                <div className="card-expanded-footer">
                  <div className="footer-col col-ecg">
                    <span className="col-label">ECG Rhythm: 1h</span>
                    <div className="ecg-status-row">
                      <span className="pulse-dot">●</span>
                      <span className="col-val">{isHeartRateAlert(heartRate) ? 'Ritmo Irregular' : 'Sinusal Normal'}</span>
                    </div>
                  </div>

                  <div className="footer-col col-history">
                    <span className="col-label">Mín / Máx</span>
                    <div className="history-values">
                      <div className="hist-item">FC: {hrValues.length > 0 ? `${Math.min(...hrValues)} - ${Math.max(...hrValues)}` : '--'}</div>
                      <div className="hist-item">SpO₂: {spo2Values.length > 0 ? `${Math.min(...spo2Values)}% - ${Math.max(...spo2Values)}%` : '--'}</div>
                    </div>
                  </div>

                  <div className="footer-col col-ia">
                    <span className="col-label">🧠 ANÁLISIS IA</span>
                    <div className={`ia-badge ${isHeartRateAlert(heartRate) ? 'risk-high' : 'risk-low'}`}>
                      {isHeartRateAlert(heartRate) ? 'Arritmia: ALTO' : 'Arritmia: BAJO'}
                    </div>
                  </div>
                </div>

                {/* Conexión y Avisos Críticos adicionales */}
                <div className="card-footer">
                  <span className={`connection-status ${connected ? 'status-connected' : 'status-disconnected'}`}>
                    {connected ? '● Transmitiendo' : '○ Desconectado'}
                  </span>
                  {patient.triageStatus === 'CRITICO' && (
                    <span className="critical-revision-text">⚠️ Revisión urgente</span>
                  )}
                  {isCritical && patient.triageStatus !== 'CRITICO' && (
                    <span className="critical-warning-badge">⚠️ RIESGO CLÍNICO</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
