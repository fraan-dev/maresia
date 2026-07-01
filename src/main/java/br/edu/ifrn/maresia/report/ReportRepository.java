package br.edu.ifrn.maresia.report;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report,String> {
    List<Report> findAllByOrderByCreatedAtDesc();
}
