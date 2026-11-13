package com.acerrinlab.viruta.diseno.interno;

import java.util.List;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.diseno.Aviso;
import com.acerrinlab.viruta.diseno.DatosDiseno;
import com.acerrinlab.viruta.diseno.PiezaDiseno;
import com.acerrinlab.viruta.diseno.ResultadoDiseno;
import com.acerrinlab.viruta.materiales.ListaMateriales;
import com.acerrinlab.viruta.materiales.MaterialesApi;
import com.acerrinlab.viruta.materiales.PiezaCorte;

/** Deriva del proyecto las piezas, los avisos y la lista de materiales. Logica pura. */
public class CalculadorDiseno {

    private final MaterialesApi materiales;

    public CalculadorDiseno(MaterialesApi materiales) {
        this.materiales = materiales;
    }

    public ResultadoDiseno calcular(DatosDiseno d) {
        if (d.material() == null) {
            throw ErrorNegocio.invalido("Falta elegir el material.");
        }
        List<PiezaDiseno> piezas = GeneradorPiezas.generar(d.plantilla(), d.ancho(), d.alto(), d.profundidad(),
                d.estantes(), d.material().espesor());
        List<Aviso> avisos = d.tieneEspacio()
                ? ValidadorEspacio.validar(d.ancho(), d.alto(), d.profundidad(),
                        d.espacioAncho(), d.espacioAlto(), d.espacioProfAdelante(), d.espacioProfAtras())
                : List.of();
        List<PiezaCorte> cortes = piezas.stream()
                .map(p -> new PiezaCorte(p.nombre(), p.largo(), p.ancho(), p.espesor(), 1, p.rol()))
                .toList();
        ListaMateriales lista = materiales.calcular(d.material(), cortes);
        return new ResultadoDiseno(piezas, avisos, lista);
    }
}
