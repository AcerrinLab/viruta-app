package com.acerrinlab.viruta.pedidos.interno;

import java.time.Instant;

import com.acerrinlab.viruta.diseno.ColorMueble;
import com.acerrinlab.viruta.diseno.DatosDiseno;
import com.acerrinlab.viruta.diseno.Plantilla;
import com.acerrinlab.viruta.materiales.Material;
import com.acerrinlab.viruta.pedidos.EstadoPedido;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Pedido de presupuesto. Guarda una copia fija del diseno: si el cliente edita el proyecto
 * despues de enviar, el pedido no cambia (RF-15).
 */
@Entity
@Table(name = "pedidos", uniqueConstraints = @UniqueConstraint(columnNames = { "cliente_id", "clave_envio" }))
class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(name = "cliente_id", nullable = false)
    Long clienteId;
    @Column(nullable = false)
    Long carpinteriaId;
    Long proyectoId;
    /** Clave que manda el navegador: un reintento con la misma clave devuelve el mismo pedido. */
    @Column(name = "clave_envio", nullable = false)
    String claveEnvio;
    @Enumerated(EnumType.STRING)
    EstadoPedido estado;
    String telefonoCliente;
    boolean leido;
    Instant creado;
    Instant presupuestadoEn;
    Instant actualizado;

    // Copia fija del diseno
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

    // Presupuesto de la carpinteria, en pesos enteros
    long montoMateriales;
    long manoDeObra;
    boolean clienteCompraMaterial;
    Integer plazoDias;

    void copiar(DatosDiseno d) {
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

    DatosDiseno diseno() {
        return new DatosDiseno(nombre, plantilla, ancho, alto, profundidad, estantes, material, color,
                espacioAncho, espacioAlto, espacioProfAdelante, espacioProfAtras);
    }

    /** Si el cliente compra el material, a la carpinteria se le paga solo la mano de obra. */
    long total() {
        return (clienteCompraMaterial ? 0 : montoMateriales) + manoDeObra;
    }

    void pasarA(EstadoPedido nuevo, Instant ahora) {
        if (!estado.puedePasarA(nuevo)) {
            throw com.acerrinlab.viruta.compartido.ErrorNegocio.conflicto(
                    "El pedido está en " + estado + " y no puede pasar a " + nuevo + ".");
        }
        estado = nuevo;
        actualizado = ahora;
    }
}
