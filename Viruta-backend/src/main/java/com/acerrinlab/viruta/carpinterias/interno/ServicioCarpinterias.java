package com.acerrinlab.viruta.carpinterias.interno;

import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.acerrinlab.viruta.carpinterias.CarpinteriasApi;
import com.acerrinlab.viruta.carpinterias.DatosCarpinteria;
import com.acerrinlab.viruta.carpinterias.Zona;
import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.materiales.Material;

@Service
class ServicioCarpinterias implements CarpinteriasApi {

    private final RepositorioCarpinterias carpinterias;

    ServicioCarpinterias(RepositorioCarpinterias carpinterias) {
        this.carpinterias = carpinterias;
    }

    /** Ficha publica: sin WhatsApp ni direccion (RNF-09). */
    record FichaPublica(long id, String nombre, String zona, double latitud, double longitud, Set<Material> materiales) {
    }

    record Perfil(String nombre, Zona zona, String whatsapp, String direccion, Set<Material> materiales, boolean visible) {
    }

    /** Carpinterias visibles que trabajan el material pedido (RF-14). */
    @Transactional(readOnly = true)
    List<FichaPublica> buscar(Material material) {
        return carpinterias.findAll().stream()
                .filter(Carpinteria::visible)
                .filter(c -> material == null || c.materiales.contains(material))
                .map(c -> new FichaPublica(c.id, c.nombre, c.zona.etiqueta, c.zona.latitud, c.zona.longitud,
                        Set.copyOf(c.materiales)))
                .toList();
    }

    @Transactional(readOnly = true)
    Perfil perfil(long usuarioId) {
        return carpinterias.findByUsuarioId(usuarioId).map(ServicioCarpinterias::aPerfil)
                .orElse(new Perfil("", null, "", "", Set.of(), false));
    }

    @Transactional
    Perfil guardar(long usuarioId, String nombre, Zona zona, String whatsapp, String direccion, Set<Material> materiales) {
        if (nombre == null || nombre.isBlank() || nombre.length() > 80) {
            throw ErrorNegocio.invalido("Escribí el nombre de la carpintería.");
        }
        String telefono = whatsapp == null ? "" : whatsapp.replaceAll("[^0-9]", "");
        if (!telefono.isEmpty() && (telefono.length() < 8 || telefono.length() > 15)) {
            throw ErrorNegocio.invalido("El WhatsApp debe tener entre 8 y 15 números.");
        }
        Carpinteria c = carpinterias.findByUsuarioId(usuarioId).orElseGet(() -> {
            Carpinteria nueva = new Carpinteria();
            nueva.usuarioId = usuarioId;
            return nueva;
        });
        c.nombre = nombre.trim();
        c.zona = zona;
        c.whatsapp = telefono;
        c.direccion = direccion == null ? "" : direccion.trim();
        c.materiales = materiales == null || materiales.isEmpty() ? EnumSet.noneOf(Material.class) : EnumSet.copyOf(materiales);
        return aPerfil(carpinterias.save(c));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DatosCarpinteria> porId(long id) {
        return carpinterias.findById(id).map(Carpinteria::aDatos);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DatosCarpinteria> porUsuario(long usuarioId) {
        return carpinterias.findByUsuarioId(usuarioId).map(Carpinteria::aDatos);
    }

    private static Perfil aPerfil(Carpinteria c) {
        return new Perfil(c.nombre, c.zona, c.whatsapp, c.direccion, Set.copyOf(c.materiales), c.visible());
    }
}
