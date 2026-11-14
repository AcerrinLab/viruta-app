package com.acerrinlab.viruta.usuarios.interno;

import java.time.Instant;

import com.acerrinlab.viruta.usuarios.Rol;

import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuarios")
class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String nombre;
    @Column(unique = true, nullable = false)
    String email;
    /** Contrasena cifrada con BCrypt. Nunca se guarda en texto plano. */
    String clave;
    @Enumerated(EnumType.STRING)
    Rol rol;
    boolean activo;
    /** Consentimiento explicito para tratar sus datos (Ley 25.326). */
    boolean consentimiento;
    Instant creado;
    /** Foto de perfil (la de Google, si entro con Google). */
    @Column(length = 500)
    String fotoUrl;
    /** Telefono normalizado (10 digitos) y si ya se verifico con un codigo. */
    String telefono;
    /** Con valor por defecto para que la columna se pueda agregar a bases que ya tienen usuarios. */
    @ColumnDefault("false")
    @Column(nullable = false)
    boolean telefonoVerificado;
    /** Identificador de la cuenta de Google vinculada. */
    @Column(unique = true)
    String googleId;
    Instant ultimoIngreso;
}
