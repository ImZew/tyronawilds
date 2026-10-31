package co.edu.unimagdalena.tyronawilds.identidad.infrastructure.config;

import co.edu.unimagdalena.tyronawilds.identidad.infrastructure.adapter.out.persistence.SpringDataUsuarioRepository;
import co.edu.unimagdalena.tyronawilds.identidad.infrastructure.adapter.out.persistence.UsuarioJpaEntity;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class SeedUserPasswordSynchronizer implements ApplicationRunner {

    private static final String SEED_DEFAULT_PASSWORD = "Tyrona2026*";
    private static final List<String> SEED_EMAILS = List.of(
            "admin@tyronawilds.co",
            "tayrona@tyronawilds.co",
            "intruso@tyronawilds.co",
            "turista@tyronawilds.co"
    );

    private final SpringDataUsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public SeedUserPasswordSynchronizer(
            SpringDataUsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (String email : SEED_EMAILS) {
            usuarioRepository.findByEmailIgnoreCase(email).ifPresent(entity -> {
                if (entity.getPasswordHash() == null || !passwordEncoder.matches(SEED_DEFAULT_PASSWORD, entity.getPasswordHash())) {
                    entity.setPasswordHash(passwordEncoder.encode(SEED_DEFAULT_PASSWORD));
                    usuarioRepository.save(entity);
                }
            });
        }
    }
}
