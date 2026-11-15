package com.acerrinlab.viruta.usuarios.interno;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import com.acerrinlab.viruta.usuarios.PerfilGoogle;
import com.acerrinlab.viruta.usuarios.VerificadorGoogle;

/**
 * Valida el ID token de Google Identity Services con Spring Security: firma con las claves
 * publicas de Google, emisor, audiencia (nuestro client id) y vencimiento.
 */
@Component
class VerificadorGoogleJwt implements VerificadorGoogle {

    private static final Logger log = LoggerFactory.getLogger(VerificadorGoogleJwt.class);
    private static final String CLAVES = "https://www.googleapis.com/oauth2/v3/certs";
    private static final List<String> EMISORES = List.of("https://accounts.google.com", "accounts.google.com");

    private final String clientId;
    private JwtDecoder decodificador;

    VerificadorGoogleJwt(@Value("${viruta.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    @Override
    public boolean disponible() {
        return !clientId.isEmpty();
    }

    @Override
    public Optional<PerfilGoogle> verificar(String credencial) {
        if (!disponible() || credencial == null || credencial.isBlank()) {
            return Optional.empty();
        }
        try {
            Jwt jwt = decodificador().decode(credencial);
            return Optional.of(new PerfilGoogle(jwt.getSubject(), jwt.getClaimAsString("email"),
                    Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")),
                    jwt.getClaimAsString("name"), jwt.getClaimAsString("picture")));
        } catch (JwtException e) {
            log.info("Credencial de Google rechazada: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private synchronized JwtDecoder decodificador() {
        if (decodificador == null) {
            NimbusJwtDecoder d = NimbusJwtDecoder.withJwkSetUri(CLAVES).build();
            OAuth2TokenValidator<Jwt> emisor = jwt -> EMISORES.contains(String.valueOf(jwt.getClaims().get("iss")))
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Emisor desconocido", null));
            OAuth2TokenValidator<Jwt> audiencia = jwt -> jwt.getAudience() != null && jwt.getAudience().contains(clientId)
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "No es para Viruta", null));
            d.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), emisor, audiencia));
            decodificador = d;
        }
        return decodificador;
    }
}
