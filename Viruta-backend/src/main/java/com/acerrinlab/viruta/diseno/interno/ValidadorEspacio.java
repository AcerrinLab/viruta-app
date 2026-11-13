package com.acerrinlab.viruta.diseno.interno;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.diseno.Aviso;

/** Compara el mueble con el espacio disponible (RF-02). */
public final class ValidadorEspacio {

    private ValidadorEspacio() {
    }

    public static List<Aviso> validar(int ancho, int alto, int profundidad,
            int espacioAncho, int espacioAlto, int espacioProfAdelante, int espacioProfAtras) {
        if (espacioAncho <= 0 || espacioAlto <= 0 || espacioProfAdelante <= 0 || espacioProfAtras <= 0) {
            throw ErrorNegocio.invalido("Las medidas del espacio tienen que ser mayores a cero.");
        }
        List<Aviso> avisos = new ArrayList<>();
        int profDisponible = Math.min(espacioProfAdelante, espacioProfAtras);
        if (espacioProfAdelante != espacioProfAtras) {
            avisos.add(new Aviso("espacio", Math.abs(espacioProfAdelante - espacioProfAtras),
                    "La profundidad no es igual adelante y atrás. Usamos la menor: " + cm(profDisponible) + " cm."));
        }
        comparar(avisos, "ancho", ancho, espacioAncho);
        comparar(avisos, "alto", alto, espacioAlto);
        comparar(avisos, "profundidad", profundidad, profDisponible);
        return avisos;
    }

    private static void comparar(List<Aviso> avisos, String eje, int mueble, int espacio) {
        if (mueble > espacio) {
            int diferencia = mueble - espacio;
            avisos.add(new Aviso(eje, diferencia, "No entra: sobran " + cm(diferencia) + " cm de " + eje + "."));
        }
    }

    /** Milimetros a centimetros, con un decimal solo si hace falta. */
    static String cm(int mm) {
        if (mm % 10 == 0) {
            return String.valueOf(mm / 10);
        }
        return String.format(Locale.ROOT, "%.1f", mm / 10.0).replace('.', ',');
    }
}
