package com.acerrinlab.viruta.compartido;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConfiguracionComun {

    /** Reloj inyectable, para poder probar vencimientos y expiraciones. */
    @Bean
    public Clock reloj() {
        return Clock.systemUTC();
    }
}
