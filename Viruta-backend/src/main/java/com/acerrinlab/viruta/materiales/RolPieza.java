package com.acerrinlab.viruta.materiales;

/** Funcion de la pieza dentro del mueble. Define que herrajes necesita. */
public enum RolPieza {
    /** Lateral o divisor: no suma herrajes propios. */
    VERTICAL(0, 0),
    /** Tapa, base, estante o cubierta: se fija en sus dos extremos. */
    HORIZONTAL(8, 0),
    /** Travesano de refuerzo: dos tornillos por extremo. */
    REFUERZO(4, 0),
    /** Puerta: dos bisagras. */
    PUERTA(0, 2);

    private final int tornillos;
    private final int bisagras;

    RolPieza(int tornillos, int bisagras) {
        this.tornillos = tornillos;
        this.bisagras = bisagras;
    }

    public int tornillos() {
        return tornillos;
    }

    public int bisagras() {
        return bisagras;
    }
}
