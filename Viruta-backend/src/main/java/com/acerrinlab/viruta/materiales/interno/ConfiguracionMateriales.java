package com.acerrinlab.viruta.materiales.interno;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.acerrinlab.viruta.materiales.MaterialesApi;

@Configuration
class ConfiguracionMateriales {

    @Bean
    MaterialesApi materialesApi() {
        return new CalculadorMateriales();
    }
}
