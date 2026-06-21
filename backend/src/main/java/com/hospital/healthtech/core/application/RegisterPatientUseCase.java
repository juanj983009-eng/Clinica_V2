package com.hospital.healthtech.core.application;

import com.hospital.healthtech.core.domain.Patient;

/**
 * Puerto de entrada (Usecase) para el registro de pacientes en el dominio.
 */
public interface RegisterPatientUseCase {
    Patient execute(Patient patient);
}
