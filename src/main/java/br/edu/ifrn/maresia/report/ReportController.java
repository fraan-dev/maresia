package br.edu.ifrn.maresia.report;

import br.edu.ifrn.maresia.ai.WasteClassifierService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService service;
    private final WasteClassifierService classifier;

    public ReportController(ReportService service, WasteClassifierService classifier) {
        this.service = service;
        this.classifier = classifier;
    }

    @GetMapping
    public List<Report> list() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Report create(@Valid @RequestBody Report report) {
        
        if (report.getType() == null || report.getType().isBlank() || 
            report.getType().equals("Selecione uma categoria")) {
            String suggestedType = classifier.classify(report.getComment());
            report.setType(suggestedType);
            System.out.println("🤖 IA classificou como: " + suggestedType);
        }
        return service.create(report);
    }

    @PutMapping("/{id}")
    public Report update(@PathVariable String id, @Valid @RequestBody Report incoming) {
        return service.update(id, incoming);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}