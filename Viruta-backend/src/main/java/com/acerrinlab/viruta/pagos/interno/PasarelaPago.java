package com.acerrinlab.viruta.pagos.interno;

import java.util.Optional;

/** Patron Adapter: aisla al resto del sistema del proveedor de pagos (RNF-07). */
interface PasarelaPago {

    /** Crea el cobro y devuelve la direccion a la que hay que llevar al cliente para pagar. */
    String crearCobro(long pedidoId, String titulo, long monto);

    /** Consulta un pago en el proveedor. Vacio si no existe o si el proveedor no responde. */
    Optional<PagoExterno> consultar(String pagoId);

    record PagoExterno(boolean aprobado, long pedidoId, String referencia) {
    }
}
