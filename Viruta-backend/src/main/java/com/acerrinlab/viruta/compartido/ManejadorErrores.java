package com.acerrinlab.viruta.compartido;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Convierte los errores en respuestas JSON simples: {"error": "mensaje"}. */
@RestControllerAdvice
public class ManejadorErrores {

    @ExceptionHandler(ErrorNegocio.class)
    public ResponseEntity<Map<String, String>> negocio(ErrorNegocio e) {
        return ResponseEntity.status(e.estado()).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> cuerpoInvalido(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(Map.of("error", "Los datos enviados no son validos."));
    }
}
