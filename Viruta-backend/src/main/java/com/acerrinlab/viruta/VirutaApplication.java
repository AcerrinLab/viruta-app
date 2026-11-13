package com.acerrinlab.viruta;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Monolito modular de Viruta. Cada modulo vive en su paquete, expone una interfaz publica
 * (XxxApi) y guarda su implementacion en el subpaquete "interno" (RNF-06, RNF-07).
 */
@SpringBootApplication
@EnableScheduling
public class VirutaApplication {
    public static void main(String[] args) {
        SpringApplication.run(VirutaApplication.class, args);
    }
}
