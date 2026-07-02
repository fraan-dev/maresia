package br.edu.ifrn.maresia.report;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ReportService {
    private final ReportRepository repository;

    public ReportService(ReportRepository repository) {
        this.repository = repository;
    }

    public List<Report> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public Report create(Report report) {
        if (report.getId() == null || report.getId().isBlank()) {
            report.setId(UUID.randomUUID().toString());
        }
        if (report.getCreatedAt() == null) {
            report.setCreatedAt(Instant.now());
        }
        if (report.getStatus() == null || report.getStatus().isBlank()) {
            report.setStatus("pending");
        }
        return repository.save(report);
    }

    public Report update(String id, Report incoming) {
        Report existing = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Denúncia não encontrada"));
        
        existing.setType(incoming.getType());
        existing.setQuantity(incoming.getQuantity());
        existing.setComment(incoming.getComment());
        existing.setPhoto(incoming.getPhoto());
        existing.setLat(incoming.getLat());
        existing.setLng(incoming.getLng());
        existing.setStatus(incoming.getStatus());
        existing.setUpdatedAt(Instant.now());
        
        return repository.save(existing);
    }

    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Denúncia não encontrada");
        }
        repository.deleteById(id);
    }
}