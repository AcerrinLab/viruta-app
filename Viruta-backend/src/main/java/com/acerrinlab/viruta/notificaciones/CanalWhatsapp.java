package com.acerrinlab.viruta.notificaciones;

/** Patron Adapter: canal por el que sale el aviso de WhatsApp (n8n en produccion). */
public interface CanalWhatsapp {

    /** Envia el mensaje. Lanza una excepcion si el envio falla. */
    void enviar(String telefono, String mensaje);

    /**
     * false mientras WhatsApp no este habilitado (falta la API de Meta / el flujo de n8n):
     * los avisos solo quedan en el panel y la verificacion de telefono se muestra como "proximamente".
     */
    default boolean disponible() {
        return true;
    }
}
