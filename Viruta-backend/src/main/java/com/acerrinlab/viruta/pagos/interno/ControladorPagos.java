package com.acerrinlab.viruta.pagos.interno;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.acerrinlab.viruta.usuarios.Sesion;

@RestController
class ControladorPagos {

    private final ServicioPagos servicio;

    ControladorPagos(ServicioPagos servicio) {
        this.servicio = servicio;
    }

    /** El cliente acepta el presupuesto y recibe el enlace para pagar la sena. */
    @PostMapping("/api/pagos/pedidos/{id}/iniciar")
    Map<String, String> iniciar(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id) {
        return Map.of("urlPago", servicio.iniciar(id, sesion.id()));
    }

    @PostMapping("/api/pagos/simulado/{id}/aprobar")
    Map<String, String> aprobarSimulado(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id) {
        servicio.aprobarSimulado(id, sesion.id());
        return Map.of("estado", "aprobado");
    }

    /** Aviso de Mercado Pago. Publico, protegido por la firma. */
    @PostMapping("/api/pagos/webhook")
    Map<String, String> aviso(
            @RequestHeader(name = "x-signature", required = false) String firma,
            @RequestHeader(name = "x-request-id", required = false) String idPeticion,
            @RequestParam(name = "data.id", required = false) String idPorParametro,
            @RequestBody(required = false) Map<String, Object> cuerpo) {
        String dataId = idPorParametro;
        if (dataId == null && cuerpo != null && cuerpo.get("data") instanceof Map<?, ?> data && data.get("id") != null) {
            dataId = data.get("id").toString();
        }
        servicio.recibirAviso(firma, idPeticion, dataId);
        return Map.of("estado", "recibido");
    }

    @GetMapping("/api/carpinteria/resumen")
    ServicioPagos.Resumen resumen(@AuthenticationPrincipal Sesion sesion) {
        return servicio.resumen(sesion.id());
    }
}
