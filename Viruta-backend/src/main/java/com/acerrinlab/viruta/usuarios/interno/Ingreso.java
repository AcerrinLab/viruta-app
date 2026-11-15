package com.acerrinlab.viruta.usuarios.interno;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/** Cada intento de inicio de sesion, exitoso o no. Sirve para avisar ingresos nuevos y para auditar. */
@Entity
@Table(name = "ingresos", indexes = @Index(columnList = "usuarioId"))
class Ingreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    /** null si el email no corresponde a ninguna cuenta. */
    Long usuarioId;
    String email;
    Instant instante;
    String ip;
    String agente;
    /** CLAVE o GOOGLE. */
    String metodo;
    boolean exitoso;
}
