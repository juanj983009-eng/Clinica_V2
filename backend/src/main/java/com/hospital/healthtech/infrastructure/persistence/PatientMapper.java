package com.hospital.healthtech.infrastructure.persistence;

import com.hospital.healthtech.core.domain.Patient;
import org.springframework.stereotype.Component;

/**
 * Mapeador que transforma el objeto de dominio puro (Patient) a su entidad de base de datos relacional (PatientJpaEntity) y viceversa.
 */
@Component
public class PatientMapper {

    public PatientJpaEntity toJpaEntity(Patient domain) {
        if (domain == null) {
            return null;
        }
        return new PatientJpaEntity(
                domain.getId(),
                domain.getFirstName(),
                domain.getLastName(),
                domain.getDocumentId(),
                domain.getBirthDate(),
                domain.getAllergies(),
                domain.getPreExistingConditions(),
                domain.getTriageStatus()
        );
    }

    public Patient toDomain(PatientJpaEntity jpa) {
        if (jpa == null) {
            return null;
        }
        return new Patient(
                jpa.getId(),
                jpa.getFirstName(),
                jpa.getLastName(),
                jpa.getDocumentId(),
                jpa.getBirthDate(),
                jpa.getAllergies(),
                jpa.getPreExistingConditions(),
                jpa.getTriageStatus()
        );
    }
}
