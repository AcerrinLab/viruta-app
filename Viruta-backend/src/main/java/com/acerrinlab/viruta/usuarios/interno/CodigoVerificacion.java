package com.acerrinlab.viruta.usuarios.interno;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Codigo pendiente para verificar el telefono. Uno por usuario; se reemplaza al pedir otro. */
@Entity
@Table(name = "codigos_verificacion")
class CodigoVerificacion {

    @Id
    Long usuarioId;
    String telefono;
    String sal;
    String huella;
    Instant vence;
    Instant enviado;
    int intentos;
}
