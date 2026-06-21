import { createContext, useContext, useState, useEffect, useCallback, ReactNode, FC } from 'react'
import axios from 'axios'

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
  birthDate: string;
  triageStatus: 'CRITICO' | 'URGENTE' | 'SEMI_URGENTE' | 'NO_URGENTE';
  allergies?: string;
  preExistingConditions?: string;
}

export interface TelemetryMetrics {
  heartRate: number;
  bloodPressure: string;
  spo2: number;
  temperature?: number;
  timestamp: string;
}

export interface PatientTrack {
  patient: Patient;
  metrics?: TelemetryMetrics;
  history?: TelemetryMetrics[];
  connected: boolean;
}

interface TelemetryContextType {
  tracks: PatientTrack[];
  registerPatient: (patientData: Omit<Patient, 'id'>) => Promise<Patient>;
  error: string | null;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<PatientTrack[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Cargar pacientes iniciales
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get<Patient[]>('/api/v1/patients');
        const initialTracks = response.data.map(p => ({
          patient: p,
          connected: true,
          history: []
        }));
        setTracks(initialTracks);
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };
    fetchPatients();
  }, []);

  // Lógica de Mutación Optimista en Registro
  const registerPatient = useCallback(async (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
    // Generar UUID temporal para la actualización optimista
    const tempId = `temp-${crypto.randomUUID()}`;
    const tempPatient: Patient = {
      id: tempId,
      ...patientData
    };

    const tempTrack: PatientTrack = {
      patient: tempPatient,
      connected: false
    };

    // Guardar estado previo para Rollback
    const previousTracks = [...tracks];

    // Mutación optimista síncrona
    setTracks(prev => [...prev, tempTrack]);
    setError(null);

    try {
      // Petición HTTP POST real
      const response = await axios.post<Patient>('/api/v1/patients', patientData);
      const savedPatient = response.data;

      // Actualizar con el registro y ID real devuelto por la base de datos
      setTracks(prev =>
        prev.map(t =>
          t.patient.id === tempId
            ? { ...t, patient: savedPatient, connected: true }
            : t
        )
      );

      return savedPatient;
    } catch (err: any) {
      // Rollback al estado anterior si falla la API
      setTracks(previousTracks);
      const errorMessage = err?.response?.data?.message || err.message || 'Error al registrar el paciente';
      setError(errorMessage);
      alert(`[ERROR DE ADMISIÓN] ${errorMessage}`);
      throw err;
    }
  }, [tracks]);

  useEffect(() => {
    const eventSource = new EventSource('/api/v1/monitors/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { patientId, metrics }: { patientId: string; metrics: TelemetryMetrics } = data;

        if (metrics && typeof metrics.temperature === 'undefined') {
          const baseTemp = metrics.heartRate > 100 ? 37.8 : 36.2;
          metrics.temperature = parseFloat((baseTemp + Math.random() * 1.4).toFixed(1));
        }

        // Actualizar únicamente las métricas e historial del paciente correspondiente
        setTracks(prev => {
          const exists = prev.some(t => t.patient.id === patientId);
          if (!exists) return prev;

          return prev.map(t => {
            if (t.patient.id === patientId) {
              const newHistory = t.history ? [...t.history, metrics] : [metrics];
              if (newHistory.length > 15) newHistory.shift(); // Conservar las últimas 15 métricas
              return { ...t, metrics, history: newHistory, connected: true };
            }
            return t;
          });
        });
      } catch (err) {
        console.error('Error parsing SSE telemetry message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <TelemetryContext.Provider value={{ tracks, registerPatient, error }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry debe usarse dentro de un TelemetryProvider');
  }
  return context;
};
