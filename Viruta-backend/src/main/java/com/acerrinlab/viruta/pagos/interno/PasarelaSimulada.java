package com.acerrinlab.viruta.pagos.interno;

import java.util.Optional;

/** Pasarela para desarrollo y demo: lleva a una pantalla propia donde se aprueba el pago a mano. */
class PasarelaSimulada implements PasarelaPago {

    private final String frontend;

    PasarelaSimulada(String frontend) {
        this.frontend = frontend;
    }

    @Override
    public String crearCobro(long pedidoId, String titulo, long monto) {
        return frontend + "/pago-simulado?pedido=" + pedidoId;
    }

    @Override
    public Optional<PagoExterno> consultar(String pagoId) {
        return Optional.empty();
    }
}
