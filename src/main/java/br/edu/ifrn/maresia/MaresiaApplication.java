package br.edu.ifrn.maresia;

import br.edu.ifrn.maresia.usuario.Usuario;
import br.edu.ifrn.maresia.usuario.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MaresiaApplication {

    public static void main(String[] args) {
        SpringApplication.run(MaresiaApplication.class, args);
    }

    @Bean
    public CommandLineRunner initAdmin(UsuarioRepository usuarioRepository) {
        return args -> {
            if (usuarioRepository.count() == 0) {
                Usuario admin = new Usuario();
                admin.setNome("Administrador");
                admin.setEmail("admin@maresia.com");
                admin.setSenha("admin123");
                admin.setAdmin(true);
                usuarioRepository.save(admin);
                System.out.println("🔑 Usuário administrador criado!");
                System.out.println("📧 Email: admin@maresia.com");
                System.out.println("🔒 Senha: admin123");
            }
        };
    }
}