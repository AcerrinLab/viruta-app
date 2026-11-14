package com.acerrinlab.viruta.usuarios.interno;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Administradores maestros configurados por variable de entorno (VIRUTA_ADMINS):
 * "Nombre|email|clave;Nombre|email|clave". La clave es opcional: sin clave, el admin entra solo
 * con Google usando ese email. Las claves de menos de 8 caracteres se descartan.
 */
final class ListaAdmins {

    record Admin(String nombre, String email, String clave) {
    }

    private ListaAdmins() {
    }

    static List<Admin> leer(String texto) {
        List<Admin> admins = new ArrayList<>();
        if (texto == null || texto.isBlank()) {
            return admins;
        }
        for (String entrada : texto.split(";")) {
            String[] partes = entrada.split("\\|", -1);
            if (partes.length < 2) {
                continue;
            }
            String nombre = partes[0].trim();
            String email = partes[1].trim().toLowerCase(Locale.ROOT);
            String clave = partes.length > 2 ? partes[2].trim() : "";
            if (nombre.isEmpty() || !email.contains("@") || (!clave.isEmpty() && clave.length() < 8)) {
                continue;
            }
            admins.add(new Admin(nombre, email, clave));
        }
        return admins;
    }
}
