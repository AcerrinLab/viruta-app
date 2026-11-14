package com.acerrinlab.viruta.usuarios;

import java.util.Optional;

/** Valida la credencial que entrega el boton de Google y devuelve el perfil si es legitima. */
public interface VerificadorGoogle {

    /** false si falta GOOGLE_CLIENT_ID: el ingreso con Google queda apagado. */
    boolean disponible();

    Optional<PerfilGoogle> verificar(String credencial);
}
