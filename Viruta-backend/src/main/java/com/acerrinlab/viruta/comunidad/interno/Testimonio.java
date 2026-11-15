package com.acerrinlab.viruta.comunidad.interno;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Comentario de alguien que probo la version de testing. Solo se publica si un admin lo aprueba. */
@Entity
@Table(name = "testimonios")
class Testimonio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    /** Cuenta que lo escribio; null si lo cargo un administrador a mano. */
    Long usuarioId;
    String nombre;
    /** Quien es: "Cliente en Palpala", "Carpinteria en Tilcara", etc. */
    String detalle;
    @Column(length = 600)
    String texto;
    @Column(length = 500)
    String fotoUrl;
    boolean aprobado;
    Instant creado;
}
