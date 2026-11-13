package com.acerrinlab.viruta.diseno.interno;

import java.time.Clock;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.diseno.DatosDiseno;
import com.acerrinlab.viruta.diseno.DisenoApi;
import com.acerrinlab.viruta.diseno.ResultadoDiseno;
import com.acerrinlab.viruta.materiales.MaterialesApi;

@Service
class ServicioDiseno implements DisenoApi {

    private final RepositorioProyectos proyectos;
    private final CalculadorDiseno calculador;
    private final Clock reloj;

    ServicioDiseno(RepositorioProyectos proyectos, MaterialesApi materiales, Clock reloj) {
        this.proyectos = proyectos;
        this.calculador = new CalculadorDiseno(materiales);
        this.reloj = reloj;
    }

    @Override
    public ResultadoDiseno calcular(DatosDiseno diseno) {
        return calculador.calcular(diseno);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DatosDiseno> proyectoDe(long proyectoId, long clienteId) {
        return proyectos.findByIdAndClienteId(proyectoId, clienteId).map(Proyecto::aDatos);
    }

    @Override
    public long contarProyectos() {
        return proyectos.count();
    }

    @Transactional(readOnly = true)
    List<VistaProyecto> listar(long clienteId) {
        return proyectos.findByClienteIdOrderByActualizadoDesc(clienteId).stream().map(VistaProyecto::de).toList();
    }

    @Transactional(readOnly = true)
    VistaProyecto obtener(long id, long clienteId) {
        return VistaProyecto.de(buscar(id, clienteId));
    }

    /** Guarda solo disenos validos: si las medidas estan fuera de rango, se rechaza y no se pierde lo anterior. */
    @Transactional
    VistaProyecto crear(long clienteId, DatosDiseno datos) {
        calculador.calcular(datos);
        Proyecto p = new Proyecto();
        p.clienteId = clienteId;
        p.aplicar(datos);
        p.revision = 1;
        p.actualizado = reloj.instant();
        return VistaProyecto.de(proyectos.save(p));
    }

    @Transactional
    VistaProyecto actualizar(long id, long clienteId, DatosDiseno datos) {
        calculador.calcular(datos);
        Proyecto p = buscar(id, clienteId);
        p.aplicar(datos);
        p.revision++;
        p.actualizado = reloj.instant();
        return VistaProyecto.de(proyectos.save(p));
    }

    @Transactional
    void borrar(long id, long clienteId) {
        proyectos.delete(buscar(id, clienteId));
    }

    private Proyecto buscar(long id, long clienteId) {
        return proyectos.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos ese proyecto."));
    }
}
