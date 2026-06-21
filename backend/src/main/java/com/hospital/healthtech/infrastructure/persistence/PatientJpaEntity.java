package com.hospital.healthtech.infrastructure.persistence;

import com.hospital.healthtech.core.domain.TriageStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Adaptador de salida (JPA Entity). Mapea el estado a las tablas relacionales de PostgreSQL.
 */
@Entity
@Table(name = "patients")
public class PatientJpaEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "document_id", nullable = false, unique = true)
    private String documentId;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(name = "allergies", nullable = true)
    private String allergies;

    @Column(name = "pre_existing_conditions", nullable = true)
    private String preExistingConditions;

    @Enumerated(EnumType.STRING)
    @Column(name = "triage_status", nullable = false)
    private TriageStatus triageStatus;

    public PatientJpaEntity() {
    }

    public PatientJpaEntity(UUID id, String firstName, String lastName, String documentId, LocalDate birthDate, String allergies, String preExistingConditions, TriageStatus triageStatus) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.documentId = documentId;
        this.birthDate = birthDate;
        this.allergies = allergies;
        this.preExistingConditions = preExistingConditions;
        this.triageStatus = triageStatus;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getDocumentId() {
        return documentId;
    }

    public void setDocumentId(String documentId) {
        this.documentId = documentId;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public String getPreExistingConditions() {
        return preExistingConditions;
    }

    public void setPreExistingConditions(String preExistingConditions) {
        this.preExistingConditions = preExistingConditions;
    }

    public TriageStatus getTriageStatus() {
        return triageStatus;
    }

    public void setTriageStatus(TriageStatus triageStatus) {
        this.triageStatus = triageStatus;
    }
}
