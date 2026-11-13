package com.acerrinlab.viruta.notificaciones;

/** Patron Adapter: canal por el que sale el aviso de WhatsApp (n8n en produccion). */
public interface CanalWhatsapp {

    /** Envia el mensaje. Lanza una excepcion si el envio falla. */
    void enviar(String telefono, String mensaje);
}
