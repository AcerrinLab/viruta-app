package com.acerrinlab.viruta.materiales.interno;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.materiales.ListaMateriales;
import com.acerrinlab.viruta.materiales.Material;
import com.acerrinlab.viruta.materiales.MaterialesApi;
import com.acerrinlab.viruta.materiales.PiezaCorte;
import com.acerrinlab.viruta.materiales.RolPieza;

/** Motor de materiales. Logica pura y determinista, sin dependencias del framework (RNF-01). */
public class CalculadorMateriales implements MaterialesApi {

    private final Map<Material, EstrategiaMaterial> estrategias = new EnumMap<>(Material.class);

    public CalculadorMateriales() {
        for (EstrategiaMaterial e : List.of(new EstrategiaPino(), new EstrategiaMelamina(), new EstrategiaAglomerado())) {
            estrategias.put(e.material(), e);
        }
    }

    @Override
    public ListaMateriales calcular(Material material, List<PiezaCorte> piezas) {
        if (material == null) {
            throw ErrorNegocio.invalido("Falta elegir el material.");
        }
        EstrategiaMaterial estrategia = estrategias.get(material);
        List<PiezaCorte> despiece = agrupar(piezas);

        long superficieMm2 = 0;
        long vidrioMm2 = 0;
        int tornillos = 0;
        int bisagras = 0;
        List<PiezaCorte> madera = new ArrayList<>();
        for (PiezaCorte p : despiece) {
            long area = (long) p.largo() * p.ancho() * p.cantidad();
            if (p.rol() == RolPieza.VIDRIO) {
                vidrioMm2 += area;
            } else {
                superficieMm2 += area;
                madera.add(p);
            }
            tornillos += p.rol().tornillos() * p.cantidad();
            bisagras += p.rol().bisagras() * p.cantidad();
        }
        double superficieM2 = redondear(superficieMm2 / 1_000_000.0, 4);
        double exactas = CalculadorPlacas.placasExactas(madera, estrategia.placaLargo(), estrategia.placaAncho());
        int placas = CalculadorPlacas.placas(madera, estrategia.placaLargo(), estrategia.placaAncho());

        return new ListaMateriales(
                despiece,
                placas,
                redondear(exactas, 2),
                estrategia.placaLargo(),
                estrategia.placaAncho(),
                superficieM2,
                tornillos,
                bisagras,
                estrategia.terminacion(),
                estrategia.litros(superficieM2 * 2),
                redondear(vidrioMm2 / 1_000_000.0, 2));
    }

    /** Junta las piezas iguales en una sola linea del despiece. */
    static List<PiezaCorte> agrupar(List<PiezaCorte> piezas) {
        Map<String, PiezaCorte> grupos = new LinkedHashMap<>();
        for (PiezaCorte p : piezas) {
            if (p.largo() <= 0 || p.ancho() <= 0 || p.cantidad() <= 0) {
                throw ErrorNegocio.invalido("Las medidas de las piezas tienen que ser mayores a cero.");
            }
            String clave = p.nombre() + "|" + p.largo() + "|" + p.ancho() + "|" + p.espesor() + "|" + p.rol();
            grupos.merge(clave, p, (a, b) -> new PiezaCorte(a.nombre(), a.largo(), a.ancho(), a.espesor(),
                    a.cantidad() + b.cantidad(), a.rol()));
        }
        return new ArrayList<>(grupos.values());
    }

    private static double redondear(double valor, int decimales) {
        double factor = Math.pow(10, decimales);
        return Math.round(valor * factor) / factor;
    }
}
