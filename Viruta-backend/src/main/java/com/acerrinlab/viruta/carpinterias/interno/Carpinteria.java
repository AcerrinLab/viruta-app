package com.acerrinlab.viruta.carpinterias.interno;

import java.util.EnumSet;
import java.util.Set;

import com.acerrinlab.viruta.carpinterias.DatosCarpinteria;
import com.acerrinlab.viruta.carpinterias.Zona;
import com.acerrinlab.viruta.materiales.Material;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

/** Perfil de la carpinteria (RF-13). */
@Entity
@Table(name = "carpinterias")
class Carpinteria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(unique = true, nullable = false)
    Long usuarioId;
    String nombre;
    @Enumerated(EnumType.STRING)
    Zona zona;
    String whatsapp;
    String direccion;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "carpinteria_materiales", joinColumns = @JoinColumn(name = "carpinteria_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "material")
    Set<Material> materiales = EnumSet.noneOf(Material.class);

    /** Solo aparece en el mapa si tiene zona y WhatsApp cargados. */
    boolean visible() {
        return zona != null && whatsapp != null && !whatsapp.isBlank();
    }

    DatosCarpinteria aDatos() {
        return new DatosCarpinteria(id, usuarioId, nombre, zona, whatsapp, direccion, Set.copyOf(materiales));
    }
}
