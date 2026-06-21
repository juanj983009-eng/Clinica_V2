package com.hospital.healthtech.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio de Spring Data JPA para realizar operaciones sobre la tabla relacional en PostgreSQL.
 */
@Repository
public interface SpringDataPatientRepository extends JpaRepository<PatientJpaEntity, UUID> {
    Optional<PatientJpaEntity> findByDocumentId(String documentId);
}
