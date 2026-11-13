package com.acerrinlab.viruta.diseno.interno;

import java.time.Instant;

import com.acerrinlab.viruta.diseno.ColorMueble;
import com.acerrinlab.viruta.diseno.DatosDiseno;
import com.acerrinlab.viruta.diseno.Plantilla;
import com.acerrinlab.viruta.materiales.Material;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Proyecto guardado por un cliente (RF-05). */
@Entity
@Table(name = "proyectos")
class Proyecto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    Long clienteId;
    String nombre;
    @Enumerated(EnumType.STRING)
    Plantilla plantilla;
    int ancho;
    int alto;
    int profundidad;
    int estantes;
    @Enumerated(EnumType.STRING)
    Material material;
    @Enumerated(EnumType.STRING)
    ColorMueble color;
    Integer espacioAncho;
    Integer espacioAlto;
    Integer espacioProfAdelante;
    Integer espacioProfAtras;
    int revision;
    Instant actualizado;

    void aplicar(DatosDiseno d) {
        nombre = d.nombre();
        plantilla = d.plantilla();
        ancho = d.ancho();
        alto = d.alto();
        profundidad = d.profundidad();
        estantes = d.estantes();
        material = d.material();
        color = d.color();
        espacioAncho = d.espacioAncho();
        espacioAlto = d.espacioAlto();
        espacioProfAdelante = d.espacioProfAdelante();
        espacioProfAtras = d.espacioProfAtras();
    }

    DatosDiseno aDatos() {
        return new DatosDiseno(nombre, plantilla, ancho, alto, profundidad, estantes, material, color,
                espacioAncho, espacioAlto, espacioProfAdelante, espacioProfAtras);
    }
}
