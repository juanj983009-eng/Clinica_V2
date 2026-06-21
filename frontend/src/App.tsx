import { useState } from 'react'
import { TelemetryProvider } from './context/TelemetryContext'
import AdmissionForm from './components/AdmissionForm'
import NursingDashboard from './components/NursingDashboard'
import PatientDetailView from './components/PatientDetailView'

function App() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  return (
    <TelemetryProvider>
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', minHeight: '100vh' }}>
        <AdmissionForm />
        {selectedPatientId ? (
          <PatientDetailView 
            patientId={selectedPatientId} 
            onBack={() => setSelectedPatientId(null)} 
          />
        ) : (
          <NursingDashboard onSelectPatient={setSelectedPatientId} />
        )}
      </div>
    </TelemetryProvider>
  )
}

export default App
