package com.hospital.healthtech.core.application;

import com.hospital.healthtech.core.domain.Patient;
import org.springframework.stereotype.Service;

/**
 * Servicio de aplicación que implementa el caso de uso para registrar pacientes.
 * Aplica reglas de negocio sobre campos clínicos opcionales.
 */
@Service
public class RegisterPatientService implements RegisterPatientUseCase {

    private final PatientRepository patientRepository;

    public RegisterPatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    public Patient execute(Patient patient) {
        // Regla: si 'allergies' es nulo o vacío, normalizar a "No registra".
        String allergies = patient.getAllergies();
        if (allergies == null || allergies.trim().isEmpty()) {
            allergies = "No registra";
        }

        // Regla: si 'preExistingConditions' es nulo o vacío, mantenerlo limpio (nulo para BD limpia).
        String preExistingConditions = patient.getPreExistingConditions();
        if (preExistingConditions != null && preExistingConditions.trim().isEmpty()) {
            preExistingConditions = null;
        }

        Patient patientToSave = new Patient(
                patient.getId(),
                patient.getFirstName(),
                patient.getLastName(),
                patient.getDocumentId(),
                patient.getBirthDate(),
                allergies,
                preExistingConditions,
                patient.getTriageStatus()
        );

        return patientRepository.save(patientToSave);
    }
}
