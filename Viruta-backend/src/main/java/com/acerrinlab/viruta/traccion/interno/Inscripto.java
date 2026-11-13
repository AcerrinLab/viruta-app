package com.acerrinlab.viruta.traccion.interno;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/** Inscripto en la lista de espera (RF-20). */
@Entity
@Table(name = "inscriptos", uniqueConstraints = @UniqueConstraint(columnNames = { "email", "tipo" }))
class Inscripto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String email;
    /** CLIENTE o CARPINTERIA. */
    String tipo;
    Instant creado;
}
