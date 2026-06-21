package com.hospital.healthtech.infrastructure.entrypoints;

import com.hospital.healthtech.core.application.PatientRepository;
import com.hospital.healthtech.core.application.RegisterPatientUseCase;
import com.hospital.healthtech.core.domain.Patient;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adaptador de entrada REST. Traduce solicitudes HTTP a llamadas de casos de uso del dominio.
 */
@RestController
@RequestMapping("/api/v1/patients")
public class PatientRestController {

    private final RegisterPatientUseCase registerPatientUseCase;
    private final PatientRepository patientRepository;

    public PatientRestController(RegisterPatientUseCase registerPatientUseCase, PatientRepository patientRepository) {
        this.registerPatientUseCase = registerPatientUseCase;
        this.patientRepository = patientRepository;
    }

    @PostMapping
    public ResponseEntity<PatientDTO> registerPatient(@Valid @RequestBody PatientDTO dto) {
        Patient domainPatient = new Patient(
                UUID.randomUUID(),
                dto.getFirstName(),
                dto.getLastName(),
                dto.getDocumentId(),
                dto.getBirthDate(),
                dto.getAllergies(),
                dto.getPreExistingConditions(),
                dto.getTriageStatus()
        );
        Patient savedPatient = registerPatientUseCase.execute(domainPatient);

        PatientDTO responseDto = new PatientDTO(
                savedPatient.getId(),
                savedPatient.getFirstName(),
                savedPatient.getLastName(),
                savedPatient.getDocumentId(),
                savedPatient.getBirthDate(),
                savedPatient.getAllergies(),
                savedPatient.getPreExistingConditions(),
                savedPatient.getTriageStatus()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    @GetMapping
    public ResponseEntity<List<PatientDTO>> getAllPatients() {
        List<PatientDTO> list = patientRepository.findAll().stream()
                .map(savedPatient -> new PatientDTO(
                        savedPatient.getId(),
                        savedPatient.getFirstName(),
                        savedPatient.getLastName(),
                        savedPatient.getDocumentId(),
                        savedPatient.getBirthDate(),
                        savedPatient.getAllergies(),
                        savedPatient.getPreExistingConditions(),
                        savedPatient.getTriageStatus()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }
}
