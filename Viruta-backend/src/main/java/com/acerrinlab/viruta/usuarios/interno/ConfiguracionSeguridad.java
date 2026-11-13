package com.acerrinlab.viruta.usuarios.interno;

import java.time.Clock;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.DispatcherType;

/** Seguridad de la API: JWT sin estado, autorizacion por rol y CORS limitado al frontend (RNF-08). */
@Configuration
@EnableWebSecurity
class ConfiguracionSeguridad {

    @Bean
    PasswordEncoder codificador() {
        return new BCryptPasswordEncoder();
    }

    /**
     * La autenticacion es solo por JWT. Este bean evita que Spring cree un usuario en memoria
     * con una contrasena generada (el aviso "Using generated security password").
     */
    @Bean
    UserDetailsService sinUsuariosEnMemoria() {
        return nombre -> {
            throw new UsernameNotFoundException(nombre);
        };
    }

    @Bean
    ServicioJwt servicioJwt(@Value("${viruta.jwt.secreto}") String secreto,
            @Value("${viruta.jwt.horas:24}") long horas, Clock reloj) {
        return new ServicioJwt(secreto, horas, reloj);
    }

    @Bean
    SecurityFilterChain cadena(HttpSecurity http, ServicioJwt jwt) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .authorizeHttpRequests(a -> a
                        .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**", "/api/disenos/calcular", "/api/plantillas",
                                "/api/lista-espera/**", "/api/pagos/webhook", "/api/salud", "/error",
                                "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/carpinterias").permitAll()
                        .requestMatchers("/api/carpinteria/**").hasRole("CARPINTERIA")
                        .requestMatchers("/api/metricas").hasRole("ADMIN")
                        .requestMatchers("/api/proyectos/**", "/api/pedidos/**", "/api/pagos/**").hasRole("CLIENTE")
                        .anyRequest().authenticated())
                .addFilterBefore(new FiltroJwt(jwt), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /** Spring Security busca este bean por su nombre exacto: corsConfigurationSource. */
    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${viruta.cors.origenes}") String origenes) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(origenes.split(",")).map(String::trim).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource fuente = new UrlBasedCorsConfigurationSource();
        fuente.registerCorsConfiguration("/**", config);
        return fuente;
    }
}
