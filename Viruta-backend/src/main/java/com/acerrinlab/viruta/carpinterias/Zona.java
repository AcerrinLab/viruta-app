package com.acerrinlab.viruta.carpinterias;

/**
 * Zonas de Jujuy donde trabaja una carpinteria. En el mapa se muestra el centro de la zona,
 * no la direccion exacta del taller (RNF-09).
 */
public enum Zona {
    SAN_SALVADOR("San Salvador de Jujuy", -24.1858, -65.2995),
    PALPALA("Palpalá", -24.2566, -65.2117),
    PERICO("Perico", -24.3819, -65.1140),
    EL_CARMEN("El Carmen", -24.3880, -65.2620),
    SAN_PEDRO("San Pedro de Jujuy", -24.2311, -64.8683),
    LIBERTADOR("Libertador Gral. San Martín", -23.8063, -64.7876),
    TILCARA("Tilcara", -23.5776, -65.3930),
    HUMAHUACA("Humahuaca", -23.2054, -65.3497);

    public final String etiqueta;
    public final double latitud;
    public final double longitud;

    Zona(String etiqueta, double latitud, double longitud) {
        this.etiqueta = etiqueta;
        this.latitud = latitud;
        this.longitud = longitud;
    }
}
