package com.hospital.healthtech.core.domain;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Entidad pura del dominio (DDD). Completamente libre de anotaciones de persistencia o de framework.
 */
public class Patient {
    private final UUID id;
    private final String firstName;
    private final String lastName;
    private final String documentId;
    private final LocalDate birthDate;
    private final String allergies;
    private final String preExistingConditions;
    private final TriageStatus triageStatus;

    public Patient(UUID id, String firstName, String lastName, String documentId, LocalDate birthDate, String allergies, String preExistingConditions, TriageStatus triageStatus) {
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

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getDocumentId() {
        return documentId;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public String getAllergies() {
        return allergies;
    }

    public String getPreExistingConditions() {
        return preExistingConditions;
    }

    public TriageStatus getTriageStatus() {
        return triageStatus;
    }
}
