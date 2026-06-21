package com.hospital.healthtech.infrastructure.entrypoints;

import com.hospital.healthtech.core.application.PatientRepository;
import com.hospital.healthtech.core.domain.Patient;
import jakarta.annotation.PreDestroy;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Random;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Controlador de Server-Sent Events (SSE) para emitir métricas simuladas de telemetría clínica.
 */
@RestController
@RequestMapping("/api/v1/monitors")
public class TelemetrySseController {

    private final PatientRepository patientRepository;
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final Random random = new Random();

    public TelemetrySseController(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
        
        // Tarea en segundo plano: Emitir telemetría cada 4 segundos
        this.scheduler.scheduleAtFixedRate(this::sendTelemetryData, 0, 4, TimeUnit.SECONDS);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamTelemetry() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((ex) -> emitters.remove(emitter));

        // Enviar evento de conexión inicial
        try {
            emitter.send(SseEmitter.event().name("connected").data("SSE Stream Connected"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    private void sendTelemetryData() {
        if (emitters.isEmpty()) {
            return;
        }

        List<Patient> patients = patientRepository.findAll();
        if (patients.isEmpty()) {
            return;
        }

        for (Patient patient : patients) {
            try {
                int heartRate;
                int spo2;
                String bloodPressure;

                // Simular según el nivel de triage
                if ("CRITICO".equalsIgnoreCase(patient.getTriageStatus().name())) {
                    // Signos críticos en rango de alarma
                    heartRate = 122 + random.nextInt(20);  // 122-141 bpm (Crítico > 120)
                    spo2 = 86 + random.nextInt(6);         // 86-91 % (Crítico < 92)
                    bloodPressure = (145 + random.nextInt(20)) + "/" + (95 + random.nextInt(12));
                } else if ("URGENTE".equalsIgnoreCase(patient.getTriageStatus().name())) {
                    // Signos urgentes moderados
                    heartRate = 98 + random.nextInt(18);   // 98-115 bpm
                    spo2 = 91 + random.nextInt(4);         // 91-94 %
                    bloodPressure = "132/84";
                } else if ("SEMI_URGENTE".equalsIgnoreCase(patient.getTriageStatus().name())) {
                    // Signos semicríticos estables
                    heartRate = 80 + random.nextInt(18);   // 80-97 bpm
                    spo2 = 94 + random.nextInt(3);         // 94-96 %
                    bloodPressure = "125/82";
                } else {
                    // Signos estables / normales
                    heartRate = 65 + random.nextInt(15);   // 65-79 bpm
                    spo2 = 97 + random.nextInt(3);         // 97-99 %
                    bloodPressure = "118/76";
                }

                // Generar JSON del evento de telemetría (con id de paciente y métricas)
                String payload = String.format(
                    "{\"patientId\":\"%s\",\"metrics\":{\"heartRate\":%d,\"spo2\":%d,\"bloodPressure\":\"%s\",\"timestamp\":\"%s\"}}",
                    patient.getId().toString(),
                    heartRate,
                    spo2,
                    bloodPressure,
                    java.time.Instant.now().toString()
                );

                for (SseEmitter emitter : emitters) {
                    try {
                        emitter.send(SseEmitter.event().data(payload));
                    } catch (Exception e) {
                        emitters.remove(emitter);
                    }
                }
            } catch (Exception e) {
                System.err.println("Error enviando telemetría SSE: " + e.getMessage());
            }
        }
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdown();
    }
}
