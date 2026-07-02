package br.edu.ifrn.maresia.ai;

import org.springframework.stereotype.Service;

@Service
public class WasteClassifierService {
    
    public String classify(String comment) {
        if (comment == null || comment.isBlank()) {
            return "Outro";
        }
        
        String text = comment.toLowerCase().trim();
        
        // Plástico
        if (text.contains("garrafa") || text.contains("pet") || 
            text.contains("plástico") || text.contains("saco") || 
            text.contains("embalagem") || text.contains("copo") ||
            text.contains("sacola") || text.contains("canudo")) {
            return "Plástico";
        }
        
        // Vidro
        if (text.contains("vidro") || text.contains("caco") || 
            text.contains("garrafa de vidro") || text.contains("pote")) {
            return "Vidro";
        }
        
        // Metal
        if (text.contains("lata") || text.contains("ferro") || 
            text.contains("metal") || text.contains("alumínio") ||
            text.contains("arame")) {
            return "Metal";
        }
        
        // Rede de pesca
        if (text.contains("rede") || text.contains("nylon") || 
            text.contains("corda") || text.contains("anzol") ||
            text.contains("linha")) {
            return "Rede de pesca";
        }
        
        // Resíduo orgânico
        if (text.contains("resto") || text.contains("comida") || 
            text.contains("orgânico") || text.contains("fruta") || 
            text.contains("casca") || text.contains("alimento")) {
            return "Resíduo orgânico";
        }
        
        // Papel
        if (text.contains("papel") || text.contains("papelão") || 
            text.contains("jornal") || text.contains("caixa") ||
            text.contains("papelao")) {
            return "Papel/Papelão";
        }
        
        return "Outro";
    }
}