package com.hospital.healthtech.core.application;

import com.hospital.healthtech.core.domain.Patient;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de salida (Repository) para desacoplar el negocio de la infraestructura de persistencia.
 */
public interface PatientRepository {
    Patient save(Patient patient);
    Optional<Patient> findById(UUID id);
    Optional<Patient> findByDocumentId(String documentId);
    List<Patient> findAll();
}
