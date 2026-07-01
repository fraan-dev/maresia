package br.edu.ifrn.maresia.report;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportRepository repository;
    public ReportController(ReportRepository repository){this.repository=repository;}

    @GetMapping public List<Report> list(){return repository.findAllByOrderByCreatedAtDesc();}

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Report create(@Valid @RequestBody Report report){
        if(report.getId()==null || report.getId().isBlank()) report.setId(java.util.UUID.randomUUID().toString());
        if(report.getCreatedAt()==null) report.setCreatedAt(Instant.now());
        if(report.getStatus()==null || report.getStatus().isBlank()) report.setStatus("pending");
        return repository.save(report);
    }

    @PutMapping("/{id}")
    public Report update(@PathVariable String id,@Valid @RequestBody Report incoming){
        Report current=repository.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        current.setType(incoming.getType()); current.setQuantity(incoming.getQuantity()); current.setComment(incoming.getComment());
        current.setPhoto(incoming.getPhoto()); current.setLat(incoming.getLat()); current.setLng(incoming.getLng());
        current.setStatus(incoming.getStatus()); current.setUpdatedAt(Instant.now());
        return repository.save(current);
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id){if(!repository.existsById(id))throw new ResponseStatusException(HttpStatus.NOT_FOUND);repository.deleteById(id);}
}
