package com.hospital.healthtech.infrastructure.persistence;

import com.hospital.healthtech.core.application.PatientRepository;
import com.hospital.healthtech.core.domain.Patient;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adaptador de persistencia. Implementa el puerto de salida del dominio (PatientRepository)
 * utilizando Spring Data JPA para PostgreSQL.
 */
@Component
public class PatientRepositoryImpl implements PatientRepository {

    private final SpringDataPatientRepository jpaRepository;
    private final PatientMapper patientMapper;

    public PatientRepositoryImpl(SpringDataPatientRepository jpaRepository, PatientMapper patientMapper) {
        this.jpaRepository = jpaRepository;
        this.patientMapper = patientMapper;
    }

    @Override
    public Patient save(Patient patient) {
        PatientJpaEntity jpaEntity = patientMapper.toJpaEntity(patient);
        PatientJpaEntity savedEntity = jpaRepository.save(jpaEntity);
        return patientMapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Patient> findById(UUID id) {
        return jpaRepository.findById(id).map(patientMapper::toDomain);
    }

    @Override
    public Optional<Patient> findByDocumentId(String documentId) {
        return jpaRepository.findByDocumentId(documentId).map(patientMapper::toDomain);
    }

    @Override
    public List<Patient> findAll() {
        return jpaRepository.findAll().stream()
                .map(patientMapper::toDomain)
                .collect(Collectors.toList());
    }
}
