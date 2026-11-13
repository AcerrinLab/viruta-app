package com.acerrinlab.viruta.usuarios.interno;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

/** Limite de peticiones por clave en una ventana de tiempo. Protege el inicio de sesion (RNF-08). */
public class LimitadorIntentos {

    private final int maximo;
    private final Duration ventana;
    private final Clock reloj;
    private final Map<String, Deque<Instant>> intentos = new HashMap<>();

    public LimitadorIntentos(int maximo, Duration ventana, Clock reloj) {
        this.maximo = maximo;
        this.ventana = ventana;
        this.reloj = reloj;
    }

    /** Registra un intento y dice si esta permitido. */
    public synchronized boolean permitir(String clave) {
        Instant ahora = reloj.instant();
        Deque<Instant> cola = intentos.computeIfAbsent(clave, k -> new ArrayDeque<>());
        while (!cola.isEmpty() && !cola.peekFirst().plus(ventana).isAfter(ahora)) {
            cola.pollFirst();
        }
        if (cola.size() >= maximo) {
            return false;
        }
        cola.addLast(ahora);
        return true;
    }

    public synchronized void reiniciar(String clave) {
        intentos.remove(clave);
    }
}
